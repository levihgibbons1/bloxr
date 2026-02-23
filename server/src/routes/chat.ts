import { Router, Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";
import { supabase } from "../lib/supabase";

const router = Router();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert Roblox game developer specializing in Luau scripting.

CRITICAL RULES:
- Always write code in Luau, never plain Lua.
- Always specify which Roblox service the script belongs in.
- Valid services: ServerScriptService, StarterPlayerScripts, ReplicatedStorage, StarterGui.

When your response includes a script, you MUST include a JSON block formatted exactly like this:

\`\`\`json
{
  "scriptType": "Script" | "LocalScript" | "ModuleScript",
  "targetService": "ServerScriptService" | "StarterPlayerScripts" | "ReplicatedStorage" | "StarterGui",
  "name": "DescriptiveScriptName",
  "code": "-- full Luau code here"
}
\`\`\`

Place this JSON block after any explanation text. The code field must contain the complete, ready-to-use Luau script.`;

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

// POST /api/chat
router.post("/", async (req: Request, res: Response) => {
  const userId: string = res.locals.userId;
  const { message, conversationHistory = [] } = req.body as {
    message?: string;
    conversationHistory?: ConversationMessage[];
  };

  if (!message || typeof message !== "string" || message.trim() === "") {
    res.status(400).json({ error: "message is required" });
    return;
  }

  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  let fullResponse = "";

  try {
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages,
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        const chunk = event.delta.text;
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }
    }

    // Parse for JSON code block
    const jsonMatch = fullResponse.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1].trim());
        if (parsed.scriptType && parsed.targetService && parsed.name && parsed.code) {
          const syncId = crypto.randomUUID();
          const { error } = await supabase.from("sync_queue").insert({
            id: syncId,
            user_id: userId,
            payload: {
              type: "script",
              scriptType: parsed.scriptType,
              targetService: parsed.targetService,
              name: parsed.name,
              code: parsed.code,
            },
          });
          if (error) {
            console.error("[chat] sync_queue insert error:", error);
          }
        }
      } catch (parseErr) {
        console.error("[chat] failed to parse code block JSON:", parseErr);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err) {
    console.error("[chat] error:", err);
    res.write(`data: ${JSON.stringify({ error: "Failed to get response" })}\n\n`);
  } finally {
    res.end();
  }
});

export default router;
