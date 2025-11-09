"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const ws_1 = require("ws");
const db_1 = require("./db");
const PORT = Number(process.env.PORT) || 4000;
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
    send(ws, { type: "stats:state", payload: (0, db_1.getUserStats)() });
    ws.on("message", (raw) => {
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
                const stats = (0, db_1.getUserStats)();
                return send(ws, { type: "stats:state", payload: stats });
            }
            case "stats:update": {
                const updated = (0, db_1.updateUserStats)(payload || {});
                broadcast({ type: "stats:state", payload: updated });
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
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
let lastCatState = (0, db_1.getCatState)();
let lastPrefs = (0, db_1.getUserPreferences)();
let lastStats = (0, db_1.getUserStats)();
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
        prev.last_updated !== next.last_updated);
}
setInterval(() => {
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
    const nextStats = (0, db_1.getUserStats)();
    if (statsChanged(lastStats, nextStats)) {
        lastStats = nextStats;
        broadcast({ type: "stats:state", payload: nextStats });
    }
}, 1500);
