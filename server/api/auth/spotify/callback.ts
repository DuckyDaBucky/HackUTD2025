import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  exchangeSpotifyCode,
  fetchSpotifyPlayback,
} from "../../../src/spotify";
import { Redis } from "@upstash/redis";

const SPOTIFY_STATE_TTL = 1000 * 60 * 5;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { code, state, error } = req.query;

    if (error) {
      console.error("[spotify] Authorization error", error);
      return res.status(400).send(
        `<html><body style="font-family: sans-serif; background: #0b0f1c; color: #f1f5f9; display:flex; align-items:center; justify-content:center; height:100vh;">
          <div style="text-align:center;">
            <h2>Spotify authorization failed</h2>
            <p>${error}</p>
          </div>
        </body></html>`
      );
    }

    if (!state || typeof state !== "string") {
      return res.status(400).send("Invalid or expired authorization state.");
    }

    // Verify state from Redis
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || "",
      token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
    });
    const stateKey = `spotify:state:${state}`;
    const stateDataStr = await redis.get<string>(stateKey);

    if (!stateDataStr) {
      return res.status(400).send("Invalid or expired authorization state.");
    }

    const stateData = JSON.parse(stateDataStr) as {
      petId: string;
      issuedAt: number;
    };
    const { petId, issuedAt } = stateData;

    if (Date.now() - issuedAt > SPOTIFY_STATE_TTL) {
      await redis.del(stateKey);
      return res
        .status(400)
        .send("Authorization request timed out. Please try again.");
    }

    await redis.del(stateKey);

    if (!code || typeof code !== "string") {
      return res.status(400).send("Missing authorization code from Spotify.");
    }

    const origin = req.headers.origin || req.headers.host || "";
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const redirectUri = `${protocol}://${origin}/api/auth/spotify/callback`;

    const success = await exchangeSpotifyCode(code, redirectUri, petId);
    if (!success) {
      return res
        .status(500)
        .send("Failed to link Spotify account. Please try again.");
    }

    await fetchSpotifyPlayback(false, petId);

    return res.send(
      `<html><body style="font-family: sans-serif; background: #0b0f1c; color: #f1f5f9; display:flex; align-items:center; justify-content:center; height:100vh;">
        <div style="text-align:center;">
          <h2>Spotify connected!</h2>
          <p>You can close this window and return to the app.</p>
        </div>
      </body></html>`
    );
  } catch (error) {
    console.error("[spotify/callback] Error:", error);
    return res.status(500).send("Failed to process Spotify callback.");
  }
}
