"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const crypto_1 = __importDefault(require("crypto"));
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const ws_1 = require("ws");
const db_1 = require("./db");
const tips_1 = require("./tips");
const spotify_1 = require("./spotify");
const PORT = Number(process.env.PORT) || 4000;
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI ?? `http://localhost:${PORT}/auth/spotify/callback`;
const SPOTIFY_STATE_TTL = 1000 * 60 * 5;
const spotifyStateStore = new Map();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// --- Minimal REST (optional, handy for debug) ---
app.get("/api/items", (_req, res) => {
    res.json((0, db_1.getItems)());
});
app.post("/api/items", (req, res) => {
    const name = (req.body?.name || "").trim();
    if (!name)
        return res.status(400).json({ error: "name required" });
    const item = (0, db_1.createItem)(name);
    broadcast({ type: "item:created", payload: item });
    res.json(item);
});
app.get("/auth/spotify/login", (_req, res) => {
    if (!(0, spotify_1.spotifyAuthConfigured)()) {
        return res
            .status(500)
            .send("Spotify integration is not configured on the server.");
    }
    const state = crypto_1.default.randomBytes(16).toString("hex");
    spotifyStateStore.set(state, Date.now());
    try {
        const authorizeUrl = (0, spotify_1.getSpotifyAuthorizeUrl)(state, SPOTIFY_REDIRECT_URI);
        res.redirect(authorizeUrl);
    }
    catch (error) {
        console.error("[spotify] Failed to build authorize URL", error);
        res.status(500).send("Failed to start Spotify authorization.");
    }
});
app.get("/auth/spotify/callback", async (req, res) => {
    const { code, state, error } = req.query;
    if (error) {
        console.error("[spotify] Authorization error", error);
        return res
            .status(400)
            .send("Spotify authorization was cancelled or denied.");
    }
    if (!state || !spotifyStateStore.has(state)) {
        return res.status(400).send("Invalid or expired authorization state.");
    }
    const issuedAt = spotifyStateStore.get(state);
    spotifyStateStore.delete(state);
    if (Date.now() - issuedAt > SPOTIFY_STATE_TTL) {
        return res.status(400).send("Authorization request timed out. Please try again.");
    }
    if (!code) {
        return res.status(400).send("Missing authorization code from Spotify.");
    }
    const success = await (0, spotify_1.exchangeSpotifyCode)(code, SPOTIFY_REDIRECT_URI);
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
    res.send(`<html><body style="font-family: sans-serif; background: #0b0f1c; color: #f1f5f9; display:flex; align-items:center; justify-content:center; height:100vh;">
      <div style="text-align:center;">
        <h2>Spotify connected!</h2>
        <p>You can close this window and return to the app.</p>
      </div>
    </body></html>`);
});
// You can add simple REST for cat/prefs/stats later if needed.
// --- HTTP + WebSocket ---
const server = http_1.default.createServer(app);
const wss = new ws_1.WebSocketServer({ server });
const clients = new Set();
wss.on("connection", (ws) => {
    clients.add(ws);
    console.log("WS client connected");
    send(ws, { type: "cat:state", payload: (0, db_1.getCatState)() });
    send(ws, { type: "prefs:state", payload: (0, db_1.getUserPreferences)() });
    send(ws, { type: "stats:state", payload: buildStatsPayload() });
    ws.on("message", async (raw) => {
        let msg;
        try {
            msg = JSON.parse(raw.toString());
        }
        catch {
            return send(ws, { type: "error", payload: "Invalid JSON" });
        }
        const { type, payload } = msg || {};
        switch (type) {
            case "ping":
                return send(ws, { type: "pong" });
            // --- Cat State ---
            case "cat:get_state": {
                const cat = (0, db_1.getCatState)();
                return send(ws, { type: "cat:state", payload: cat });
            }
            case "cat:update_state": {
                try {
                    const updated = (0, db_1.updateCatState)((payload || {}));
                    broadcast({ type: "cat:state", payload: updated });
                }
                catch (error) {
                    const message = error instanceof Error
                        ? error.message
                        : "Failed to update cat state";
                    send(ws, { type: "error", payload: message });
                }
                return;
            }
            // --- User Preferences ---
            case "prefs:get": {
                const prefs = (0, db_1.getUserPreferences)();
                return send(ws, { type: "prefs:state", payload: prefs });
            }
            case "prefs:update": {
                const updated = (0, db_1.updateUserPreferences)(payload || {});
                broadcast({ type: "prefs:state", payload: updated });
                return;
            }
            // --- User Stats ---
            case "stats:get": {
                return send(ws, { type: "stats:state", payload: buildStatsPayload() });
            }
            case "stats:update": {
                const patch = payload || {};
                (0, db_1.updateUserStats)(patch);
                if (typeof patch.confidence === "number" ||
                    typeof patch.mood === "string") {
                    try {
                        await (0, tips_1.maybeGenerateDailyTip)();
                    }
                    catch (error) {
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
function send(ws, message) {
    if (ws.readyState === ws_1.WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    }
}
function broadcast(message) {
    const raw = JSON.stringify(message);
    for (const client of clients) {
        if (client.readyState === ws_1.WebSocket.OPEN) {
            client.send(raw);
        }
    }
}
function buildStatsPayload() {
    const stats = (0, db_1.getUserStats)();
    const confidenceMap = (0, db_1.getMoodConfidence)();
    const moodKey = stats.mood;
    const mapConfidence = confidenceMap[moodKey] ?? 0;
    const confidence = typeof stats.confidence === "number" ? stats.confidence : mapConfidence;
    return {
        ...stats,
        confidence,
        confidence_map: confidenceMap,
        spotify_connected: (0, spotify_1.spotifyIntegrationEnabled)(),
    };
}
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
let lastCatState = (0, db_1.getCatState)();
let lastPrefs = (0, db_1.getUserPreferences)();
let lastStatsPayload = buildStatsPayload();
function catStateChanged(prev, next) {
    return (prev.mood !== next.mood ||
        prev.energy !== next.energy ||
        prev.hunger !== next.hunger ||
        prev.last_updated !== next.last_updated);
}
function prefsChanged(prev, next) {
    return (prev.is_student !== next.is_student ||
        prev.theme !== next.theme ||
        prev.last_updated !== next.last_updated);
}
function statsChanged(prev, next) {
    return (prev.mood !== next.mood ||
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
        JSON.stringify(prev.confidence_map) !== JSON.stringify(next.confidence_map));
}
async function pollAndBroadcast() {
    await syncSpotifyPlayback();
    const nextCat = (0, db_1.getCatState)();
    if (catStateChanged(lastCatState, nextCat)) {
        lastCatState = nextCat;
        broadcast({ type: "cat:state", payload: nextCat });
    }
    const nextPrefs = (0, db_1.getUserPreferences)();
    if (prefsChanged(lastPrefs, nextPrefs)) {
        lastPrefs = nextPrefs;
        broadcast({ type: "prefs:state", payload: nextPrefs });
    }
    try {
        await (0, tips_1.maybeGenerateDailyTip)();
    }
    catch (error) {
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
void (0, tips_1.maybeGenerateDailyTip)().catch((error) => console.error("[tips] Failed to generate initial tip", error));
async function syncSpotifyPlayback() {
    if (!(0, spotify_1.spotifyIntegrationEnabled)()) {
        return;
    }
    try {
        const playback = await (0, spotify_1.fetchSpotifyPlayback)();
        if (!playback) {
            return;
        }
        const isPlaying = playback.isPlaying ? 1 : 0;
        const track = playback.track ?? null;
        if (lastStatsPayload.music_is_playing !== isPlaying ||
            (lastStatsPayload.music_track ?? null) !== track) {
            (0, db_1.setMusicPlayback)(playback.isPlaying, track);
            const payload = buildStatsPayload();
            lastStatsPayload = payload;
            broadcast({ type: "stats:state", payload });
        }
    }
    catch (error) {
        console.error("[spotify] Failed to sync playback", error);
    }
}
