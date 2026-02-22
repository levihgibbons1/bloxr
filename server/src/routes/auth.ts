import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase";
import crypto from "crypto";

const router = Router();

// POST /api/auth/token
// Body: { user_id: string }
// Returns: { token: string, expires_at: string }
router.post("/token", async (req: Request, res: Response) => {
  const { user_id } = req.body as { user_id?: string };
  if (!user_id) {
    res.status(400).json({ error: "user_id is required" });
    return;
  }

  const token = crypto.randomUUID();
  const expires_at = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { error } = await supabase.from("sessions").insert({
    id: crypto.randomUUID(),
    user_id,
    token,
    expires_at,
  });

  if (error) {
    console.error("[auth/token]", error);
    res.status(500).json({ error: "Failed to create session" });
    return;
  }

  res.json({ token, expires_at });
});

export default router;
