import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getUserStats,
  updateUserStats,
  getMoodConfidence,
  type CatAnimationState,
} from "../../src/db";
import { spotifyIntegrationEnabled } from "../../src/spotify";
import { maybeGenerateDailyTip } from "../../src/tips";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const petId = (req.query.petId as string) || "default";

  if (req.method === "GET") {
    try {
      const [stats, confidenceMap] = await Promise.all([
        getUserStats(petId),
        getMoodConfidence(petId),
      ]);

      const moodKey = stats.mood as CatAnimationState;
      const mapConfidence = confidenceMap[moodKey] ?? 0;
      const confidence =
        typeof stats.confidence === "number" ? stats.confidence : mapConfidence;

      const spotifyConnected = await spotifyIntegrationEnabled(petId);

      return res.json({
        ...stats,
        confidence,
        confidence_map: confidenceMap,
        spotify_connected: spotifyConnected,
      });
    } catch (error) {
      console.error("[stats/state] GET Error:", error);
      return res.status(500).json({ error: "Failed to get stats" });
    }
  }

  if (req.method === "POST") {
    try {
      await updateUserStats(req.body, petId);

      if (
        typeof req.body.confidence === "number" ||
        typeof req.body.mood === "string"
      ) {
        try {
          await maybeGenerateDailyTip(petId);
        } catch (error) {
          console.error("[stats] Failed to generate tip", error);
        }
      }

      const [stats, confidenceMap] = await Promise.all([
        getUserStats(petId),
        getMoodConfidence(petId),
      ]);

      const moodKey = stats.mood as CatAnimationState;
      const mapConfidence = confidenceMap[moodKey] ?? 0;
      const confidence =
        typeof stats.confidence === "number" ? stats.confidence : mapConfidence;

      const spotifyConnected = await spotifyIntegrationEnabled(petId);

      return res.json({
        ...stats,
        confidence,
        confidence_map: confidenceMap,
        spotify_connected: spotifyConnected,
      });
    } catch (error) {
      console.error("[stats/state] POST Error:", error);
      return res.status(400).json({ error: "Failed to update stats" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
