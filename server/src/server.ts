import "dotenv/config";
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
  type CatAnimationState,
} from "./db";

const PORT = Number(process.env.PORT) || 4000;

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

  ws.on("message", (raw) => {
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
        if (typeof patch.confidence === "number") {
          lastConfidenceValue = patch.confidence;
        }
        updateUserStats(patch);
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
  const confidence = lastConfidenceValue ?? mapConfidence;
  return { ...stats, confidence, confidence_map: confidenceMap };
}

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

let lastCatState = getCatState();
let lastPrefs = getUserPreferences();
let lastConfidenceValue: number | null = null;
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
    prev.last_updated !== next.last_updated ||
    JSON.stringify(prev.confidence_map) !== JSON.stringify(next.confidence_map)
  );
}

setInterval(() => {
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

  const nextStatsPayload = buildStatsPayload();
  if (statsChanged(lastStatsPayload, nextStatsPayload)) {
    lastStatsPayload = nextStatsPayload;
    lastConfidenceValue = nextStatsPayload.confidence ?? lastConfidenceValue;
    broadcast({ type: "stats:state", payload: nextStatsPayload });
  }
}, 1500);
