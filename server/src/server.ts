import "dotenv/config";
import crypto from "crypto";
import express from "express";
import http from "http";
import cors from "cors";
import { WebSocketServer, WebSocket } from "ws";
import {
  getItems,
  createItem,
  getCatState,
  updateCatState,
  getUserPreferences,
  updateUserPreferences,
  getUserStats,
  updateUserStats,
  getMoodConfidence,
  setMusicPlayback,
  type CatAnimationState,
} from "./db";
import { maybeGenerateDailyTip } from "./tips";
import {
  exchangeSpotifyCode,
  fetchSpotifyPlayback,
  getSpotifyAuthorizeUrl,
  spotifyAuthConfigured,
  spotifyIntegrationEnabled,
} from "./spotify";

const PORT = Number(process.env.PORT) || 4000;
const SPOTIFY_REDIRECT_URI =
  process.env.SPOTIFY_REDIRECT_URI ??
  `http://localhost:${PORT}/auth/spotify/callback`;
const SPOTIFY_STATE_TTL = 1000 * 60 * 5;

const spotifyStateStore = new Map<string, number>();

const app = express();
app.use(cors());
app.use(express.json());

// --- Minimal REST (optional, handy for debug) ---

app.get("/api/items", (_req, res) => {
  res.json(getItems());
});

app.post("/api/items", (req, res) => {
  const name = (req.body?.name || "").trim();
  if (!name) return res.status(400).json({ error: "name required" });

  const item = createItem(name);
  broadcast({ type: "item:created", payload: item });
  res.json(item);
});

app.get("/auth/spotify/login", (_req, res) => {
  if (!spotifyAuthConfigured()) {
    return res
      .status(500)
      .send("Spotify integration is not configured on the server.");
  }

  const state = crypto.randomBytes(16).toString("hex");
  spotifyStateStore.set(state, Date.now());

  try {
    const authorizeUrl = getSpotifyAuthorizeUrl(state, SPOTIFY_REDIRECT_URI);
    res.redirect(authorizeUrl);
  } catch (error) {
    console.error("[spotify] Failed to build authorize URL", error);
    res.status(500).send("Failed to start Spotify authorization.");
  }
});

app.get("/auth/spotify/callback", async (req, res) => {
  const { code, state, error } = req.query as {
    code?: string;
    state?: string;
    error?: string;
  };

  if (error) {
    console.error("[spotify] Authorization error", error);
    return res
      .status(400)
      .send("Spotify authorization was cancelled or denied.");
  }

  if (!state || !spotifyStateStore.has(state)) {
    return res.status(400).send("Invalid or expired authorization state.");
  }

  const issuedAt = spotifyStateStore.get(state)!;
  spotifyStateStore.delete(state);

  if (Date.now() - issuedAt > SPOTIFY_STATE_TTL) {
    return res
      .status(400)
      .send("Authorization request timed out. Please try again.");
  }

  if (!code) {
    return res.status(400).send("Missing authorization code from Spotify.");
  }

  const success = await exchangeSpotifyCode(code, SPOTIFY_REDIRECT_URI);
  if (!success) {
    return res
      .status(500)
      .send("Failed to link Spotify account. Please try again.");
  }

  await syncSpotifyPlayback();
  const payload = buildStatsPayload();
  lastStatsPayload = payload;
  broadcast({ type: "stats:state", payload });

  res.setHeader("Content-Type", "text/html");
  res.send(
    `<html><body style="font-family: sans-serif; background: #0b0f1c; color: #f1f5f9; display:flex; align-items:center; justify-content:center; height:100vh;">
      <div style="text-align:center;">
        <h2>Spotify connected!</h2>
        <p>You can close this window and return to the app.</p>
      </div>
    </body></html>`
  );
});

// You can add simple REST for cat/prefs/stats later if needed.

// --- HTTP + WebSocket ---

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const clients = new Set<WebSocket>();

wss.on("connection", (ws) => {
  clients.add(ws);
  console.log("WS client connected");

  send(ws, { type: "cat:state", payload: getCatState() });
  send(ws, { type: "prefs:state", payload: getUserPreferences() });
  send(ws, { type: "stats:state", payload: buildStatsPayload() });

  ws.on("message", async (raw) => {
    let msg: any;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return send(ws, { type: "error", payload: "Invalid JSON" });
    }

    const { type, payload } = msg || {};

    switch (type) {
      case "ping":
        return send(ws, { type: "pong" });

      // --- Cat State ---

      case "cat:get_state": {
        const cat = getCatState();
        return send(ws, { type: "cat:state", payload: cat });
      }

      case "cat:update_state": {
        try {
          const updated = updateCatState((payload || {}) as any);
          broadcast({ type: "cat:state", payload: updated });
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to update cat state";
          send(ws, { type: "error", payload: message });
        }
        return;
      }

      // --- User Preferences ---

      case "prefs:get": {
        const prefs = getUserPreferences();
        return send(ws, { type: "prefs:state", payload: prefs });
      }

      case "prefs:update": {
        const updated = updateUserPreferences(payload || {});
        broadcast({ type: "prefs:state", payload: updated });
        return;
      }

      // --- User Stats ---

      case "stats:get": {
        return send(ws, { type: "stats:state", payload: buildStatsPayload() });
      }

      case "stats:update": {
        const patch = payload || {};
        updateUserStats(patch);
        if (
          typeof patch.confidence === "number" ||
          typeof patch.mood === "string"
        ) {
          try {
            await maybeGenerateDailyTip();
          } catch (error) {
            console.error("[tips] Failed to generate tip", error);
          }
        }
        broadcast({ type: "stats:state", payload: buildStatsPayload() });
        return;
      }

      default:
        return send(ws, { type: "error", payload: "Unknown type" });
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log("WS client disconnected");
  });
});

function send(ws: WebSocket, message: any) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function broadcast(message: any) {
  const raw = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(raw);
    }
  }
}

function buildStatsPayload() {
  const stats = getUserStats();
  const confidenceMap = getMoodConfidence();
  const moodKey = stats.mood as CatAnimationState;
  const mapConfidence = confidenceMap[moodKey] ?? 0;
  const confidence =
    typeof stats.confidence === "number" ? stats.confidence : mapConfidence;
  return {
    ...stats,
    confidence,
    confidence_map: confidenceMap,
    spotify_connected: spotifyIntegrationEnabled(),
  };
}

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

let lastCatState = getCatState();
let lastPrefs = getUserPreferences();
let lastStatsPayload = buildStatsPayload();

function catStateChanged(
  prev: ReturnType<typeof getCatState>,
  next: typeof prev
) {
  return (
    prev.mood !== next.mood ||
    prev.energy !== next.energy ||
    prev.hunger !== next.hunger ||
    prev.last_updated !== next.last_updated
  );
}

function prefsChanged(
  prev: ReturnType<typeof getUserPreferences>,
  next: typeof prev
) {
  return (
    prev.is_student !== next.is_student ||
    prev.theme !== next.theme ||
    prev.last_updated !== next.last_updated
  );
}

function statsChanged(
  prev: ReturnType<typeof buildStatsPayload>,
  next: ReturnType<typeof buildStatsPayload>
) {
  return (
    prev.mood !== next.mood ||
    prev.room_temperature !== next.room_temperature ||
    prev.focus_level !== next.focus_level ||
    prev.confidence !== next.confidence ||
    prev.noise_pollution !== next.noise_pollution ||
    prev.music_is_playing !== next.music_is_playing ||
    prev.music_track !== next.music_track ||
    prev.spotify_connected !== next.spotify_connected ||
    prev.daily_tip !== next.daily_tip ||
    prev.tip_generated_at !== next.tip_generated_at ||
    prev.last_updated !== next.last_updated ||
    JSON.stringify(prev.confidence_map) !== JSON.stringify(next.confidence_map)
  );
}

async function pollAndBroadcast() {
  await syncSpotifyPlayback();

  const nextCat = getCatState();
  if (catStateChanged(lastCatState, nextCat)) {
    lastCatState = nextCat;
    broadcast({ type: "cat:state", payload: nextCat });
  }

  const nextPrefs = getUserPreferences();
  if (prefsChanged(lastPrefs, nextPrefs)) {
    lastPrefs = nextPrefs;
    broadcast({ type: "prefs:state", payload: nextPrefs });
  }

  try {
    await maybeGenerateDailyTip();
  } catch (error) {
    console.error("[tips] Failed to refresh tip", error);
  }

  const nextStatsPayload = buildStatsPayload();
  if (statsChanged(lastStatsPayload, nextStatsPayload)) {
    lastStatsPayload = nextStatsPayload;
    broadcast({ type: "stats:state", payload: nextStatsPayload });
  }
}

setInterval(() => {
  void pollAndBroadcast();
}, 1500);

void maybeGenerateDailyTip().catch((error) =>
  console.error("[tips] Failed to generate initial tip", error)
);

async function syncSpotifyPlayback() {
  if (!spotifyIntegrationEnabled()) {
    return;
  }

  try {
    const playback = await fetchSpotifyPlayback();
    if (!playback) {
      return;
    }

    const isPlaying = playback.isPlaying ? 1 : 0;
    const track = playback.track ?? null;
    if (
      lastStatsPayload.music_is_playing !== isPlaying ||
      (lastStatsPayload.music_track ?? null) !== track
    ) {
      setMusicPlayback(playback.isPlaying, track);
      const payload = buildStatsPayload();
      lastStatsPayload = payload;
      broadcast({ type: "stats:state", payload });
    }
  } catch (error) {
    console.error("[spotify] Failed to sync playback", error);
  }
}
