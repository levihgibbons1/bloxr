import { Router, Request, Response } from "express";
import crypto from "crypto";
import { supabase } from "../lib/supabase";

const router = Router();

// GET /api/sync/pending
// Returns the oldest pending item in the queue for the authenticated user, or null if empty.
router.get("/pending", async (_req: Request, res: Response) => {
  const userId: string = res.locals.userId;
  const { data, error } = await supabase
    .from("sync_queue")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: "Failed to fetch pending item" });
    return;
  }
  res.json(data ?? null);
});

// POST /api/sync/push
// Adds a payload to the queue and returns the created item.
router.post("/push", async (req: Request, res: Response) => {
  const userId: string = res.locals.userId;
  const id = crypto.randomUUID();

  const { data, error } = await supabase
    .from("sync_queue")
    .insert({ id, user_id: userId, payload: req.body })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: "Failed to push item" });
    return;
  }
  res.json(data);
});

// POST /api/sync/confirm
// Removes the item with the given id from the queue.
router.post("/confirm", async (req: Request, res: Response) => {
  const { id } = req.body as { id?: string };
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  const { error, count } = await supabase
    .from("sync_queue")
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) {
    res.status(500).json({ error: "Failed to confirm item" });
    return;
  }
  if (count === 0) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  res.json({ ok: true });
});

// POST /api/sync/error
// Logs the error payload to the console and marks the item as errored.
router.post("/error", async (req: Request, res: Response) => {
  console.error("[sync/error]", req.body);
  const { id } = req.body as { id?: string };
  if (id) {
    await supabase
      .from("sync_queue")
      .update({ status: "error" })
      .eq("id", id);
  }
  res.json({ ok: true });
});

// GET /api/sync/heartbeat
// Returns a simple status check with the current timestamp.
router.get("/heartbeat", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// POST /api/sync/place
// Logs the placeId and gameId to the console.
router.post("/place", (req: Request, res: Response) => {
  const { placeId, gameId } = req.body as { placeId?: unknown; gameId?: unknown };
  console.log("[sync/place] placeId=%s gameId=%s", placeId, gameId);
  res.json({ ok: true });
});

export default router;
