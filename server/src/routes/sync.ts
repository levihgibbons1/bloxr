import { Router, Request, Response } from "express";
import crypto from "crypto";
import { supabase } from "../lib/supabase";

const router = Router();

// ── In-memory stores ──────────────────────────────────────────────────────────

const contextStore = new Map<string, string[]>();
const errorStore = new Map<string, { message: string; script: string; line: number }>();

export function getContext(userId: string): string[] {
  return contextStore.get(userId) ?? [];
}

export function getLastError(userId: string) {
  return errorStore.get(userId) ?? null;
}

export function clearError(userId: string) {
  errorStore.delete(userId);
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/sync/pending
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

  const lastError = getLastError(userId);
  if (lastError) {
    clearError(userId);
    res.json({ ...(data ?? null), lastError });
    return;
  }

  res.json(data ?? null);
});

// POST /api/sync/push
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

// POST /api/sync/error — store latest error per user
router.post("/error", async (req: Request, res: Response) => {
  const userId: string = res.locals.userId;
  const { message, script, line } = req.body as {
    message?: string;
    script?: string;
    line?: number;
  };

  if (message && script !== undefined && line !== undefined) {
    errorStore.set(userId, {
      message: String(message),
      script: String(script),
      line: Number(line),
    });
  }

  console.error("[sync/error] user=%s script=%s:%s — %s", userId, script, line, message);
  res.json({ ok: true });
});

// GET /api/sync/heartbeat
router.get("/heartbeat", (req: Request, res: Response) => {
  const userId: string = res.locals.userId;
  const lastError = getLastError(userId);
  if (lastError) {
    clearError(userId);
    res.json({ status: "ok", timestamp: Date.now(), lastError });
  } else {
    res.json({ status: "ok", timestamp: Date.now() });
  }
});

// POST /api/sync/place
router.post("/place", (req: Request, res: Response) => {
  const { placeId, gameId } = req.body as { placeId?: unknown; gameId?: unknown };
  console.log("[sync/place] placeId=%s gameId=%s", placeId, gameId);
  res.json({ ok: true });
});

// POST /api/sync/context
router.post("/context", (req: Request, res: Response) => {
  const userId: string = res.locals.userId;
  const { context } = req.body as { context?: string[] };

  if (!Array.isArray(context)) {
    res.status(400).json({ error: "context must be an array of strings" });
    return;
  }

  contextStore.set(userId, context);
  res.json({ ok: true });
});

// GET /api/sync/context
router.get("/context", (req: Request, res: Response) => {
  const userId: string = res.locals.userId;
  res.json({ context: getContext(userId) });
});

export default router;
