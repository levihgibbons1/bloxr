import { Router, Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";
import { supabase } from "../lib/supabase";

const router = Router();

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Bloxr, an expert Roblox developer built into Roblox Studio. Your tone is casual, confident, and direct — like a skilled dev helping a friend. No filler, no robotic explanations.

## Response format — IMPORTANT
Keep it short:
- 1 casual sentence describing what you're doing (e.g. "Here's a kill brick for your obby." or "Added a red anchored platform.")
- Optional: 2–4 bullets if there are key things to know (variables to tweak, how it works, etc.)
- Then the JSON block

Never say "Certainly!" or "Sure!" or "Of course!". Just get it done.

## Simple 3D objects — use "part" type, NEVER a script
When the user asks to place, create, or add any Part, brick, block, sphere, ball, wedge, cylinder, floor, wall, platform, or other simple 3D primitive — respond with a JSON block of type "part":
\`\`\`json
{
  "type": "part",
  "name": "RedPart",
  "className": "Part",
  "properties": {
    "BrickColor": "Bright red",
    "Size": [4, 1, 2],
    "Position": [0, 10, 0],
    "Anchored": true
  }
}
\`\`\`
Valid className values: "Part", "WedgePart", "CornerWedgePart", "TrussPart", "SpawnLocation"
BrickColor: use standard Roblox BrickColor names e.g. "Bright red", "Bright blue", "Medium stone grey", "Bright green"

## Scripts — use "script" type
For logic, gameplay systems, NPCs, data stores, GUIs, animations, and anything requiring code — write Luau only (never Lua), then emit:
\`\`\`json
{
  "scriptType": "Script" | "LocalScript" | "ModuleScript",
  "targetService": "ServerScriptService" | "StarterPlayerScripts" | "ReplicatedStorage" | "StarterGui",
  "name": "DescriptiveScriptName",
  "code": "-- full Luau source here"
}
\`\`\`

## No-action replies
If the request is a follow-up question or needs no code or part, reply in plain text only — no JSON block.`;

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

  // Build messages array: prior history + new user message
  const messages: ConversationMessage[] = [
    ...conversationHistory,
    { role: "user", content: message },
  ];

  // Set up SSE
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

    console.log("[chat] full response length:", fullText.length);
    console.log("[chat] full response:\n", fullText);

    // After streaming, attempt to parse a JSON code block
    const jsonMatch = fullText.match(/```json\s*([\s\S]*?)```/);
    if (!jsonMatch) {
      console.log("[chat] no JSON code block found in response — skipping sync_queue insert");
    } else {
      console.log("[chat] JSON block found:", jsonMatch[1].trim());
      // Signal to client that we're about to insert
      res.write(`data: ${JSON.stringify({ building: true })}\n\n`);
      try {
        const parsed = JSON.parse(jsonMatch[1].trim()) as Record<string, unknown>;

        const id = crypto.randomUUID();
        let payload: Record<string, unknown>;

        if (parsed.type === "part") {
          console.log("[chat] parsed OK — type: part, name:", parsed.name, "className:", parsed.className);
          payload = {
            type: "part",
            name: parsed.name,
            className: parsed.className,
            properties: parsed.properties,
          };
        } else {
          console.log("[chat] parsed OK — type: script, scriptType:", parsed.scriptType, "name:", parsed.name, "targetService:", parsed.targetService);
          payload = {
            type: "script",
            scriptType: parsed.scriptType,
            targetService: parsed.targetService,
            name: parsed.name,
            code: parsed.code,
          };
        }

        console.log("[chat] inserting into sync_queue — id:", id, "userId:", userId, "payload:", JSON.stringify(payload));

        const { error } = await supabase.from("sync_queue").insert({
          id,
          user_id: userId,
          payload,
        });

        if (error) {
          console.error("[chat] sync_queue insert FAILED:", error.message, error);
        } else {
          console.log("[chat] sync_queue insert succeeded — id:", id);
          res.write(`data: ${JSON.stringify({ codePushed: true })}\n\n`);
        }
      } catch (parseErr) {
        console.error("[chat] JSON parse failed:", parseErr, "\nRaw block:", jsonMatch[1].trim());
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
