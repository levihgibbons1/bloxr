import { Router, Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";
import { supabase } from "../lib/supabase";

const router = Router();

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Bloxr, an AI built into Roblox Studio. Talk like a senior Roblox dev helping a friend — casual, confident, direct. No filler words, no robotic structure.

Say what you're making in 1-3 natural sentences, then output the JSON blocks. Nothing else.

NEVER DO THIS:
"Teleport System Overview: This system consists of: 1. TeleportPad - A ModuleScript that defines... First, the TeleportPad ModuleScript: This defines the structure and behavior... Next, the TeleportManager Server Script: This manages all teleport pads..."

ALWAYS DO THIS:
"Here's a teleport system — pads that detect players, a manager handling the logic, and a destination picker UI."
[json block]
[json block]
[json block]

No headers. No numbered script lists. No explaining each script individually. No text after the last JSON block.

## Simple 3D objects — type "part", NEVER a script
For any Part, brick, block, sphere, ball, wedge, cylinder, wall, floor, platform, baseplate, spawn location — use type "part":
\`\`\`json
{"type":"part","name":"Name","className":"Part","properties":{"BrickColor":"Bright red","Size":[4,1,2],"Position":[0,10,0],"Anchored":true}}
\`\`\`
Valid classNames: "Part", "WedgePart", "CornerWedgePart", "TrussPart", "SpawnLocation"

## Scripts — type "script"
\`\`\`json
{"type":"script","scriptType":"Script","targetService":"ServerScriptService","name":"Name","code":"-- full luau source"}
\`\`\`
scriptType: "Script" | "LocalScript" | "ModuleScript"
targetService: "ServerScriptService" | "StarterPlayerScripts" | "ReplicatedStorage" | "StarterGui"

Rules:
- NEVER write a script just to place a part. Use type "part".
- Multiple scripts → multiple JSON blocks, nothing between them
- Nothing after the last JSON block ever
- No code needed → plain text reply only, no JSON`;

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
  let jsonMatch: RegExpMatchArray | null = null;

  // ── 1. Anthropic stream — isolated try so post-stream logic is unconditional ──
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
        (res as unknown as { flush?: () => void }).flush?.();
      }
    }

    jsonMatch = fullText.match(/```json\s*([\s\S]*?)```/);
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: "Something went wrong — try again" })}\n\n`);
    (res as unknown as { flush?: () => void }).flush?.();
    res.end();
    return;
  }

  // ── 2. Post-stream — entirely outside try/catch ──

  console.log("[chat] full response length:", fullText.length);
  console.log("[chat] full response:\n", fullText);

  if (!jsonMatch) {
    console.log("[chat] no JSON code block found in response — skipping sync_queue insert");
    res.write("data: [DONE]\n\n");
    (res as unknown as { flush?: () => void }).flush?.();
    res.end();
    return;
  }

  console.log("[chat] JSON block found:", jsonMatch[1].trim());

  // Step 1: signal building immediately and unconditionally
  res.write(`data: ${JSON.stringify({ building: true })}\n\n`);
  (res as unknown as { flush?: () => void }).flush?.();
  await new Promise(resolve => setTimeout(resolve, 800));

  // Step 2: parse + insert
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
      res.write(`data: ${JSON.stringify({ codePushed: false })}\n\n`);
      (res as unknown as { flush?: () => void }).flush?.();
    } else {
      console.log("[chat] sync_queue insert succeeded — id:", id);
      res.write(`data: ${JSON.stringify({ codePushed: true })}\n\n`);
      (res as unknown as { flush?: () => void }).flush?.();
    }
  } catch (parseErr) {
    console.error("[chat] JSON parse failed:", parseErr, "\nRaw block:", jsonMatch[1].trim());
    res.write(`data: ${JSON.stringify({ codePushed: false })}\n\n`);
    (res as unknown as { flush?: () => void }).flush?.();
  }

  // Step 3: done
  res.write("data: [DONE]\n\n");
  (res as unknown as { flush?: () => void }).flush?.();
  res.end();
});

export default router;
