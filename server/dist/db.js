"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getItems = getItems;
exports.createItem = createItem;
exports.getCatState = getCatState;
exports.updateCatState = updateCatState;
exports.getUserPreferences = getUserPreferences;
exports.updateUserPreferences = updateUserPreferences;
exports.getUserStats = getUserStats;
exports.getMoodConfidence = getMoodConfidence;
exports.updateMoodConfidence = updateMoodConfidence;
exports.updateUserStats = updateUserStats;
exports.setDailyTip = setDailyTip;
exports.setMusicPlayback = setMusicPlayback;
exports.getSpotifyTokens = getSpotifyTokens;
exports.setSpotifyTokens = setSpotifyTokens;
exports.clearSpotifyTokens = clearSpotifyTokens;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const CAT_ANIMATION_STATES = [
    "idle",
    "idle-alt",
    "sleep",
    "sleepy",
    "excited",
    "surprised",
    "sad",
    "waiting",
    "laydown",
    "shy",
    "dance",
    "sleeping",
    "sleeping-alt",
];
function isCatAnimationState(value) {
    return (typeof value === "string" &&
        CAT_ANIMATION_STATES.includes(value));
}
const dataDir = path_1.default.join(process.cwd(), "data");
fs_1.default.mkdirSync(dataDir, { recursive: true });
const db = new better_sqlite3_1.default(path_1.default.join(dataDir, "data.sqlite"));
db.pragma("journal_mode = WAL");
// Items demo table (existing)
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);
function getItems() {
    return db
        .prepare("SELECT * FROM items ORDER BY updated_at DESC")
        .all();
}
function createItem(name) {
    const stmt = db.prepare(`
    INSERT INTO items (name, updated_at)
    VALUES (?, datetime('now'))
  `);
    const info = stmt.run(name);
    return db
        .prepare("SELECT * FROM items WHERE id = ?")
        .get(info.lastInsertRowid);
}
// --- Cat State (single row) ---
db.exec(`
  CREATE TABLE IF NOT EXISTS cat_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    mood TEXT DEFAULT 'idle',
    energy INTEGER DEFAULT 100,
    hunger INTEGER DEFAULT 0,
    last_updated TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);
db.exec(`
  INSERT OR IGNORE INTO cat_state (id, mood, energy, hunger, last_updated)
  VALUES (1, 'idle', 100, 0, datetime('now'));
`);
function getCatState() {
    return db
        .prepare("SELECT * FROM cat_state WHERE id = 1")
        .get();
}
function updateCatState(patch) {
    const current = getCatState();
    let mood = current.mood;
    if (patch.mood !== undefined) {
        if (!isCatAnimationState(patch.mood)) {
            throw new Error(`Invalid cat state "${patch.mood}". Expected one of: ${CAT_ANIMATION_STATES.join(", ")}`);
        }
        mood = patch.mood;
    }
    const energy = patch.energy ?? current.energy;
    const hunger = patch.hunger ?? current.hunger;
    db.prepare(`
    UPDATE cat_state
    SET mood = ?, energy = ?, hunger = ?, last_updated = datetime('now')
    WHERE id = 1
  `).run(mood, energy, hunger);
    return getCatState();
}
// --- User Preferences (single row) ---
db.exec(`
  CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    is_student INTEGER DEFAULT 0,
    theme TEXT DEFAULT 'light',
    timer_method TEXT DEFAULT 'pomodoro',
    last_updated TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);
db.exec(`
  INSERT OR IGNORE INTO user_preferences (id, is_student, theme, timer_method, last_updated)
  VALUES (1, 0, 'light', 'pomodoro', datetime('now'));
`);
const userPreferencesColumns = db
    .prepare("PRAGMA table_info(user_preferences)")
    .all();
if (!userPreferencesColumns.some((column) => column.name === "timer_method")) {
    db.exec("ALTER TABLE user_preferences ADD COLUMN timer_method TEXT DEFAULT 'pomodoro'");
}
function getUserPreferences() {
    return db
        .prepare("SELECT id, is_student, theme, COALESCE(timer_method, 'pomodoro') AS timer_method, last_updated FROM user_preferences WHERE id = 1")
        .get();
}
function updateUserPreferences(patch) {
    const current = getUserPreferences();
    const is_student = patch.is_student !== undefined
        ? patch.is_student
            ? 1
            : 0
        : current.is_student;
    const theme = patch.theme ?? current.theme;
    const timer_method = patch.timer_method ?? current.timer_method;
    db.prepare(`
    UPDATE user_preferences
    SET is_student = ?, theme = ?, timer_method = ?, last_updated = datetime('now')
    WHERE id = 1
  `).run(is_student, theme, timer_method);
    return getUserPreferences();
}
// --- User Stats (single row) ---
db.exec(`
  CREATE TABLE IF NOT EXISTS user_stats (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    mood TEXT DEFAULT 'ok',
    room_temperature REAL DEFAULT 22.0,
    focus_level INTEGER DEFAULT 5,
    confidence REAL DEFAULT 0,
    noise_pollution REAL DEFAULT 0,
    music_is_playing INTEGER DEFAULT 0,
    music_track TEXT,
    daily_tip TEXT,
    tip_generated_at TEXT,
    last_updated TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);
// Confidence per mood lives in a dedicated table so that each animation state can
// carry its own score.
db.exec(`
  CREATE TABLE IF NOT EXISTS mood_confidence (
    mood TEXT PRIMARY KEY,
    confidence REAL NOT NULL DEFAULT 0
  );
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS spotify_tokens (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    access_token TEXT,
    refresh_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);
db.exec(`INSERT OR IGNORE INTO spotify_tokens (id) VALUES (1);`);
const ensureConfidenceRow = db.prepare(`INSERT OR IGNORE INTO mood_confidence (mood, confidence) VALUES (?, 0)`);
CAT_ANIMATION_STATES.forEach((state) => ensureConfidenceRow.run(state));
db.exec(`
  INSERT OR IGNORE INTO user_stats (id, mood, room_temperature, focus_level, last_updated)
  VALUES (1, 'ok', 22.0, 5, datetime('now'));
`);
const userStatsColumns = db.prepare("PRAGMA table_info(user_stats)").all();
if (!userStatsColumns.some((column) => column.name === "confidence")) {
    db.exec("ALTER TABLE user_stats ADD COLUMN confidence REAL DEFAULT 0");
}
if (!userStatsColumns.some((column) => column.name === "noise_pollution")) {
    db.exec("ALTER TABLE user_stats ADD COLUMN noise_pollution REAL DEFAULT 0");
}
if (!userStatsColumns.some((column) => column.name === "daily_tip")) {
    db.exec("ALTER TABLE user_stats ADD COLUMN daily_tip TEXT");
}
if (!userStatsColumns.some((column) => column.name === "tip_generated_at")) {
    db.exec("ALTER TABLE user_stats ADD COLUMN tip_generated_at TEXT");
}
if (!userStatsColumns.some((column) => column.name === "music_is_playing")) {
    db.exec("ALTER TABLE user_stats ADD COLUMN music_is_playing INTEGER DEFAULT 0");
}
if (!userStatsColumns.some((column) => column.name === "music_track")) {
    db.exec("ALTER TABLE user_stats ADD COLUMN music_track TEXT");
}
function getUserStats() {
    return db
        .prepare(`SELECT id,
              mood,
              room_temperature,
              focus_level,
              COALESCE(confidence, 0) AS confidence,
              COALESCE(noise_pollution, 0) AS noise_pollution,
              COALESCE(music_is_playing, 0) AS music_is_playing,
              music_track,
              daily_tip,
              tip_generated_at,
              last_updated
       FROM user_stats
       WHERE id = 1`)
        .get();
}
function getMoodConfidence() {
    const rows = db
        .prepare("SELECT mood, confidence FROM mood_confidence")
        .all();
    const map = {};
    CAT_ANIMATION_STATES.forEach((state) => {
        map[state] = 0;
    });
    rows.forEach((row) => {
        map[row.mood] = row.confidence ?? 0;
    });
    return map;
}
function updateMoodConfidence(mood, confidence) {
    db.prepare(`
    INSERT INTO mood_confidence (mood, confidence)
    VALUES (?, ?)
    ON CONFLICT(mood) DO UPDATE SET confidence = excluded.confidence
  `).run(mood, confidence);
}
function updateUserStats(patch) {
    const current = getUserStats();
    const mood = patch.mood ?? current.mood;
    const room_temperature = patch.room_temperature ?? current.room_temperature;
    const focus_level = patch.focus_level ?? current.focus_level;
    const confidence = patch.confidence !== undefined ? patch.confidence : current.confidence;
    const noise_pollution = patch.noise_pollution !== undefined
        ? patch.noise_pollution
        : current.noise_pollution;
    const music_is_playing = patch.music_is_playing !== undefined
        ? patch.music_is_playing
        : current.music_is_playing ?? 0;
    const music_track = patch.music_track !== undefined ? patch.music_track : current.music_track;
    db.prepare(`
    UPDATE user_stats
    SET mood = ?, room_temperature = ?, focus_level = ?, confidence = ?, noise_pollution = ?, music_is_playing = ?, music_track = ?, last_updated = datetime('now')
    WHERE id = 1
  `).run(mood, room_temperature, focus_level, confidence, noise_pollution, music_is_playing, music_track);
    if (patch.confidence !== undefined &&
        patch.mood &&
        isCatAnimationState(patch.mood)) {
        updateMoodConfidence(patch.mood, patch.confidence);
    }
    return getUserStats();
}
function setDailyTip(tip, generatedAt) {
    db.prepare(`
    UPDATE user_stats
    SET daily_tip = ?, tip_generated_at = ?
    WHERE id = 1
  `).run(tip, generatedAt);
}
function setMusicPlayback(isPlaying, track) {
    db.prepare(`
    UPDATE user_stats
    SET music_is_playing = ?, music_track = ?, last_updated = datetime('now')
    WHERE id = 1
  `).run(isPlaying ? 1 : 0, track ?? null);
    return getUserStats();
}
function getSpotifyTokens() {
    return db
        .prepare(`SELECT id,
              access_token,
              refresh_token,
              expires_at,
              token_type,
              scope,
              updated_at
       FROM spotify_tokens
       WHERE id = 1`)
        .get();
}
function setSpotifyTokens(update) {
    const current = getSpotifyTokens();
    const accessToken = update.accessToken !== undefined ? update.accessToken : current.access_token;
    const refreshToken = update.refreshToken !== undefined
        ? update.refreshToken
        : current.refresh_token;
    const expiresAt = update.expiresAt !== undefined ? update.expiresAt : current.expires_at;
    const tokenType = update.tokenType !== undefined ? update.tokenType : current.token_type;
    const scope = update.scope !== undefined ? update.scope : current.scope;
    db.prepare(`
    UPDATE spotify_tokens
    SET access_token = ?,
        refresh_token = ?,
        expires_at = ?,
        token_type = ?,
        scope = ?,
        updated_at = datetime('now')
    WHERE id = 1
  `).run(accessToken, refreshToken, expiresAt, tokenType, scope);
    return getSpotifyTokens();
}
function clearSpotifyTokens() {
    db.prepare(`
    UPDATE spotify_tokens
    SET access_token = NULL,
        refresh_token = NULL,
        expires_at = NULL,
        token_type = NULL,
        scope = NULL,
        updated_at = datetime('now')
    WHERE id = 1
  `).run();
    return getSpotifyTokens();
}
