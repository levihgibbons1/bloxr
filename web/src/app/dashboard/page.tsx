"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { User } from "@supabase/supabase-js";

type Message = { role: "user" | "ai"; text: string };

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [syncToken, setSyncToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
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

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text: input.trim() }]);
    setInput("");
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

  const displayName = user?.email?.split("@")[0] ?? "there";

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-white/[0.06] bg-black/80 backdrop-blur-xl sticky top-0 z-20">
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
        {/* Sidebar */}
        <aside className="w-[260px] shrink-0 border-r border-white/[0.06] flex flex-col p-5 gap-5 overflow-y-auto">
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

          {/* Sync token indicator */}
          {!tokenLoading && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-3">
              <p className="text-[11px] uppercase tracking-widest text-white/20 font-medium mb-1.5">Session</p>
              {syncToken ? (
                <p className="text-[11px] text-white/20 font-mono truncate">{syncToken.slice(0, 20)}…</p>
              ) : (
                <p className="text-[11px] text-white/15">No token — server offline</p>
              )}
            </div>
          )}
        </aside>

        {/* Chat area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-3">
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
                  <div
                    className={`max-w-[72%] rounded-2xl px-4 py-3 text-[14px] leading-[1.65] ${
                      msg.role === "user"
                        ? "bg-[#4F8EF7] text-white rounded-br-sm"
                        : "bg-white/[0.04] border border-white/[0.07] text-white/75 rounded-bl-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-6 py-4 border-t border-white/[0.06]">
            <div className="relative rounded-2xl border border-white/[0.08] bg-[#0A0A0F]/90 backdrop-blur-xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
              <div className="flex items-center gap-3 px-5 py-4">
                <div className="w-[20px] h-[20px] rounded-full bg-gradient-to-br from-white/70 to-white/30 flex items-center justify-center shrink-0">
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2L9.5 6.5L14 8L9.5 9.5L8 14L6.5 9.5L2 8L6.5 6.5L8 2Z" fill="black" />
                  </svg>
                </div>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe what you want to build..."
                  className="flex-1 bg-transparent text-[15px] text-white/70 placeholder-white/20 outline-none"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className={`shrink-0 w-[32px] h-[32px] rounded-lg flex items-center justify-center transition-all duration-200 ${
                    input.trim()
                      ? "bg-white hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] active:scale-[0.92]"
                      : "bg-white/[0.06]"
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M7 12V2M7 2L3 6M7 2L11 6"
                      stroke={input.trim() ? "black" : "rgba(255,255,255,0.2)"}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <p className="text-center text-[11px] text-white/15 mt-2">
              AI responses coming soon — chat UI ready
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
