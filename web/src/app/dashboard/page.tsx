"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { User } from "@supabase/supabase-js";

// ── Types ────────────────────────────────────────────────────────────────────

type Message = {
  role: "user" | "ai" | "status";
  text: string;
  streaming?: boolean;
  statusKind?: "building" | "pushed";
};

type ConversationMessage = { role: "user" | "assistant"; content: string };

// ── Shared components ────────────────────────────────────────────────────────

function SpinnerIcon({ size = 13 }: { size?: number }) {
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
        fill="rgba(255,255,255,0.45)"
      />
    </svg>
  );
}

function StatusBubble({ statusKind }: { statusKind: "building" | "pushed" }) {
  if (statusKind === "pushed") {
    return (
      <div className="flex items-center gap-2 px-4 py-[9px] rounded-2xl bg-[#1c1c20] text-[13px]">
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <path
            d="M2 7L5.5 10.5L12 3.5"
            stroke="#10B981"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-[#10B981] font-medium">Pushed to Studio</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-4 py-[9px] rounded-2xl bg-[#1c1c20] text-[13px] text-white/40">
      <SpinnerIcon />
      Building...
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);

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

    setMessages((prev) => [...prev, { role: "user", text }]);
    setMessages((prev) => [...prev, { role: "ai", text: "", streaming: true }]);
    setIsStreaming(true);

    const token = localStorage.getItem("bloxr_sync_token");
    let fullText = "";

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: text, conversationHistory }),
      });

      if (!res.ok || !res.body) throw new Error(`Server error: ${res.status}`);

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
              setMessages((prev) => [
                ...prev,
                { role: "status", text: "", statusKind: "building" },
              ]);
            }

            if (json.codePushed) {
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
              // Hide the JSON fence while streaming so user never sees raw JSON
              const displayText = fullText.replace(/```json[\s\S]*$/, "").trimEnd();
              setMessages((prev) => {
                const updated = [...prev];
                // AI message is always the last before any status bubbles appear
                // (building event only arrives after all deltas)
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
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].role === "ai") {
            updated[i] = { role: "ai", text: errText };
            break;
          }
        }
        return updated;
      });
    } finally {
      // Strip JSON block — show only the 1-2 sentence summary
      const displayText = fullText.replace(/```json[\s\S]*?```/, "").trim();

      setMessages((prev) => {
        const updated = [...prev];
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].role === "ai") {
            updated[i] = { role: "ai", text: displayText };
            break;
          }
        }
        return updated;
      });

      setIsStreaming(false);

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
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 md:px-8 py-4 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl sticky top-0 z-20">
        <Link href="/" className="flex items-center gap-1.5">
          <Image src="/logo.png" alt="Bloxr" width={32} height={32} className="object-contain" />
          <span className="text-white text-[20px] font-bold tracking-tight">Bloxr</span>
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
          <div>
            <p className="text-[12px] uppercase tracking-widest text-white/20 font-medium mb-1">Dashboard</p>
            <p className="text-[16px] font-semibold text-white">Hey, {displayName} 👋</p>
          </div>

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
          <div className="flex-1 overflow-y-auto px-4 md:px-10 py-8 flex flex-col gap-3 max-w-3xl mx-auto w-full">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex-1 flex flex-col items-center justify-center text-center my-auto"
              >
                <div className="w-12 h-12 rounded-full border border-white/[0.08] bg-white/[0.03] flex items-center justify-center mb-4">
                  <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2L9.5 6.5L14 8L9.5 9.5L8 14L6.5 9.5L2 8L6.5 6.5L8 2Z" fill="white" opacity="0.3" />
                  </svg>
                </div>
                <p className="text-[20px] font-semibold text-white/80 mb-2">
                  What do you want to build?
                </p>
                <p className="text-[14px] text-white/30 max-w-[340px] leading-[1.7]">
                  Describe a Roblox feature and Bloxr will build and push it to Studio.
                </p>
              </motion.div>
            ) : (
              messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "status" ? (
                    <StatusBubble statusKind={msg.statusKind!} />
                  ) : msg.role === "user" ? (
                    /* User bubble — white pill */
                    <div className="max-w-[75%] bg-white text-[#111] text-[15px] leading-[1.6] px-4 py-[10px] rounded-[20px] whitespace-pre-wrap font-[450]">
                      {msg.text}
                    </div>
                  ) : (
                    /* AI bubble — dark gray */
                    <div className="max-w-[85%] bg-[#1c1c20] text-white/80 text-[15px] leading-[1.7] px-4 py-[10px] rounded-2xl">
                      {msg.streaming && !msg.text ? (
                        <div className="flex items-center gap-2 text-white/40 text-[13px]">
                          <SpinnerIcon />
                          Getting context...
                        </div>
                      ) : (
                        msg.text
                      )}
                    </div>
                  )}
                </motion.div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 md:px-10 py-4 border-t border-white/[0.06] bg-[#0a0a0a] max-w-3xl mx-auto w-full">
            <div className="relative rounded-2xl border border-white/[0.08] bg-[#111115] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
              <div className="flex items-end gap-3 px-4 py-3">
                <div className="w-[18px] h-[18px] rounded-full bg-gradient-to-br from-white/70 to-white/30 flex items-center justify-center shrink-0 mb-[3px]">
                  <svg width="9" height="9" viewBox="0 0 16 16" fill="none">
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
                  className="flex-1 bg-transparent text-[15px] text-white/75 placeholder-white/20 outline-none resize-none overflow-hidden leading-[1.6] max-h-[120px]"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isStreaming}
                  className={`shrink-0 w-[30px] h-[30px] rounded-lg flex items-center justify-center transition-all duration-200 mb-[2px] ${
                    input.trim() && !isStreaming
                      ? "bg-white hover:shadow-[0_0_12px_rgba(255,255,255,0.15)] active:scale-[0.92]"
                      : "bg-white/[0.06]"
                  }`}
                >
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
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
          </div>
        </main>
      </div>
    </div>
  );
}
