import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

import { getUserPreferences, getUserStats, setDailyTip } from "./db";

const parser = new StringOutputParser();

const template = PromptTemplate.fromTemplate(
  `You are a concise study companion. Using the context below, provide one actionable tip (at most two sentences) that helps the user stay focused or take care of their wellbeing.

Context:
- Mood: {mood}
- Confidence Score: {confidence}
- Room Temperature (C): {roomTemperature}
- Noise Level (0-1): {noise}
- Focus Level (0-10): {focus}
- Timer Method: {timerMethod}
- Student Mode Enabled: {isStudent}

Avoid filler language and keep the tone encouraging.`
);

const ONE_HOUR_MS = 1000 * 60 * 60;

function shouldRefreshTip(lastGeneratedAt: string | null) {
  if (!lastGeneratedAt) return true;
  const last = Date.parse(lastGeneratedAt);
  if (Number.isNaN(last)) return true;
  const now = Date.now();
  const sameDay =
    new Date(last).toDateString() === new Date(now).toDateString();
  if (!sameDay) return true;
  return now - last > ONE_HOUR_MS * 4;
}

const titleCase = (value: string) =>
  value.length === 0 ? value : value[0].toUpperCase() + value.slice(1);

const lowerFirst = (value: string) =>
  value.length === 0 ? value : value[0].toLowerCase() + value.slice(1);

function buildFallbackTip(
  stats: ReturnType<typeof getUserStats>,
  prefs: ReturnType<typeof getUserPreferences>
): string {
  const mood =
    typeof stats.mood === "string" && stats.mood.length > 0
      ? stats.mood.toLowerCase()
      : "steady";

  const focus =
    Number.isFinite(stats.focus_level) && stats.focus_level >= 0
      ? Number(stats.focus_level)
      : null;

  const temperature =
    Number.isFinite(stats.room_temperature) && stats.room_temperature !== null
      ? Number(stats.room_temperature)
      : null;

  const noise =
    Number.isFinite(stats.noise_pollution) && stats.noise_pollution !== null
      ? Number(stats.noise_pollution)
      : null;

  const isStudent = prefs.is_student === 1;

  const opener = `Mood reads ${titleCase(mood)}.`;

  const suggestions: string[] = [];

  if (focus !== null) {
    if (focus <= 3) {
      suggestions.push(
        "Take a two-minute reset and breathe deeply before the next block"
      );
    } else if (focus >= 7) {
      suggestions.push(
        "Capture the next task in your notes so the momentum keeps rolling"
      );
    } else {
      suggestions.push(
        "Set a gentle timer for your next focus sprint to stay present"
      );
    }
  }

  if (temperature !== null) {
    if (temperature >= 26) {
      suggestions.push("Cool the room or sip water to stay comfortable");
    } else if (temperature <= 19) {
      suggestions.push("Add a light layer or warm drink to stay cozy");
    }
  }

  if (noise !== null && noise >= 55) {
    suggestions.push("Use headphones or white noise to soften the background");
  }

  if (isStudent) {
    suggestions.push("Lean on your study timer to keep the rhythm strong");
  }

  const primary =
    suggestions.shift() ??
    "Take a short stretch and refocus before you dive back in";

  const secondary = suggestions.shift();

  const guidance =
    secondary && secondary.length > 0
      ? `${titleCase(primary)}, and ${lowerFirst(secondary)}.`
      : `${titleCase(primary)}.`;

  return `${opener} ${guidance}`.replace(/\s+/g, " ").trim();
}

export async function maybeGenerateDailyTip(): Promise<string | null> {
  const stats = getUserStats();
  const prefs = getUserPreferences();

  if (
    stats.daily_tip &&
    stats.tip_generated_at &&
    !shouldRefreshTip(stats.tip_generated_at)
  ) {
    return stats.daily_tip;
  }

  const fallback = buildFallbackTip(stats, prefs);
  const setAndReturnFallback = () => {
    setDailyTip(fallback, new Date().toISOString());
    return fallback;
  };

  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return setAndReturnFallback();
  }

  try {
    const model = new ChatGoogleGenerativeAI({
      apiKey,
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
      temperature: 0.35,
      maxOutputTokens: 160,
    });

    const context = {
      mood: stats.mood ?? "balanced",
      confidence: stats.confidence?.toFixed(2) ?? "unknown",
      roomTemperature: stats.room_temperature ?? "unknown",
      noise: stats.noise_pollution?.toFixed(2) ?? "unknown",
      focus: stats.focus_level ?? "unknown",
      timerMethod: prefs.timer_method ?? "pomodoro",
      isStudent: prefs.is_student === 1 ? "yes" : "no",
    };

    const tip = (
      await template.pipe(model).pipe(parser).invoke(context)
    ).trim();

    if (tip.length > 0) {
      setDailyTip(tip, new Date().toISOString());
      return tip;
    }
  } catch (error) {
    console.warn("[tips] Falling back to local tip", error);
  }

  return setAndReturnFallback();
}
