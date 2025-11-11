import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getCatState,
  getUserPreferences,
  getUserStats,
  getMoodConfidence,
  type CatAnimationState,
} from "../src/db";
import { spotifyIntegrationEnabled } from "../src/spotify";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const petId = (req.query.petId as string) || "default";

    const [catState, prefs, stats, confidenceMap] = await Promise.all([
      getCatState(petId),
      getUserPreferences(petId),
      getUserStats(petId),
      getMoodConfidence(petId),
    ]);

    const moodKey = stats.mood as CatAnimationState;
    const mapConfidence = confidenceMap[moodKey] ?? 0;
    const confidence =
      typeof stats.confidence === "number" ? stats.confidence : mapConfidence;

    const spotifyConnected = await spotifyIntegrationEnabled(petId);

    return res.json({
      cat: catState,
      prefs,
      stats: {
        ...stats,
        confidence,
        confidence_map: confidenceMap,
        spotify_connected: spotifyConnected,
      },
    });
  } catch (error) {
    console.error("[poll] Error:", error);
    return res.status(500).json({ error: "Failed to fetch state" });
  }
}
