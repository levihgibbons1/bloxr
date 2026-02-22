import { Request, Response, NextFunction } from "express";
import { supabase } from "../lib/supabase";

export async function requireSession(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "Missing authorization token" });
    return;
  }

  const { data, error } = await supabase
    .from("sessions")
    .select("user_id, expires_at")
    .eq("token", token)
    .single();

  if (error || !data) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }
  if (new Date(data.expires_at) < new Date()) {
    res.status(401).json({ error: "Token expired" });
    return;
  }

  res.locals.userId = data.user_id;
  next();
}
