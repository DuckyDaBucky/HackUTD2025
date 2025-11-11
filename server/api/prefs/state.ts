import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getUserPreferences, updateUserPreferences } from "../../src/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const petId = (req.query.petId as string) || "default";

  if (req.method === "GET") {
    try {
      const prefs = await getUserPreferences(petId);
      return res.json(prefs);
    } catch (error) {
      console.error("[prefs/state] GET Error:", error);
      return res.status(500).json({ error: "Failed to get preferences" });
    }
  }

  if (req.method === "POST") {
    try {
      const updated = await updateUserPreferences(req.body, petId);
      return res.json(updated);
    } catch (error) {
      console.error("[prefs/state] POST Error:", error);
      return res.status(400).json({ error: "Failed to update preferences" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
