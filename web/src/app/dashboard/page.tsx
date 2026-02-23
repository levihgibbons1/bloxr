"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase";

const SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001";

interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

export default function DashboardPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Obtain a server session token from the Supabase user
  useEffect(() => {
    async function initSession() {
      const supabase = createClient();
      if (!supabase) return;

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        setAuthError("Please sign in to use the chat.");
        return;
      }

      try {
        const res = await fetch(`${SERVER_URL}/api/auth/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id }),
        });
        if (!res.ok) throw new Error("Failed to get session token");
        const data = await res.json();
        setSessionToken(data.token);
      } catch (err) {
        console.error(err);
        setAuthError("Failed to authenticate with the server.");
      }
    }
    initSession();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || isStreaming || !sessionToken) return;

    const userMessage = input.trim();
    setInput("");

    const conversationHistory = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
      { role: "assistant", content: "", streaming: true },
    ]);
    setIsStreaming(true);

    try {
      const res = await fetch(`${SERVER_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Failed to connect to chat endpoint");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.chunk) {
              fullContent += payload.chunk;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = {
                  role: "assistant",
                  content: fullContent,
                  streaming: true,
                };
                return next;
              });
            } else if (payload.done || payload.error) {
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = {
                  role: "assistant",
                  content: payload.error
                    ? "Sorry, something went wrong. Please try again."
                    : fullContent,
                  streaming: false,
                };
                return next;
              });
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          streaming: false,
        };
        return next;
      });
    } finally {
      setIsStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [input]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#000",
        color: "#fff",
        fontFamily: "'General Sans', 'Inter', ui-sans-serif, system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.4))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 2L9.5 6.5L14 8L9.5 9.5L8 14L6.5 9.5L2 8L6.5 6.5L8 2Z"
              fill="black"
            />
          </svg>
        </div>
        <span style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
          Bloxr
        </span>
        <span
          style={{
            marginLeft: 4,
            fontSize: 13,
            color: "rgba(255,255,255,0.3)",
            fontWeight: 400,
          }}
        >
          Roblox AI Developer
        </span>
      </div>

      {/* Auth error */}
      {authError && (
        <div
          style={{
            margin: "16px 24px 0",
            padding: "12px 16px",
            borderRadius: 10,
            background: "rgba(255,80,80,0.1)",
            border: "1px solid rgba(255,80,80,0.2)",
            fontSize: 14,
            color: "rgba(255,120,120,0.9)",
          }}
        >
          {authError}
        </div>
      )}

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {messages.length === 0 && !authError && (
          <div
            style={{
              margin: "auto",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              opacity: 0.5,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 2L9.5 6.5L14 8L9.5 9.5L8 14L6.5 9.5L2 8L6.5 6.5L8 2Z"
                  fill="rgba(255,255,255,0.6)"
                />
              </svg>
            </div>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", margin: 0 }}>
              Describe what you want to build in Roblox
            </p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", margin: 0 }}>
              Scripts will sync to Studio automatically
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            {msg.role === "assistant" && (
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.4))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 2L9.5 6.5L14 8L9.5 9.5L8 14L6.5 9.5L2 8L6.5 6.5L8 2Z"
                    fill="black"
                  />
                </svg>
              </div>
            )}

            <div
              style={{
                maxWidth: "75%",
                padding: "10px 14px",
                borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
                background:
                  msg.role === "user"
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(255,255,255,0.04)",
                border:
                  msg.role === "user"
                    ? "1px solid rgba(255,255,255,0.1)"
                    : "1px solid rgba(255,255,255,0.06)",
                fontSize: 14,
                lineHeight: 1.65,
                color: "rgba(255,255,255,0.85)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {msg.content}
              {msg.streaming && (
                <span
                  style={{
                    display: "inline-block",
                    width: 2,
                    height: 14,
                    background: "rgba(255,255,255,0.6)",
                    marginLeft: 2,
                    verticalAlign: "middle",
                    animation: "blink 1s step-end infinite",
                  }}
                />
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.07)",
          padding: "16px 24px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 10,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14,
            padding: "10px 10px 10px 16px",
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              sessionToken
                ? "Describe what you want to build..."
                : "Authenticating..."
            }
            disabled={!sessionToken || isStreaming}
            rows={1}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "rgba(255,255,255,0.85)",
              fontSize: 14,
              lineHeight: 1.6,
              resize: "none",
              fontFamily: "inherit",
              overflowY: "hidden",
              cursor: sessionToken ? "text" : "not-allowed",
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming || !sessionToken}
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              border: "none",
              background:
                input.trim() && sessionToken && !isStreaming
                  ? "#fff"
                  : "rgba(255,255,255,0.06)",
              cursor:
                input.trim() && sessionToken && !isStreaming
                  ? "pointer"
                  : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "background 0.15s",
            }}
          >
            {isStreaming ? (
              <div
                style={{
                  width: 12,
                  height: 12,
                  border: "2px solid rgba(255,255,255,0.2)",
                  borderTopColor: "rgba(255,255,255,0.7)",
                  borderRadius: "50%",
                  animation: "spin 0.7s linear infinite",
                }}
              />
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 12V2M7 2L3 6M7 2L11 6"
                  stroke={input.trim() && sessionToken ? "black" : "rgba(255,255,255,0.2)"}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
        <p
          style={{
            marginTop: 8,
            fontSize: 12,
            color: "rgba(255,255,255,0.2)",
            textAlign: "center",
          }}
        >
          Scripts sync to Roblox Studio automatically · Shift+Enter for new line
        </p>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>
    </div>
  );
}
