import { Router, Request, Response } from "express";
import crypto from "crypto";

const router = Router();

interface QueueItem {
  id: string;
  payload: unknown;
}

const queue: QueueItem[] = [];

// GET /api/sync/pending
// Returns the next item in the queue without removing it, or null if empty.
router.get("/pending", (_req: Request, res: Response) => {
  res.json(queue[0] ?? null);
});

// POST /api/sync/push
// Adds a payload to the queue and returns the created item.
router.post("/push", (req: Request, res: Response) => {
  const item: QueueItem = {
    id: crypto.randomUUID(),
    payload: req.body,
  };
  queue.push(item);
  res.json(item);
});

// POST /api/sync/confirm
// Removes the item with the given id from the queue.
router.post("/confirm", (req: Request, res: Response) => {
  const { id } = req.body as { id?: string };
  const index = queue.findIndex((item) => item.id === id);
  if (index === -1) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  queue.splice(index, 1);
  res.json({ ok: true });
});

// POST /api/sync/error
// Logs the error payload to the console.
router.post("/error", (req: Request, res: Response) => {
  console.error("[sync/error]", req.body);
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
