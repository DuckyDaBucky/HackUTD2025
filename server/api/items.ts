import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getItems, createItem } from "../src/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const petId = (req.query.petId as string) || "default";

  if (req.method === "GET") {
    try {
      const items = await getItems(petId);
      return res.json(items);
    } catch (error) {
      console.error("[items] GET Error:", error);
      return res.status(500).json({ error: "Failed to get items" });
    }
  }

  if (req.method === "POST") {
    try {
      const name = (req.body?.name || "").trim();
      if (!name) {
        return res.status(400).json({ error: "name required" });
      }

      const item = await createItem(name, petId);
      return res.json(item);
    } catch (error) {
      console.error("[items] POST Error:", error);
      return res.status(400).json({ error: "Failed to create item" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
