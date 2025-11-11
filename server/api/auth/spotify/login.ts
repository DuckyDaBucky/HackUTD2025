import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "crypto";
import {
  getSpotifyAuthorizeUrl,
  spotifyAuthConfigured,
} from "../../../src/spotify";

const SPOTIFY_STATE_TTL = 300; // 5 minutes in seconds

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!spotifyAuthConfigured()) {
      return res.status(500).json({
        error: "Spotify integration is not configured on the server.",
      });
    }

    const petId = (req.query.petId as string) || "default";
    const origin = req.headers.origin || req.headers.host || "";
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const redirectUri = `${protocol}://${origin}/api/auth/spotify/callback`;

    const state = crypto.randomBytes(16).toString("hex");
    const stateKey = `spotify:state:${state}`;

    // Store state with petId and timestamp
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || "",
      token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
    });
    await redis.set(stateKey, JSON.stringify({ petId, issuedAt: Date.now() }), {
      ex: SPOTIFY_STATE_TTL,
    });

    const authorizeUrl = getSpotifyAuthorizeUrl(state, redirectUri);
    return res.redirect(authorizeUrl);
  } catch (error) {
    console.error("[spotify/login] Error:", error);
    return res
      .status(500)
      .json({ error: "Failed to start Spotify authorization." });
  }
}
