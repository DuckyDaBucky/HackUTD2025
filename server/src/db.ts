import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

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
] as const;

export type CatAnimationState = (typeof CAT_ANIMATION_STATES)[number];

function isCatAnimationState(value: unknown): value is CatAnimationState {
  return (
    typeof value === "string" &&
    CAT_ANIMATION_STATES.includes(value as CatAnimationState)
  );
}

// Helper to get pet ID from parameter or default
function getPetId(petId?: string): string {
  return petId || "default";
}

// Helper to create prefixed keys
function key(petId: string, type: string): string {
  return `pet:${petId}:${type}`;
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
  timer_method: string;
  last_updated: string;
};

type UserStatsRow = {
  id: number;
  mood: string;
  room_temperature: number;
  focus_level: number;
  confidence: number;
  noise_pollution: number;
  music_is_playing: number;
  music_track: string | null;
  daily_tip: string | null;
  tip_generated_at: string | null;
  last_updated: string;
};

type SpotifyTokenRow = {
  id: number;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: number | null;
  token_type: string | null;
  scope: string | null;
  updated_at: string;
};

// Initialize database - no-op for Redis, but kept for compatibility
export async function initDatabase(): Promise<void> {
  // Upstash Redis doesn't need initialization
  console.log("[db] Upstash Redis ready");
}

// Items - stored as JSON array
export async function getItems(petId?: string): Promise<ItemRow[]> {
  const pet = getPetId(petId);
  const items = (await redis.get<ItemRow[]>(key(pet, "items"))) || [];
  return items.sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

export async function createItem(
  name: string,
  petId?: string
): Promise<ItemRow> {
  const pet = getPetId(petId);
  const items = await getItems(pet);
  const newId = items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1;
  const newItem: ItemRow = {
    id: newId,
    name,
    updated_at: new Date().toISOString(),
  };
  items.push(newItem);
  await redis.set(key(pet, "items"), items);
  return newItem;
}

// Cat State
const DEFAULT_CAT_STATE: Omit<CatStateRow, "id"> = {
  mood: "idle",
  energy: 100,
  hunger: 0,
  last_updated: new Date().toISOString(),
};

export async function getCatState(petId?: string): Promise<CatStateRow> {
  const pet = getPetId(petId);
  const state =
    (await redis.get<Omit<CatStateRow, "id">>(key(pet, "cat_state"))) ||
    DEFAULT_CAT_STATE;
  return { id: 1, ...state };
}

export async function updateCatState(
  patch: Partial<{ mood: CatAnimationState; energy: number; hunger: number }>,
  petId?: string
): Promise<CatStateRow> {
  const pet = getPetId(petId);
  const current = await getCatState(pet);

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

  const updated: Omit<CatStateRow, "id"> = {
    mood,
    energy: patch.energy ?? current.energy,
    hunger: patch.hunger ?? current.hunger,
    last_updated: new Date().toISOString(),
  };

  await redis.set(key(pet, "cat_state"), updated);
  return { id: 1, ...updated };
}

// User Preferences
const DEFAULT_PREFS: Omit<UserPreferencesRow, "id"> = {
  is_student: 0,
  theme: "light",
  timer_method: "pomodoro",
  last_updated: new Date().toISOString(),
};

export async function getUserPreferences(
  petId?: string
): Promise<UserPreferencesRow> {
  const pet = getPetId(petId);
  const prefs =
    (await redis.get<Omit<UserPreferencesRow, "id">>(
      key(pet, "user_preferences")
    )) || DEFAULT_PREFS;
  return { id: 1, ...prefs };
}

export async function updateUserPreferences(
  patch: Partial<{ is_student: boolean; theme: string; timer_method: string }>,
  petId?: string
): Promise<UserPreferencesRow> {
  const pet = getPetId(petId);
  const current = await getUserPreferences(pet);
  const updated: Omit<UserPreferencesRow, "id"> = {
    is_student:
      patch.is_student !== undefined
        ? patch.is_student
          ? 1
          : 0
        : current.is_student,
    theme: patch.theme ?? current.theme,
    timer_method: patch.timer_method ?? current.timer_method,
    last_updated: new Date().toISOString(),
  };
  await redis.set(key(pet, "user_preferences"), updated);
  return { id: 1, ...updated };
}

// User Stats
const DEFAULT_STATS: Omit<UserStatsRow, "id"> = {
  mood: "ok",
  room_temperature: 22.0,
  focus_level: 5,
  confidence: 0,
  noise_pollution: 0,
  music_is_playing: 0,
  music_track: null,
  daily_tip: null,
  tip_generated_at: null,
  last_updated: new Date().toISOString(),
};

export async function getUserStats(petId?: string): Promise<UserStatsRow> {
  const pet = getPetId(petId);
  const stats =
    (await redis.get<Omit<UserStatsRow, "id">>(key(pet, "user_stats"))) ||
    DEFAULT_STATS;
  return {
    id: 1,
    ...DEFAULT_STATS,
    ...stats,
    confidence: stats.confidence ?? 0,
    noise_pollution: stats.noise_pollution ?? 0,
    music_is_playing: stats.music_is_playing ?? 0,
  };
}

// Mood Confidence - stored as a map
export async function getMoodConfidence(
  petId?: string
): Promise<Record<CatAnimationState, number>> {
  const pet = getPetId(petId);
  const confidence =
    (await redis.get<Partial<Record<CatAnimationState, number>>>(
      key(pet, "mood_confidence")
    )) || {};

  const map = {} as Record<CatAnimationState, number>;
  CAT_ANIMATION_STATES.forEach((state) => {
    map[state] = confidence[state] ?? 0;
  });
  return map;
}

export async function updateMoodConfidence(
  mood: CatAnimationState,
  confidence: number,
  petId?: string
): Promise<void> {
  const pet = getPetId(petId);
  const current = await getMoodConfidence(pet);
  current[mood] = confidence;
  await redis.set(key(pet, "mood_confidence"), current);
}

export async function updateUserStats(
  patch: Partial<{
    mood: string;
    room_temperature: number;
    focus_level: number;
    confidence: number;
    noise_pollution: number;
    music_is_playing: number;
    music_track: string | null;
  }>,
  petId?: string
): Promise<UserStatsRow> {
  const pet = getPetId(petId);
  const current = await getUserStats(pet);
  const updated: Omit<UserStatsRow, "id"> = {
    ...current,
    mood: patch.mood ?? current.mood,
    room_temperature: patch.room_temperature ?? current.room_temperature,
    focus_level: patch.focus_level ?? current.focus_level,
    confidence:
      patch.confidence !== undefined ? patch.confidence : current.confidence,
    noise_pollution:
      patch.noise_pollution !== undefined
        ? patch.noise_pollution
        : current.noise_pollution,
    music_is_playing:
      patch.music_is_playing !== undefined
        ? patch.music_is_playing
        : current.music_is_playing ?? 0,
    music_track:
      patch.music_track !== undefined ? patch.music_track : current.music_track,
    last_updated: new Date().toISOString(),
  };

  await redis.set(key(pet, "user_stats"), updated);

  if (
    patch.confidence !== undefined &&
    patch.mood &&
    isCatAnimationState(patch.mood)
  ) {
    await updateMoodConfidence(patch.mood, patch.confidence, pet);
  }

  return { id: 1, ...updated };
}

export async function setDailyTip(
  tip: string,
  generatedAt: string,
  petId?: string
): Promise<void> {
  const pet = getPetId(petId);
  const current = await getUserStats(pet);
  await redis.set(key(pet, "user_stats"), {
    ...current,
    daily_tip: tip,
    tip_generated_at: generatedAt,
  });
}

export async function setMusicPlayback(
  isPlaying: boolean,
  track: string | null,
  petId?: string
): Promise<UserStatsRow> {
  const pet = getPetId(petId);
  const current = await getUserStats(pet);
  const updated: Omit<UserStatsRow, "id"> = {
    ...current,
    music_is_playing: isPlaying ? 1 : 0,
    music_track: track,
    last_updated: new Date().toISOString(),
  };
  await redis.set(key(pet, "user_stats"), updated);
  return { id: 1, ...updated };
}

// Spotify Tokens
const DEFAULT_SPOTIFY_TOKENS: Omit<SpotifyTokenRow, "id"> = {
  access_token: null,
  refresh_token: null,
  expires_at: null,
  token_type: null,
  scope: null,
  updated_at: new Date().toISOString(),
};

export async function getSpotifyTokens(
  petId?: string
): Promise<SpotifyTokenRow> {
  const pet = getPetId(petId);
  const tokens =
    (await redis.get<Omit<SpotifyTokenRow, "id">>(
      key(pet, "spotify_tokens")
    )) || DEFAULT_SPOTIFY_TOKENS;
  return { id: 1, ...tokens };
}

type SpotifyTokenUpdate = {
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresAt?: number | null;
  tokenType?: string | null;
  scope?: string | null;
};

export async function setSpotifyTokens(
  update: SpotifyTokenUpdate,
  petId?: string
): Promise<SpotifyTokenRow> {
  const pet = getPetId(petId);
  const current = await getSpotifyTokens(pet);

  const updated: Omit<SpotifyTokenRow, "id"> = {
    access_token:
      update.accessToken !== undefined
        ? update.accessToken
        : current.access_token,
    refresh_token:
      update.refreshToken !== undefined
        ? update.refreshToken
        : current.refresh_token,
    expires_at:
      update.expiresAt !== undefined ? update.expiresAt : current.expires_at,
    token_type:
      update.tokenType !== undefined ? update.tokenType : current.token_type,
    scope: update.scope !== undefined ? update.scope : current.scope,
    updated_at: new Date().toISOString(),
  };

  await redis.set(key(pet, "spotify_tokens"), updated);
  return { id: 1, ...updated };
}

export async function clearSpotifyTokens(
  petId?: string
): Promise<SpotifyTokenRow> {
  const pet = getPetId(petId);
  const updated: Omit<SpotifyTokenRow, "id"> = {
    ...DEFAULT_SPOTIFY_TOKENS,
    updated_at: new Date().toISOString(),
  };
  await redis.set(key(pet, "spotify_tokens"), updated);
  return { id: 1, ...updated };
}
