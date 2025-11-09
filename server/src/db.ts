import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

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
  "sleeping",
  "sleeping-alt",
] as const;

export type CatAnimationState = (typeof CAT_ANIMATION_STATES)[number];

function isCatAnimationState(value: unknown): value is CatAnimationState {
  return (
    typeof value === "string" &&
    CAT_ANIMATION_STATES.includes(value as CatAnimationState)
  );
}

type ItemRow = {
  id: number;
  name: string;
  updated_at: string;
};

type CatStateRow = {
  id: number;
  mood: CatAnimationState;
  energy: number;
  hunger: number;
  last_updated: string;
};

type UserPreferencesRow = {
  id: number;
  is_student: number;
  theme: string;
  last_updated: string;
};

type UserStatsRow = {
  id: number;
  mood: string;
  room_temperature: number;
  focus_level: number;
  last_updated: string;
};

const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "data.sqlite"));

db.pragma("journal_mode = WAL");

// Items demo table (existing)
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export function getItems(): ItemRow[] {
  return db
    .prepare("SELECT * FROM items ORDER BY updated_at DESC")
    .all() as ItemRow[];
}

export function createItem(name: string): ItemRow {
  const stmt = db.prepare(`
    INSERT INTO items (name, updated_at)
    VALUES (?, datetime('now'))
  `);
  const info = stmt.run(name);
  return db
    .prepare("SELECT * FROM items WHERE id = ?")
    .get(info.lastInsertRowid) as ItemRow;
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

export function getCatState(): CatStateRow {
  return db
    .prepare("SELECT * FROM cat_state WHERE id = 1")
    .get() as CatStateRow;
}

export function updateCatState(
  patch: Partial<{ mood: CatAnimationState; energy: number; hunger: number }>
) {
  const current = getCatState();

  let mood = current.mood;
  if (patch.mood !== undefined) {
    if (!isCatAnimationState(patch.mood)) {
      throw new Error(
        `Invalid cat state "${
          patch.mood
        }". Expected one of: ${CAT_ANIMATION_STATES.join(", ")}`
      );
    }
    mood = patch.mood;
  }

  const energy = patch.energy ?? current.energy;
  const hunger = patch.hunger ?? current.hunger;

  db.prepare(
    `
    UPDATE cat_state
    SET mood = ?, energy = ?, hunger = ?, last_updated = datetime('now')
    WHERE id = 1
  `
  ).run(mood, energy, hunger);

  return getCatState();
}

// --- User Preferences (single row) ---

db.exec(`
  CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    is_student INTEGER DEFAULT 0,
    theme TEXT DEFAULT 'light',
    last_updated TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

db.exec(`
  INSERT OR IGNORE INTO user_preferences (id, is_student, theme, last_updated)
  VALUES (1, 0, 'light', datetime('now'));
`);

export function getUserPreferences(): UserPreferencesRow {
  return db
    .prepare("SELECT * FROM user_preferences WHERE id = 1")
    .get() as UserPreferencesRow;
}

export function updateUserPreferences(
  patch: Partial<{ is_student: boolean; theme: string }>
) {
  const current = getUserPreferences();
  const is_student =
    patch.is_student !== undefined
      ? patch.is_student
        ? 1
        : 0
      : current.is_student;
  const theme = patch.theme ?? current.theme;

  db.prepare(
    `
    UPDATE user_preferences
    SET is_student = ?, theme = ?, last_updated = datetime('now')
    WHERE id = 1
  `
  ).run(is_student, theme);

  return getUserPreferences();
}

// --- User Stats (single row) ---

db.exec(`
  CREATE TABLE IF NOT EXISTS user_stats (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    mood TEXT DEFAULT 'ok',
    room_temperature REAL DEFAULT 22.0,
    focus_level INTEGER DEFAULT 5,
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

const ensureConfidenceRow = db.prepare(
  `INSERT OR IGNORE INTO mood_confidence (mood, confidence) VALUES (?, 0)`
);
CAT_ANIMATION_STATES.forEach((state) => ensureConfidenceRow.run(state));

db.exec(`
  INSERT OR IGNORE INTO user_stats (id, mood, room_temperature, focus_level, last_updated)
  VALUES (1, 'ok', 22.0, 5, datetime('now'));
`);

export function getUserStats(): UserStatsRow {
  return db
    .prepare("SELECT * FROM user_stats WHERE id = 1")
    .get() as UserStatsRow;
}

export function getMoodConfidence(): Record<CatAnimationState, number> {
  const rows = db
    .prepare("SELECT mood, confidence FROM mood_confidence")
    .all() as { mood: CatAnimationState; confidence: number }[];

  const map = {} as Record<CatAnimationState, number>;
  CAT_ANIMATION_STATES.forEach((state) => {
    map[state] = 0;
  });
  rows.forEach((row) => {
    map[row.mood] = row.confidence ?? 0;
  });

  return map;
}

export function updateMoodConfidence(
  mood: CatAnimationState,
  confidence: number
) {
  db.prepare(
    `
    INSERT INTO mood_confidence (mood, confidence)
    VALUES (?, ?)
    ON CONFLICT(mood) DO UPDATE SET confidence = excluded.confidence
  `
  ).run(mood, confidence);
}

export function updateUserStats(
  patch: Partial<{
    mood: string;
    room_temperature: number;
    focus_level: number;
    confidence: number;
  }>
) {
  const current = getUserStats();
  const mood = patch.mood ?? current.mood;
  const room_temperature = patch.room_temperature ?? current.room_temperature;
  const focus_level = patch.focus_level ?? current.focus_level;

  db.prepare(
    `
    UPDATE user_stats
    SET mood = ?, room_temperature = ?, focus_level = ?, last_updated = datetime('now')
    WHERE id = 1
  `
  ).run(mood, room_temperature, focus_level);

  if (patch.confidence !== undefined && isCatAnimationState(patch.mood)) {
    updateMoodConfidence(patch.mood, patch.confidence);
  }

  return getUserStats();
}
