import { Router, Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";
import { supabase } from "../lib/supabase";

const router = Router();

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert Roblox game developer with full knowledge of current Roblox APIs and best practices.

Rules you must always follow:
- Write Luau only — never write Lua. Use Luau type annotations where appropriate.
- Always decide which Roblox service the script belongs in. Choose exactly one of:
  ServerScriptService, StarterPlayerScripts, ReplicatedStorage, StarterGui
- When you provide code, wrap it in a single JSON block (fenced with \`\`\`json) with this exact shape:
  \`\`\`json
  {
    "scriptType": "Script" | "LocalScript" | "ModuleScript",
    "targetService": "ServerScriptService" | "StarterPlayerScripts" | "ReplicatedStorage" | "StarterGui",
    "name": "DescriptiveScriptName",
    "code": "-- full Luau source here"
  }
  \`\`\`
- Always explain what the code does before the JSON block so the user understands the approach.
- If a request does not need code (e.g. a follow-up question), reply in plain text only — no JSON block.`;

type ConversationMessage = { role: "user" | "assistant"; content: string };

// POST /api/chat
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const userId: string = res.locals.userId;
  const { message, conversationHistory = [] } = req.body as {
    message: string;
    conversationHistory: ConversationMessage[];
  };

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "message is required" });
    return;
  }

  const messages: ConversationMessage[] = [
    ...conversationHistory,
    { role: "user", content: message },
  ];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  let fullText = "";

  try {
    const stream = client.messages.stream({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages,
    });

    for await (const chunk of stream) {
      if (
        chunk.type === "content_block_delta" &&
        chunk.delta.type === "text_delta"
      ) {
        const delta = chunk.delta.text;
        fullText += delta;
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
    }

    // Parse JSON code block and push to sync_queue
    const jsonMatch = fullText.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1].trim()) as {
          scriptType: string;
          targetService: string;
          name: string;
          code: string;
        };

        const id = crypto.randomUUID();
        const { error } = await supabase.from("sync_queue").insert({
          id,
          user_id: userId,
          payload: {
            type: "script",
            scriptType: parsed.scriptType,
            targetService: parsed.targetService,
            name: parsed.name,
            code: parsed.code,
          },
        });

        if (!error) {
          res.write(`data: ${JSON.stringify({ codePushed: true })}\n\n`);
        }
      } catch {
        // JSON parse failed — not a valid code block, skip push
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    res.end();
  }
});

export default router;
