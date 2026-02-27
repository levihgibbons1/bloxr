"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type { User } from "@supabase/supabase-js";

// ── Types ────────────────────────────────────────────────────────────────────

/** UI message — the 5-state machine */
type ChatMsg = {
  id: string;
  kind: "user" | "thinking" | "responding" | "working" | "done" | "error";
  text?: string;
};

type ConversationMessage = { role: "user" | "assistant"; content: string };

type DbChat = {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  messages: unknown[]; // raw JSON — either old {role,text} or new {id,kind,text}
  created_at: string;
  updated_at: string;
};

type DbProject = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

// ── Constants ────────────────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  "Kill brick",
  "Leaderboard + DataStore",
  "Teleport system",
  "NPC patrol",
  "Proximity door",
  "Save player data",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Trim conversation history to max 20 messages: keep first 2 + last 16 */
function trimHistory(history: ConversationMessage[]): ConversationMessage[] {
  if (history.length <= 20) return history;
  return [...history.slice(0, 2), ...history.slice(history.length - 16)];
}

/** Strip all code fences (complete and partial/open at end) from text */
function stripAllFences(text: string): string {
  return text
    .replace(/```json[\s\S]*?```/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/```[\s\S]*$/, "")
    .trim();
}

function renderInline(text: string, keyPrefix: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[2] !== undefined)
      parts.push(<strong key={`${keyPrefix}-${match.index}`} className="font-semibold text-white">{match[2]}</strong>);
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
      <div key={key++} className="space-y-2 my-1">
        {bulletBuf.map((item, j) => (
          <div key={j} className="flex items-start gap-2.5">
            <div className="w-1 h-1 rounded-full bg-white/30 mt-[9px] shrink-0" />
            <span className="text-white/75 text-[15px] leading-relaxed">
              {renderInline(item, `ul-${key}-${j}`)}
            </span>
          </div>
        ))}
      </div>
    );
    bulletBuf = [];
  };

  const flushNumbered = () => {
    if (!numBuf.length) return;
    blocks.push(
      <ol key={key++} className="list-decimal pl-5 space-y-1 my-1">
        {numBuf.map((item, j) => (
          <li key={j} className="text-[15px] leading-relaxed text-white/75">
            {renderInline(item, `ol-${key}-${j}`)}
          </li>
        ))}
      </ol>
    );
    numBuf = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^[-*] .+/.test(line)) { flushNumbered(); bulletBuf.push(line.replace(/^[-*] /, "")); continue; }
    if (/^\d+\. .+/.test(line)) { flushBullets(); numBuf.push(line.replace(/^\d+\. /, "")); continue; }
    flushBullets();
    flushNumbered();
    const headingMatch = line.match(/^(#{1,3}) (.+)/);
    if (headingMatch) {
      blocks.push(
        <p key={key++} className={`font-semibold text-white mt-3 mb-0.5 ${headingMatch[1].length === 1 ? "text-[16px]" : "text-[15px]"}`}>
          {renderInline(headingMatch[2], `h-${key}`)}
        </p>
      );
      continue;
    }
    if (line.trim() === "") { if (blocks.length) blocks.push(<div key={key++} className="h-2" />); continue; }
    blocks.push(<p key={key++} className="text-white/75 text-[15px] leading-relaxed">{renderInline(line, `p-${key}`)}</p>);
  }
  flushBullets();
  flushNumbered();
  return <>{blocks}</>;
}

// ── Bubble Components ─────────────────────────────────────────────────────────

function PulsingText({ label }: { label: string }) {
  return (
    <div className="flex justify-start">
      <motion.span
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className="text-[14px] text-white/40"
      >
        {label}
      </motion.span>
    </div>
  );
}

function DoneBubble() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex justify-start"
    >
      <div className="inline-flex items-center gap-2 rounded-2xl px-4 py-3" style={{ background: "#1c1c20" }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0">
          <path d="M3 8L6.5 11.5L13 5" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-[15px] font-medium text-white">Work complete.</span>
      </div>
    </motion.div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  // ── Core state ──
  const [user, setUser] = useState<User | null>(null);
  const [studioConnected, setStudioConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [syncToken, setSyncToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [tokenRevealed, setTokenRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [studioBanner, setStudioBanner] = useState<{ message: string; script: string; line: number } | null>(null);

  // ── Chats & projects state ──
  const [chats, setChats] = useState<DbChat[]>([]);
  const [projects, setProjects] = useState<DbProject[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [newChatProjectId, setNewChatProjectId] = useState<string | null>(null);
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const [renamingChatTitle, setRenamingChatTitle] = useState("");
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null);
  const [renamingProjectName, setRenamingProjectName] = useState("");
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());
  const [settingsOpen, setSettingsOpen] = useState(false);

  // ── Refs ──
  const activeChatIdRef = useRef<string | null>(null);
  const thinkingIdRef = useRef<string | null>(null);
  const respondingIdRef = useRef<string | null>(null);
  const workingIdRef = useRef<string | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const manualStopRef = useRef(false);
  const studioTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const lastUserMessageRef = useRef<string>("");
  const firstUserMessageRef = useRef<string>("");
  const heartbeatLastRef = useRef<number>(0);

  const router = useRouter();
  const supabase = createClient();

  // ── Init ─────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id }),
        });
        if (res.ok) {
          const data = await res.json();
          const token = data.token;
          localStorage.setItem("bloxr_sync_token", token);
          setSyncToken(token);
        }
      } catch { /* server offline */ } finally { setTokenLoading(false); }

      try {
        const { data } = await supabase.from("projects").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
        if (data) setProjects(data as DbProject[]);
      } catch { /* ignore */ }

      try {
        const { data } = await supabase.from("chats").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(50);
        if (data) setChats(data as DbChat[]);
      } catch { /* ignore */ }
    };
    init();
  }, []);

  // ── Heartbeat polling ────────────────────────────────────────────────────────

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("bloxr_sync_token") : null;
    if (!token) return;

    const poll = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/sync/heartbeat`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          heartbeatLastRef.current = Date.now();
          const data = await res.json();
          if (data.lastError) {
            setStudioBanner(data.lastError);
          }
        }
      } catch { /* ignore */ }
      const elapsed = Date.now() - heartbeatLastRef.current;
      setStudioConnected(heartbeatLastRef.current > 0 && elapsed < 10000);
    };

    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [syncToken]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }, [input]);

  useEffect(() => {
    if (renamingChatId || renamingProjectId) setTimeout(() => renameInputRef.current?.focus(), 0);
  }, [renamingChatId, renamingProjectId]);

  // ── Chat conversion helpers ───────────────────────────────────────────────

  /** Convert raw DB messages (old or new format) to ChatMsg[] */
  function dbMsgsToChat(raw: unknown[] | null | undefined): ChatMsg[] {
    if (!raw || !Array.isArray(raw)) return [];
    return raw
      .map((m): ChatMsg | null => {
        const msg = m as Record<string, unknown>;
        if (typeof msg.kind === "string") {
          const kind = msg.kind as ChatMsg["kind"];
          if (kind === "user" || kind === "responding") {
            return { id: (msg.id as string) || crypto.randomUUID(), kind, text: (msg.text as string) || "" };
          }
          return null;
        }
        if (msg.role === "user") return { id: crypto.randomUUID(), kind: "user", text: (msg.text as string) || "" };
        if (msg.role === "ai") return { id: crypto.randomUUID(), kind: "responding", text: (msg.text as string) || "" };
        return null;
      })
      .filter((m): m is ChatMsg => m !== null);
  }

  // ── Chat & project handlers ───────────────────────────────────────────────

  const startNewChat = useCallback((projectId: string | null = null) => {
    setMessages([]);
    setConversationHistory([]);
    setActiveChatId(null);
    activeChatIdRef.current = null;
    thinkingIdRef.current = null;
    respondingIdRef.current = null;
    workingIdRef.current = null;
    setNewChatProjectId(projectId);
    setSidebarOpen(false);
    setRenamingChatId(null);
  }, []);

  const loadChat = useCallback(async (chat: DbChat) => {
    let chatMsgs: ChatMsg[];
    if (supabase) {
      try {
        const { data, error } = await supabase.from("chats").select("*").eq("id", chat.id).single();
        console.log("[loadChat] supabase response — error:", error, "data:", data);
        console.log("[loadChat] messages field:", (data as DbChat | null)?.messages);
        if (error || !data) throw new Error("fetch failed: " + error?.message);
        chatMsgs = dbMsgsToChat((data as DbChat).messages);
        console.log("[loadChat] parsed chatMsgs:", chatMsgs);
      } catch (err) {
        console.warn("[loadChat] fetch failed, falling back to cache:", err);
        chatMsgs = dbMsgsToChat(chat.messages);
        console.log("[loadChat] cached chatMsgs:", chatMsgs);
      }
    } else {
      console.warn("[loadChat] supabase not available, using cache");
      chatMsgs = dbMsgsToChat(chat.messages);
    }

    setMessages(chatMsgs);
    setActiveChatId(chat.id);
    activeChatIdRef.current = chat.id;
    thinkingIdRef.current = null;
    respondingIdRef.current = null;
    workingIdRef.current = null;
    setSidebarOpen(false);
    setRenamingChatId(null);

    // Rebuild conversationHistory from fetched messages
    const history: ConversationMessage[] = [];
    for (const msg of chatMsgs) {
      if (msg.kind === "user") history.push({ role: "user", content: msg.text ?? "" });
      else if (msg.kind === "responding" && msg.text) history.push({ role: "assistant", content: msg.text });
    }
    setConversationHistory(trimHistory(history));

    // Scroll to bottom
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [supabase]);

  const startRenameChat = useCallback((chat: DbChat, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingChatId(chat.id);
    setRenamingChatTitle(chat.title);
  }, []);

  const commitRenameChat = useCallback(async () => {
    if (!renamingChatId) return;
    const title = renamingChatTitle.trim();
    setRenamingChatId(null);
    if (!title) return;
    setChats((prev) => prev.map((c) => c.id === renamingChatId ? { ...c, title } : c));
    if (supabase) await supabase.from("chats").update({ title }).eq("id", renamingChatId);
  }, [renamingChatId, renamingChatTitle]);

  const createProject = useCallback(async () => {
    if (!user || !supabase) return;
    try {
      const { data } = await supabase.from("projects").insert({ user_id: user.id, name: "New Project" }).select().single();
      if (data) {
        setProjects((prev) => [data as DbProject, ...prev]);
        setRenamingProjectId((data as DbProject).id);
        setRenamingProjectName("New Project");
      }
    } catch { /* ignore */ }
  }, [user]);

  const startRenameProject = useCallback((project: DbProject, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingProjectId(project.id);
    setRenamingProjectName(project.name);
  }, []);

  const commitRenameProject = useCallback(async () => {
    if (!renamingProjectId) return;
    const name = renamingProjectName.trim();
    setRenamingProjectId(null);
    if (!name) return;
    setProjects((prev) => prev.map((p) => p.id === renamingProjectId ? { ...p, name } : p));
    if (supabase) await supabase.from("projects").update({ name }).eq("id", renamingProjectId);
  }, [renamingProjectId, renamingProjectName]);

  const toggleProjectCollapse = useCallback((projectId: string) => {
    setCollapsedProjects((prev) => {
      const next = new Set(prev);
      next.has(projectId) ? next.delete(projectId) : next.add(projectId);
      return next;
    });
  }, []);

  // ── Stop streaming ────────────────────────────────────────────────────────

  const handleStop = useCallback(() => {
    manualStopRef.current = true;
    readerRef.current?.cancel().catch(() => {});
  }, []);

  // ── Fetch workspace context ────────────────────────────────────────────────

  const fetchWorkspaceContext = async (token: string): Promise<string[] | undefined> => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/sync/context`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        return data.context as string[];
      }
    } catch { /* ignore */ }
    return undefined;
  };

  // ── Auto title after first AI response ────────────────────────────────────

  const autoTitle = async (chatId: string, firstMessage: string, token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/chat/title`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: firstMessage }),
      });
      if (!res.ok) return;
      const { title } = await res.json();
      if (!title) return;
      setChats((prev) => prev.map((c) => c.id === chatId ? { ...c, title } : c));
      if (supabase) {
        supabase.from("chats").update({ title }).eq("id", chatId).then(() => {}).catch(() => {});
      }
    } catch { /* ignore */ }
  };

  // ── Send handler ──────────────────────────────────────────────────────────

  const handleSend = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || isStreaming) return;
    setInput("");

    lastUserMessageRef.current = text;

    const isNewChat = !activeChatIdRef.current && messages.length === 0;
    if (isNewChat) firstUserMessageRef.current = text;
    const projectIdForNewChat = newChatProjectId;
    if (isNewChat) setNewChatProjectId(null);

    // ── State 1: user bubble + thinking bubble ──
    const userMsgId = crypto.randomUUID();
    const tId = crypto.randomUUID();
    thinkingIdRef.current = tId;
    respondingIdRef.current = null;
    workingIdRef.current = null;

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, kind: "user", text },
      { id: tId, kind: "thinking" },
    ]);
    setIsStreaming(true);

    // Create chat row on first message
    if (isNewChat && user && supabase) {
      try {
        const { data } = await supabase
          .from("chats")
          .insert({ user_id: user.id, title: text.slice(0, 40), messages: [{ id: userMsgId, kind: "user", text }], project_id: projectIdForNewChat })
          .select().single();
        if (data) {
          activeChatIdRef.current = (data as DbChat).id;
          setActiveChatId((data as DbChat).id);
          setChats((prev) => [data as DbChat, ...prev]);
        }
      } catch { /* continue without saving */ }
    }

    const token = localStorage.getItem("bloxr_sync_token") ?? "";
    let fullText = "";
    let hasResponded = false;

    // Fetch workspace context before sending
    const workspaceContext = token ? await fetchWorkspaceContext(token) : undefined;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    manualStopRef.current = false;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const resetChunkTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => abortController.abort(), 30000);
    };

    const showResponse = () => {
      if (hasResponded) return;
      hasResponded = true;
      const displayText = stripAllFences(fullText);
      const capturedTId = thinkingIdRef.current;
      thinkingIdRef.current = null;
      if (displayText) {
        const rId = crypto.randomUUID();
        respondingIdRef.current = rId;
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== capturedTId),
          { id: rId, kind: "responding", text: displayText },
        ]);
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== capturedTId));
      }
    };

    let isFirstAiResponse = isNewChat;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: text,
          conversationHistory: trimHistory(conversationHistory),
          ...(workspaceContext ? { workspaceContext } : {}),
        }),
        signal: abortController.signal,
      });

      if (!res.ok || !res.body) throw new Error("Connection error — check your internet and try again");

      const reader = res.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = "";

      resetChunkTimeout();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        resetChunkTimeout();
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") {
            showResponse();
            break;
          }

          let json: { delta?: string; building?: boolean; codePushed?: boolean; error?: string; lastError?: { message: string; script: string; line: number } } | null = null;
          try { json = JSON.parse(payload); } catch { continue; }
          if (!json) continue;

          if (json.error) throw new Error(json.error);

          if (json.delta) {
            fullText += json.delta;
          }

          if (json.building) {
            showResponse();
            // Trigger auto title on first response
            if (isFirstAiResponse && activeChatIdRef.current && token) {
              isFirstAiResponse = false;
              autoTitle(activeChatIdRef.current, firstUserMessageRef.current, token);
            }
            const wId = crypto.randomUUID();
            workingIdRef.current = wId;
            setMessages((prev) => [...prev, { id: wId, kind: "working" }]);
            if (studioTimeoutRef.current) clearTimeout(studioTimeoutRef.current);
            studioTimeoutRef.current = setTimeout(() => {
              const capturedWId = workingIdRef.current;
              if (capturedWId) {
                workingIdRef.current = null;
                const errId = crypto.randomUUID();
                setMessages((prev) => [
                  ...prev.filter((m) => m.id !== capturedWId),
                  { id: errId, kind: "error", text: "Couldn't reach Studio — is the plugin running?" },
                ]);
              }
            }, 60000);
          }

          if (json.codePushed === true && workingIdRef.current) {
            if (studioTimeoutRef.current) { clearTimeout(studioTimeoutRef.current); studioTimeoutRef.current = null; }
            const capturedWId = workingIdRef.current;
            workingIdRef.current = null;
            const doneId = crypto.randomUUID();
            setMessages((prev) => [
              ...prev.filter((m) => m.id !== capturedWId),
              { id: doneId, kind: "done" },
            ]);
          }

          if (json.codePushed === false && workingIdRef.current) {
            if (studioTimeoutRef.current) { clearTimeout(studioTimeoutRef.current); studioTimeoutRef.current = null; }
            const capturedWId = workingIdRef.current;
            workingIdRef.current = null;
            const errId = crypto.randomUUID();
            setMessages((prev) => [
              ...prev.filter((m) => m.id !== capturedWId),
              { id: errId, kind: "error", text: "Couldn't reach Studio — is the plugin running?" },
            ]);
          }
        }
      }
    } catch (err) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      if (isAbort && manualStopRef.current) {
        showResponse();
      } else {
        const errText = isAbort
          ? "Timed out — try again"
          : err instanceof Error ? err.message : "Connection error — check your internet and try again";
        const capturedTId = thinkingIdRef.current;
        thinkingIdRef.current = null;
        const errId = crypto.randomUUID();
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== capturedTId),
          { id: errId, kind: "error", text: errText },
        ]);
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      if (studioTimeoutRef.current) { clearTimeout(studioTimeoutRef.current); studioTimeoutRef.current = null; }
      readerRef.current = null;
      abortControllerRef.current = null;

      const finalText = stripAllFences(fullText);
      const chatId = activeChatIdRef.current;
      const capturedRId = respondingIdRef.current;
      const capturedTId = thinkingIdRef.current;
      const capturedWId = workingIdRef.current;

      let capturedFinal: ChatMsg[] = [];
      setMessages((prev) => {
        const updated = prev
          .filter((m) => m.id !== capturedTId)
          .filter((m) => !(m.id === capturedRId && !finalText))
          .map((m) => {
            if (m.id === capturedRId && finalText) return { ...m, text: finalText };
            if (m.id === capturedWId) return { ...m, kind: "error" as const, text: "Couldn't reach Studio — is the plugin running?" };
            return m;
          });
        capturedFinal = updated;
        return updated;
      });

      thinkingIdRef.current = null;
      workingIdRef.current = null;
      setIsStreaming(false);

      setConversationHistory((prev) =>
        trimHistory([
          ...prev,
          { role: "user", content: text },
          { role: "assistant", content: fullText },
        ])
      );

      if (chatId && supabase) {
        const now = new Date().toISOString();
        const saveable = capturedFinal
          .filter((m) => m.kind === "user" || m.kind === "responding")
          .map((m) => ({ id: m.id, kind: m.kind, text: m.text ?? "" }));
        supabase
          .from("chats")
          .update({ messages: saveable, updated_at: now })
          .eq("id", chatId)
          .then(() => setChats((prev) => prev.map((c) => c.id === chatId ? { ...c, messages: saveable, updated_at: now } : c)))
          .catch(() => {});
      }
    }
  };

  // ── Retry ────────────────────────────────────────────────────────────────

  const handleRetry = () => {
    if (lastUserMessageRef.current) {
      // Remove the last error bubble before retrying
      setMessages((prev) => {
        const lastErr = [...prev].reverse().find((m) => m.kind === "error");
        if (lastErr) return prev.filter((m) => m.id !== lastErr.id);
        return prev;
      });
      handleSend(lastUserMessageRef.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
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

  // ── Derived ──────────────────────────────────────────────────────────────

  const maskedToken = syncToken ? syncToken.slice(0, 4) + "●".repeat(10) + syncToken.slice(-4) : null;
  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;
  const unassignedChats = chats.filter((c) => !c.project_id);

  // Check if the last message is an error for showing Retry
  const lastMsg = messages[messages.length - 1];
  const showRetry = !isStreaming && lastMsg?.kind === "error";

  // ── Sidebar component (shared between md+ and mobile) ────────────────────

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center px-5 h-[60px] border-b border-white/[0.06] shrink-0">
        <Image src="/logo.png" alt="Bloxr" width={40} height={40} className="object-contain" />
        <span className="ml-2 text-white text-[15px] font-bold tracking-tight">Bloxr</span>
      </div>

      {/* New Chat button */}
      <div className="px-3 pt-3 shrink-0">
        <button
          onClick={() => startNewChat()}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-white/[0.08] hover:border-white/[0.14] hover:bg-white/[0.03] text-white/50 hover:text-white/80 text-[13px] font-medium transition-all duration-200"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          New chat
        </button>
      </div>

      {/* Scrollable middle */}
      <div className="flex-1 overflow-y-auto px-3 pt-4 flex flex-col min-h-0">

        {/* ── Chats & Projects ── */}
        <div className="flex-1">
          <div className="flex items-center justify-between px-1 mb-2">
            <p className="text-[11px] text-white/25 font-semibold uppercase tracking-[0.1em]">Chats</p>
            <button onClick={createProject} title="New project" className="flex items-center gap-1 text-[11px] text-white/25 hover:text-white/60 transition-colors">
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              New Project
            </button>
          </div>

          {projects.map((project) => {
            const projectChats = chats.filter((c) => c.project_id === project.id);
            const isCollapsed = collapsedProjects.has(project.id);
            return (
              <div key={project.id} className="mb-1">
                <div className="flex items-center gap-1 group rounded-xl hover:bg-white/[0.03] pr-1">
                  <button onClick={() => toggleProjectCollapse(project.id)} className="flex items-center gap-1.5 flex-1 min-w-0 px-2 py-2">
                    <motion.svg width="10" height="10" viewBox="0 0 12 12" fill="none" animate={{ rotate: isCollapsed ? -90 : 0 }} transition={{ duration: 0.15 }} className="shrink-0 text-white/25">
                      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </motion.svg>
                    {renamingProjectId === project.id ? (
                      <input
                        ref={renameInputRef}
                        value={renamingProjectName}
                        onChange={(e) => setRenamingProjectName(e.target.value)}
                        onBlur={commitRenameProject}
                        onKeyDown={(e) => { if (e.key === "Enter") commitRenameProject(); if (e.key === "Escape") setRenamingProjectId(null); }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 min-w-0 bg-transparent text-[13px] text-white outline-none border-b border-white/25"
                      />
                    ) : (
                      <span className="flex-1 min-w-0 text-[13px] font-medium text-white/55 truncate text-left">{project.name}</span>
                    )}
                  </button>
                  <button onClick={(e) => startRenameProject(project, e)} className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-white/60 transition-all p-1 shrink-0">
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M11 2l3 3-8 8H3v-3l8-8z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>
                  </button>
                  <button onClick={() => startNewChat(project.id)} className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-white/60 transition-all p-1 shrink-0">
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  </button>
                </div>
                {!isCollapsed && (
                  <div className="ml-3 border-l border-white/[0.05] pl-2 space-y-0.5 mt-0.5">
                    {projectChats.length === 0
                      ? <p className="text-[11px] text-white/15 px-2 py-1">No chats yet</p>
                      : projectChats.map((chat) => (
                        <ChatRow
                          key={chat.id} chat={chat}
                          isActive={activeChatId === chat.id}
                          isRenaming={renamingChatId === chat.id}
                          renameTitle={renamingChatTitle}
                          renameInputRef={renamingChatId === chat.id ? renameInputRef : undefined}
                          onLoad={() => loadChat(chat)}
                          onStartRename={(e) => startRenameChat(chat, e)}
                          onRenameChange={setRenamingChatTitle}
                          onRenameCommit={commitRenameChat}
                          onRenameCancel={() => setRenamingChatId(null)}
                        />
                      ))
                    }
                  </div>
                )}
              </div>
            );
          })}

          {unassignedChats.length > 0 && (
            <div className={`space-y-0.5 ${projects.length > 0 ? "mt-3" : ""}`}>
              {projects.length > 0 && <p className="text-[11px] text-white/15 px-1 mb-1.5">Other chats</p>}
              {unassignedChats.map((chat) => (
                <ChatRow
                  key={chat.id} chat={chat}
                  isActive={activeChatId === chat.id}
                  isRenaming={renamingChatId === chat.id}
                  renameTitle={renamingChatTitle}
                  renameInputRef={renamingChatId === chat.id ? renameInputRef : undefined}
                  onLoad={() => loadChat(chat)}
                  onStartRename={(e) => startRenameChat(chat, e)}
                  onRenameChange={setRenamingChatTitle}
                  onRenameCommit={commitRenameChat}
                  onRenameCancel={() => setRenamingChatId(null)}
                />
              ))}
            </div>
          )}

          {chats.length === 0 && projects.length === 0 && (
            <p className="text-[11px] text-white/15 px-1 mt-1">No chats yet — send a message to start</p>
          )}
        </div>

        {/* ── Studio ── */}
        <div className="border-t border-white/[0.06] pt-4 mt-4 shrink-0">
          <p className="text-[11px] text-white/25 font-semibold uppercase tracking-[0.1em] px-1 mb-3">Studio</p>
          <div className="flex items-center gap-2.5 px-1 mb-2">
            <div className="relative shrink-0">
              {studioConnected && <motion.div className="absolute inset-0 rounded-full bg-[#10B981]" animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }} transition={{ duration: 2, repeat: Infinity }} />}
              <div className={`w-2 h-2 rounded-full ${studioConnected ? "bg-[#10B981]" : "bg-white/20"}`} />
            </div>
            <span className={`text-[13px] font-medium ${studioConnected ? "text-[#10B981]" : "text-white/35"}`}>
              {studioConnected ? "Studio connected" : "Studio disconnected"}
            </span>
          </div>
          <p className="text-[11px] text-white/20 px-1 leading-relaxed">Open Roblox Studio and activate the Bloxr plugin to connect.</p>
        </div>

        {/* ── Token ── */}
        {!tokenLoading && (
          <div className="border-t border-white/[0.06] pt-4 mt-4 pb-3 shrink-0">
            <div className="flex items-center justify-between px-1 mb-2.5">
              <p className="text-[11px] text-white/25 font-semibold uppercase tracking-[0.1em]">Studio Token</p>
              <button onClick={() => setTokenRevealed((v) => !v)} className="text-white/20 hover:text-white/50 transition-colors">
                {tokenRevealed ? (
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z" stroke="currentColor" strokeWidth="1.2" /><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" /><path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z" stroke="currentColor" strokeWidth="1.2" /><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" /></svg>
                )}
              </button>
            </div>
            {syncToken ? (
              <div className="rounded-xl border border-white/[0.07] overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2.5 bg-black/30">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#4F8EF7]/60 shrink-0" />
                  <span className="flex-1 text-[11px] font-mono text-white/40 truncate">{tokenRevealed ? syncToken : maskedToken}</span>
                </div>
                <button onClick={handleCopyToken} className="w-full flex items-center justify-center gap-2 py-2 text-[12px] bg-white/[0.02] hover:bg-white/[0.05] border-t border-white/[0.06] transition-all duration-200">
                  {copied ? (
                    <><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 5" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg><span className="text-[#10B981] font-medium">Copied!</span></>
                  ) : (
                    <><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="8" height="8" rx="1.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" /><path d="M3 11V3.5A1.5 1.5 0 014.5 2H11" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round" /></svg><span className="text-white/30 font-medium">Copy token</span></>
                  )}
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-white/20 px-1">No token — server offline</p>
            )}
          </div>
        )}
      </div>

      {/* User row */}
      <div className="px-4 py-4 border-t border-white/[0.06] flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4F8EF7]/30 to-[#4F8EF7]/10 border border-[#4F8EF7]/20 flex items-center justify-center shrink-0">
          <span className="text-[14px] text-[#4F8EF7] font-bold uppercase">{user?.email?.[0] ?? "U"}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-white/80 text-[13px] font-semibold truncate">{user?.email?.split("@")[0] ?? "User"}</p>
          <p className="text-white/30 text-[12px] truncate">{user?.email ?? ""}</p>
        </div>
        <div className="relative shrink-0">
          <button title="Settings" onClick={() => setSettingsOpen((v) => !v)} className={`text-white/25 hover:text-white/70 transition-colors ${settingsOpen ? "text-white/70" : ""}`}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M17 10a7 7 0 01-.07 1l1.53 1.19a.4.4 0 01.09.5l-1.45 2.51a.4.4 0 01-.48.17l-1.8-.72a7.1 7.1 0 01-.87.5l-.27 1.91a.39.39 0 01-.39.34H8.71a.39.39 0 01-.39-.34l-.27-1.91a7.1 7.1 0 01-.87-.5l-1.8.72a.4.4 0 01-.48-.17L3.45 12.7a.4.4 0 01.09-.5L5.07 11A7.12 7.12 0 015 10c0-.34.02-.68.07-1L3.54 7.81a.4.4 0 01-.09-.5l1.45-2.51a.4.4 0 01.48-.17l1.8.72a7.1 7.1 0 01.87-.5l.27-1.91A.39.39 0 018.71 2.6h2.9c.2 0 .36.14.39.34l.27 1.91c.3.14.6.31.87.5l1.8-.72a.4.4 0 01.48.17l1.45 2.51a.4.4 0 01-.09.5L15.93 9c.05.32.07.66.07 1z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <AnimatePresence>
            {settingsOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSettingsOpen(false)} />
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 4 }} transition={{ duration: 0.12 }} className="absolute bottom-full right-0 mb-2 z-20 w-[160px] rounded-xl border border-white/[0.08] overflow-hidden" style={{ background: "#161616" }}>
                  <button onClick={() => { setSettingsOpen(false); handleLogout(); }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-white/60 hover:text-white hover:bg-white/[0.05] transition-all duration-150">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M6 3H3a1 1 0 00-1 1v8a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    Sign out
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: "#080808" }}>

      {/* ── SIDEBAR — desktop ── */}
      <div className="hidden md:flex flex-col w-[300px] shrink-0 border-r border-white/[0.06]" style={{ background: "#0c0c0c" }}>
        <SidebarContent />
      </div>

      {/* ── SIDEBAR — mobile overlay ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/60 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              transition={{ type: "tween", duration: 0.22 }}
              className="fixed left-0 top-0 bottom-0 z-40 flex flex-col w-[300px] border-r border-white/[0.06] md:hidden"
              style={{ background: "#0c0c0c" }}
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── MAIN CHAT AREA ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <div className="flex items-center justify-between px-4 md:px-6 h-[60px] border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-white/40 hover:text-white/70 transition-colors p-1"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
            <p className="text-white text-[14px] font-semibold truncate max-w-[260px] md:max-w-[400px]">
              {activeChat ? activeChat.title : "Chat"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {studioConnected && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#10B981]/[0.08] border border-[#10B981]/20">
                <motion.div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                <span className="text-[12px] text-[#10B981] font-medium hidden sm:block">Live sync active</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Studio error banner */}
        <AnimatePresence>
          {studioBanner && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="flex items-center justify-between gap-3 px-5 py-2.5 border-b border-yellow-500/20 bg-yellow-500/[0.06] shrink-0"
            >
              <span className="text-[13px] text-yellow-400 truncate">
                Studio error in {studioBanner.script}:{studioBanner.line} — {studioBanner.message}
              </span>
              <button
                onClick={() => setStudioBanner(null)}
                className="shrink-0 text-yellow-400/60 hover:text-yellow-400 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {messages.length === 0 && !activeChatId ? (

              /* ── Empty state: no chat selected — show suggested prompts ── */
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full px-6 md:px-8 pb-16">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-[#4F8EF7]/10 rounded-full blur-[60px] scale-[2]" />
                  <motion.div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4F8EF7]/20 to-[#4F8EF7]/5 border border-[#4F8EF7]/20 flex items-center justify-center" animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                    <Image src="/logo.png" alt="Bloxr" width={32} height={32} className="object-contain" />
                  </motion.div>
                </div>
                <h2 className="text-white text-[22px] font-semibold mb-2 tracking-tight">What do you want to build?</h2>
                <p className="text-white/35 text-[15px] text-center max-w-[360px] leading-relaxed mb-8">
                  Describe any Roblox feature in plain English. Bloxr writes the code and pushes it to your game instantly.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 w-full max-w-[580px]">
                  {SUGGESTED_PROMPTS.map((prompt, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 + 0.1 }}
                      onClick={() => handleSend(prompt)}
                      className="text-left px-4 py-3 rounded-xl border border-white/[0.07] hover:border-[#4F8EF7]/40 bg-white/[0.02] hover:bg-[#4F8EF7]/[0.06] text-white/50 hover:text-white/80 text-[13px] leading-relaxed transition-all duration-200"
                    >
                      {prompt}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

            ) : messages.length === 0 && activeChatId ? (

              /* ── Chat selected but no messages loaded ── */
              <motion.div key="empty-chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center h-full">
                <p className="text-white/25 text-[14px]">No messages in this chat.</p>
              </motion.div>

            ) : (

              /* ── Message list ── */
              <motion.div key="messages" className="px-4 md:px-8 py-8 space-y-4 max-w-[820px] mx-auto w-full">
                <AnimatePresence initial={false}>
                  {messages.map((msg) => {
                    const isUser = msg.kind === "user";
                    const isDone = msg.kind === "done";
                    return (
                      <motion.div
                        key={msg.id}
                        initial={isDone ? false : { opacity: 0, y: isUser ? 0 : 8, x: isUser ? 20 : 0 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, transition: { duration: 0.2 } }}
                        transition={{ duration: isUser ? 0.2 : 0.4, ease: "easeOut" }}
                      >
                        {/* UserBubble */}
                        {msg.kind === "user" && (
                          <div className="flex justify-end">
                            <div className="max-w-[85%] md:max-w-[60%] bg-white text-black text-[15px] rounded-2xl px-4 py-3 font-medium whitespace-pre-wrap leading-relaxed">
                              {msg.text}
                            </div>
                          </div>
                        )}

                        {/* ThinkingBubble */}
                        {msg.kind === "thinking" && <PulsingText label="Thinking..." />}

                        {/* ResponseBubble */}
                        {msg.kind === "responding" && (
                          <div className="flex justify-start">
                            <div className="max-w-[85%] md:max-w-[640px] min-w-0 rounded-2xl px-4 py-3 text-[15px]" style={{ background: "#1c1c20" }}>
                              {renderMarkdown(msg.text ?? "")}
                            </div>
                          </div>
                        )}

                        {/* WorkingBubble */}
                        {msg.kind === "working" && <PulsingText label="Building..." />}

                        {/* DoneBubble */}
                        {msg.kind === "done" && <DoneBubble />}

                        {/* ErrorBubble */}
                        {msg.kind === "error" && (
                          <p className="text-[14px] text-white/40">{msg.text}</p>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {/* Retry button */}
                {showRetry && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                    <button
                      onClick={handleRetry}
                      className="text-[13px] text-white/40 hover:text-white/70 border border-white/[0.08] hover:border-white/[0.18] rounded-lg px-3 py-1.5 transition-all duration-200"
                    >
                      Retry
                    </button>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </motion.div>

            )}
          </AnimatePresence>
        </div>

        {/* ── Input ── */}
        <div className="px-4 md:px-6 pb-5 pt-3 shrink-0">
          <div className="rounded-2xl border border-white/[0.08] focus-within:border-white/[0.14] transition-colors duration-200" style={{ background: "#111" }}>
            <div className="flex items-end gap-2.5 px-3 pt-3 pb-3">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe what you want to build..."
                className="flex-1 bg-transparent text-[14px] text-white/90 placeholder:text-white/25 outline-none resize-none leading-relaxed py-1"
                style={{ maxHeight: 140 }}
              />
              {isStreaming ? (
                <button
                  onClick={handleStop}
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-red-500/30 hover:bg-red-500/10 transition-all duration-200 active:scale-95"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <rect width="10" height="10" rx="1.5" fill="rgba(239,68,68,0.85)" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${input.trim() ? "bg-white hover:bg-white/90 active:scale-95" : "bg-white/[0.06] cursor-not-allowed"}`}
                >
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <path d="M8 12V4M8 4L4.5 7.5M8 4L11.5 7.5" stroke={input.trim() ? "#000" : "rgba(255,255,255,0.25)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── ChatRow ───────────────────────────────────────────────────────────────────

function ChatRow({
  chat, isActive, isRenaming, renameTitle, renameInputRef,
  onLoad, onStartRename, onRenameChange, onRenameCommit, onRenameCancel,
}: {
  chat: DbChat;
  isActive: boolean;
  isRenaming: boolean;
  renameTitle: string;
  renameInputRef?: React.RefObject<HTMLInputElement>;
  onLoad: () => void;
  onStartRename: (e: React.MouseEvent) => void;
  onRenameChange: (v: string) => void;
  onRenameCommit: () => void;
  onRenameCancel: () => void;
}) {
  return (
    <div className="flex items-center group">
      <button
        onClick={onLoad}
        onDoubleClick={onStartRename}
        className={`flex-1 min-w-0 flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all duration-150 ${isActive ? "bg-white/[0.06] text-white" : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"}`}
      >
        <div className={`w-1 h-1 rounded-full shrink-0 ${isActive ? "bg-[#4F8EF7]" : "bg-white/10"}`} />
        {isRenaming ? (
          <input
            ref={renameInputRef}
            value={renameTitle}
            onChange={(e) => onRenameChange(e.target.value)}
            onBlur={onRenameCommit}
            onKeyDown={(e) => { if (e.key === "Enter") onRenameCommit(); if (e.key === "Escape") onRenameCancel(); }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 min-w-0 bg-transparent text-[13px] text-white outline-none border-b border-white/25"
          />
        ) : (
          <span className="flex-1 min-w-0 text-[13px] truncate overflow-hidden text-ellipsis">{chat.title}</span>
        )}
      </button>
      {!isRenaming && (
        <button onClick={onStartRename} className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-white/60 transition-all p-1.5 shrink-0">
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M11 2l3 3-8 8H3v-3l8-8z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>
        </button>
      )}
    </div>
  );
}
