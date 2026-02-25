"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { User } from "@supabase/supabase-js";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

type ScriptInfo = {
  name: string;
  scriptType: string;
  targetService: string;
  code: string;
};

type PartInfo = {
  name: string;
  className: string;
  properties: Record<string, unknown>;
};

type Message = {
  role: "user" | "ai" | "status";
  text: string;
  streaming?: boolean;
  scriptInfo?: ScriptInfo;
  partInfo?: PartInfo;
  // "status" role fields
  statusKind?: "building" | "pushed";
};

type ConversationMessage = { role: "user" | "assistant"; content: string };

// ── Markdown helpers ────────────────────────────────────────────────────────

function renderInline(text: string, keyPrefix: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  // Order matters: match **bold** before *italic* so ** isn't swallowed by *
  const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[2] !== undefined)
      parts.push(<strong key={`${keyPrefix}-${match.index}`} className="font-semibold text-white/90">{match[2]}</strong>);
    else if (match[3] !== undefined)
      parts.push(<em key={`${keyPrefix}-${match.index}`} className="italic">{match[3]}</em>);
    else if (match[4] !== undefined)
      parts.push(<code key={`${keyPrefix}-${match.index}`} className="font-mono text-[12px] bg-white/[0.08] px-1.5 py-0.5 rounded text-white/85">{match[4]}</code>);
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return <>{parts}</>;
}

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let bulletBuf: string[] = [];
  let numBuf: string[] = [];
  let key = 0;

  const flushBullets = () => {
    if (!bulletBuf.length) return;
    blocks.push(
      <ul key={key++} className="list-disc pl-5 space-y-0.5 my-1">
        {bulletBuf.map((item, j) => (
          <li key={j} className="text-[14px] leading-[1.7] text-white/75">
            {renderInline(item, `ul-${key}-${j}`)}
          </li>
        ))}
      </ul>
    );
    bulletBuf = [];
  };

  const flushNumbered = () => {
    if (!numBuf.length) return;
    blocks.push(
      <ol key={key++} className="list-decimal pl-5 space-y-0.5 my-1">
        {numBuf.map((item, j) => (
          <li key={j} className="text-[14px] leading-[1.7] text-white/75">
            {renderInline(item, `ol-${key}-${j}`)}
          </li>
        ))}
      </ol>
    );
    numBuf = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Bullet list item: "- text" or "* text"
    if (/^[-*] .+/.test(line)) {
      flushNumbered();
      bulletBuf.push(line.replace(/^[-*] /, ""));
      continue;
    }

    // Numbered list item: "1. text"
    if (/^\d+\. .+/.test(line)) {
      flushBullets();
      numBuf.push(line.replace(/^\d+\. /, ""));
      continue;
    }

    flushBullets();
    flushNumbered();

    // Headings: #, ##, ###
    const headingMatch = line.match(/^(#{1,3}) (.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      blocks.push(
        <p key={key++} className={`font-semibold text-white/90 mt-3 mb-0.5 ${level === 1 ? "text-[15px]" : "text-[14px]"}`}>
          {renderInline(headingMatch[2], `h-${key}`)}
        </p>
      );
      continue;
    }

    // Empty line → paragraph gap
    if (line.trim() === "") {
      if (blocks.length) blocks.push(<div key={key++} className="h-2" />);
      continue;
    }

    // Regular paragraph line
    blocks.push(
      <p key={key++} className="text-[14px] leading-[1.7] text-white/75">
        {renderInline(line, `p-${key}`)}
      </p>
    );
  }

  flushBullets();
  flushNumbered();
  return <>{blocks}</>;
}

// ────────────────────────────────────────────────────────────────────────────

// Spinning Bloxr star used in status states
function SpinnerIcon({ size = 14, opacity = 0.5 }: { size?: number; opacity?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      style={{ animation: "spin 1.1s linear infinite", flexShrink: 0 }}
    >
      <path
        d="M8 2L9.5 6.5L14 8L9.5 9.5L8 14L6.5 9.5L2 8L6.5 6.5L8 2Z"
        fill={`rgba(255,255,255,${opacity})`}
      />
    </svg>
  );
}

// Separate status bubble rendered below the main AI response
function StatusBubble({ statusKind }: { statusKind: "building" | "pushed" }) {
  if (statusKind === "pushed") {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-[7px] rounded-xl bg-[#10B981]/[0.08] border border-[#10B981]/20 text-[#10B981] text-[13px] font-medium">
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
          <path d="M2 7L5.5 10.5L12 3.5" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Pushed to Studio
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-2 px-3 py-[7px] rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/40 text-[13px]">
      <SpinnerIcon size={13} opacity={0.4} />
      Building...
    </div>
  );
}

function AIMessageContent({ msg }: { msg: Message }) {
  // Initial state: no text yet — show spinner + "Getting context..."
  if (msg.streaming && !msg.text) {
    return (
      <div className="flex items-center gap-2.5 py-0.5 text-[13px] text-white/40">
        <SpinnerIcon size={14} opacity={0.45} />
        Getting context...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {msg.text && (
        <div className="flex flex-col gap-0">
          {renderMarkdown(msg.text)}
        </div>
      )}

      {/* Script: syntax-highlighted code block */}
      {msg.scriptInfo && (
        <div className="rounded-xl overflow-hidden border border-white/[0.08]">
          <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/[0.06]">
            <span className="text-[11px] font-mono text-white/40">{msg.scriptInfo.name}.luau</span>
            <span className="text-[11px] text-white/25">{msg.scriptInfo.scriptType}</span>
          </div>
          <SyntaxHighlighter
            language="lua"
            style={oneDark}
            customStyle={{ margin: 0, borderRadius: 0, fontSize: 12, lineHeight: "1.6" }}
            wrapLongLines
          >
            {msg.scriptInfo.code}
          </SyntaxHighlighter>
        </div>
      )}

      {/* Script info chip */}
      {msg.scriptInfo && (
        <div className="flex items-center gap-1.5 text-[12px] text-white/40 bg-white/[0.03] rounded-lg px-3 py-1.5 border border-white/[0.06] w-fit">
          <span>📄</span>
          <span className="font-mono">{msg.scriptInfo.name}</span>
          <span className="text-white/20 mx-0.5">→</span>
          <span>{msg.scriptInfo.targetService}</span>
        </div>
      )}

      {/* Part: properties table */}
      {msg.partInfo && (
        <div className="rounded-xl overflow-hidden border border-white/[0.08]">
          <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/[0.06]">
            <span className="text-[11px] font-mono text-white/40">{msg.partInfo.name}</span>
            <span className="text-[11px] text-white/25">{msg.partInfo.className}</span>
          </div>
          <div className="px-4 py-3 flex flex-col gap-1.5">
            {Object.entries(msg.partInfo.properties).map(([k, v]) => (
              <div key={k} className="flex items-center gap-3 text-[12px]">
                <span className="text-white/30 font-mono w-24 shrink-0">{k}</span>
                <span className="text-white/65 font-mono">{JSON.stringify(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Part info chip */}
      {msg.partInfo && (
        <div className="flex items-center gap-1.5 text-[12px] text-white/40 bg-white/[0.03] rounded-lg px-3 py-1.5 border border-white/[0.06] w-fit">
          <span>🧱</span>
          <span className="font-mono">{msg.partInfo.name}</span>
          <span className="text-white/20 mx-0.5">·</span>
          <span>{msg.partInfo.className}</span>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [syncToken, setSyncToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      if (!supabase) return;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      // Fetch sync token from server
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/token`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: user.id }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          const token = data.token;
          localStorage.setItem("bloxr_sync_token", token);
          setSyncToken(token);
        }
      } catch {
        // Server may not be running yet — safe to ignore
      } finally {
        setTokenLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [input]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");

    const userMessage: Message = { role: "user", text };
    setMessages((prev) => [...prev, userMessage]);

    // Append a blank streaming AI message
    setMessages((prev) => [...prev, { role: "ai", text: "", streaming: true }]);
    setIsStreaming(true);

    const token = localStorage.getItem("bloxr_sync_token");
    let fullText = "";

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ message: text, conversationHistory }),
        }
      );

      if (!res.ok || !res.body) {
        throw new Error(`Server error: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;

          try {
            const json = JSON.parse(payload) as {
              delta?: string;
              building?: boolean;
              codePushed?: boolean;
              error?: string;
            };

            if (json.error) throw new Error(json.error);

            if (json.building) {
              // Append a new "Building..." status bubble after the AI response
              setMessages((prev) => [
                ...prev,
                { role: "status", text: "", statusKind: "building" },
              ]);
            }

            if (json.codePushed) {
              // Flip the last status bubble to "pushed"
              setMessages((prev) => {
                const updated = [...prev];
                for (let i = updated.length - 1; i >= 0; i--) {
                  if (updated[i].role === "status") {
                    updated[i] = { ...updated[i], statusKind: "pushed" };
                    break;
                  }
                }
                return updated;
              });
            }

            if (json.delta) {
              fullText += json.delta;
              // Hide the JSON fence while streaming
              const displayText = fullText.replace(/```json[\s\S]*$/, "").trimEnd();
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "ai",
                  text: displayText,
                  streaming: true,
                };
                return updated;
              });
            }
          } catch {
            // Malformed SSE chunk — skip
          }
        }
      }
    } catch (err) {
      const errText = err instanceof Error ? err.message : "Something went wrong.";
      fullText = errText;
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "ai", text: errText };
        return updated;
      });
    } finally {
      // Parse JSON block from full response and build final message
      const jsonMatch = fullText.match(/```json\s*([\s\S]*?)```/);
      let scriptInfo: ScriptInfo | undefined;
      let partInfo: PartInfo | undefined;
      let displayText = fullText;

      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1].trim()) as Record<string, unknown>;
          displayText = fullText.replace(/```json[\s\S]*?```/, "").trim();

          if (parsed.type === "part") {
            partInfo = {
              name: parsed.name as string,
              className: parsed.className as string,
              properties: (parsed.properties ?? {}) as Record<string, unknown>,
            };
          } else {
            scriptInfo = {
              name: parsed.name as string,
              scriptType: parsed.scriptType as string,
              targetService: parsed.targetService as string,
              code: parsed.code as string,
            };
          }
        } catch {
          // Malformed JSON block — keep full text as-is
        }
      }

      // Find the last "ai" message (status bubbles may have been appended after it)
      setMessages((prev) => {
        const updated = [...prev];
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].role === "ai") {
            updated[i] = { role: "ai", text: displayText, scriptInfo, partInfo };
            break;
          }
        }
        return updated;
      });

      setIsStreaming(false);

      // Update conversation history for next turn (use raw text for context)
      setConversationHistory((prev) => [
        ...prev,
        { role: "user", content: text },
        { role: "assistant", content: fullText },
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleCopyToken = async () => {
    if (!syncToken) return;
    await navigator.clipboard.writeText(syncToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayName = user?.email?.split("@")[0] ?? "there";

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 md:px-8 py-4 border-b border-white/[0.06] bg-black/80 backdrop-blur-xl sticky top-0 z-20">
        <Link href="/" className="flex items-center gap-1">
          <Image src="/logo.png" alt="Bloxr" width={34} height={34} className="object-contain" />
          <span className="text-white text-[22px] font-bold tracking-tight">Bloxr</span>
        </Link>
        <div className="flex items-center gap-5">
          <span className="hidden sm:block text-white/30 text-[13px]">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="text-white/40 hover:text-white text-[14px] font-medium transition-colors duration-200"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 65px)" }}>
        {/* Sidebar — hidden on mobile */}
        <aside className="hidden md:flex w-[260px] shrink-0 border-r border-white/[0.06] flex-col p-5 gap-5 overflow-y-auto">
          {/* Welcome */}
          <div>
            <p className="text-[12px] uppercase tracking-widest text-white/20 font-medium mb-1">Dashboard</p>
            <p className="text-[16px] font-semibold text-white">Hey, {displayName} 👋</p>
          </div>

          {/* Divider */}
          <div className="h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

          {/* Studio Connection */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-2 h-2 rounded-full shrink-0 transition-colors duration-300 ${
                  connected ? "bg-[#10B981] shadow-[0_0_6px_rgba(16,185,129,0.6)]" : "bg-white/20"
                }`}
              />
              <span className="text-[13px] font-medium text-white/50">
                {connected ? "Studio connected" : "Studio not connected"}
              </span>
            </div>
            <button
              onClick={() => setConnected((c) => !c)}
              className={`w-full rounded-full py-[9px] text-[13px] font-semibold transition-all duration-200 ${
                connected
                  ? "border border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
                  : "bg-[#4F8EF7] text-white hover:shadow-[0_0_20px_rgba(79,142,247,0.3)] active:scale-[0.97]"
              }`}
            >
              {connected ? "Disconnect" : "Connect Studio"}
            </button>
            {!connected && (
              <p className="text-[11px] text-white/20 leading-[1.5]">
                Open Roblox Studio and activate the Bloxr plugin to connect.
              </p>
            )}
          </div>

          {/* Studio Token */}
          {!tokenLoading && (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 flex flex-col gap-3">
              <div>
                <p className="text-[12px] uppercase tracking-widest text-white/30 font-medium mb-0.5">
                  Your Studio Token
                </p>
                <p className="text-[11px] text-white/30 leading-[1.6]">
                  Copy this token and paste it into the Bloxr plugin in Roblox Studio.
                </p>
              </div>
              {syncToken ? (
                <>
                  <div className="rounded-lg bg-black/60 border border-white/[0.07] px-3 py-2.5 font-mono text-[11px] text-[#4F8EF7] break-all leading-[1.6] select-all">
                    {syncToken}
                  </div>
                  <button
                    onClick={handleCopyToken}
                    className={`w-full flex items-center justify-center gap-2 rounded-full py-[9px] text-[13px] font-semibold transition-all duration-200 ${
                      copied
                        ? "border border-[#10B981]/30 text-[#10B981]"
                        : "border border-white/10 text-white/50 hover:border-white/20 hover:text-white/80 active:scale-[0.97]"
                    }`}
                  >
                    {copied ? (
                      <>
                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                          <path d="M2 7L5.5 10.5L12 3.5" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                          <rect x="4.5" y="4.5" width="7" height="7" rx="1.25" stroke="currentColor" strokeWidth="1.2" />
                          <path d="M2 9.5V2.5A.5.5 0 0 1 2.5 2h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                        </svg>
                        Copy Token
                      </>
                    )}
                  </button>
                </>
              ) : (
                <p className="text-[11px] text-white/20">No token — server offline</p>
              )}
            </div>
          )}
        </aside>

        {/* Chat area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 flex flex-col gap-4">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex-1 flex flex-col items-center justify-center text-center my-auto pt-12"
              >
                <div className="w-12 h-12 rounded-full border border-white/[0.08] bg-white/[0.03] flex items-center justify-center mb-4">
                  <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2L9.5 6.5L14 8L9.5 9.5L8 14L6.5 9.5L2 8L6.5 6.5L8 2Z" fill="white" opacity="0.3" />
                  </svg>
                </div>
                <p className="text-[20px] font-medium text-white/70 mb-2">
                  What do you want to build?
                </p>
                <p className="text-[14px] text-white/25 max-w-[380px] leading-[1.7]">
                  Describe a Roblox feature and Bloxr will generate the Luau code and push it to Studio.
                </p>
              </motion.div>
            ) : (
              messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "status" ? (
                    <StatusBubble statusKind={msg.statusKind!} />
                  ) : msg.role === "user" ? (
                    <div className="max-w-[85%] md:max-w-[72%] rounded-2xl rounded-br-sm px-4 py-3 bg-[#4F8EF7] text-white text-[14px] leading-[1.65] whitespace-pre-wrap">
                      {msg.text}
                    </div>
                  ) : (
                    <div className="max-w-[85%] md:max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-3 bg-white/[0.04] border border-white/[0.07]">
                      <AIMessageContent msg={msg} />
                    </div>
                  )}
                </motion.div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 md:px-6 py-4 border-t border-white/[0.06] bg-black sticky bottom-0">
            <div className="relative rounded-2xl border border-white/[0.08] bg-[#0A0A0F]/90 backdrop-blur-xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
              <div className="flex items-end gap-3 px-5 py-4">
                <div className="w-[20px] h-[20px] rounded-full bg-gradient-to-br from-white/70 to-white/30 flex items-center justify-center shrink-0 mb-[2px]">
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2L9.5 6.5L14 8L9.5 9.5L8 14L6.5 9.5L2 8L6.5 6.5L8 2Z" fill="black" />
                  </svg>
                </div>
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe what you want to build..."
                  className="flex-1 bg-transparent text-[15px] text-white/70 placeholder-white/20 outline-none resize-none overflow-hidden leading-[1.6] max-h-[120px]"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isStreaming}
                  className={`shrink-0 w-[32px] h-[32px] rounded-lg flex items-center justify-center transition-all duration-200 mb-[1px] ${
                    input.trim() && !isStreaming
                      ? "bg-white hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] active:scale-[0.92]"
                      : "bg-white/[0.06]"
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M7 12V2M7 2L3 6M7 2L11 6"
                      stroke={input.trim() && !isStreaming ? "black" : "rgba(255,255,255,0.2)"}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <p className="text-center text-[11px] text-white/15 mt-2">
              {isStreaming
                ? "Generating..."
                : "Describe what to build — Bloxr writes and pushes the Luau code"}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
