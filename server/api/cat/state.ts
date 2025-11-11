import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getCatState, updateCatState } from "../../src/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const petId = (req.query.petId as string) || "default";

  if (req.method === "GET") {
    try {
      const state = await getCatState(petId);
      return res.json(state);
    } catch (error) {
      console.error("[cat/state] GET Error:", error);
      return res.status(500).json({ error: "Failed to get cat state" });
    }
  }

  if (req.method === "POST") {
    try {
      const updated = await updateCatState(req.body, petId);
      return res.json(updated);
    } catch (error) {
      console.error("[cat/state] POST Error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to update cat state";
      return res.status(400).json({ error: message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
