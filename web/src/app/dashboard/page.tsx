"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type { User } from "@supabase/supabase-js";

// ── Types ────────────────────────────────────────────────────────────────────

type Message = {
  role: "user" | "ai" | "status";
  text: string;
  streaming?: boolean;
  statusKind?: "building" | "pushed";
};

type ConversationMessage = { role: "user" | "assistant"; content: string };

type DbChat = {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  messages: Message[];
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

const EXAMPLE_PROMPTS = [
  "Add a shop where players buy speed boosts with coins",
  "Create a stamina bar that drains when sprinting",
  "Make enemies patrol and chase players within 20 studs",
  "Add a leaderboard showing top 10 kills",
];

// ── Markdown helpers ────────────────────────────────────────────────────────

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

    if (/^[-*] .+/.test(line)) {
      flushNumbered();
      bulletBuf.push(line.replace(/^[-*] /, ""));
      continue;
    }

    if (/^\d+\. .+/.test(line)) {
      flushBullets();
      numBuf.push(line.replace(/^\d+\. /, ""));
      continue;
    }

    flushBullets();
    flushNumbered();

    const headingMatch = line.match(/^(#{1,3}) (.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      blocks.push(
        <p key={key++} className={`font-semibold text-white mt-3 mb-0.5 ${level === 1 ? "text-[16px]" : "text-[15px]"}`}>
          {renderInline(headingMatch[2], `h-${key}`)}
        </p>
      );
      continue;
    }

    if (line.trim() === "") {
      if (blocks.length) blocks.push(<div key={key++} className="h-2" />);
      continue;
    }

    blocks.push(
      <p key={key++} className="text-white/75 text-[15px] leading-relaxed">
        {renderInline(line, `p-${key}`)}
      </p>
    );
  }

  flushBullets();
  flushNumbered();
  return <>{blocks}</>;
}

// ── UI Components ────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-white/30"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  // ── Core state ──
  const [user, setUser] = useState<User | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [syncToken, setSyncToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [tokenRevealed, setTokenRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [attachments, setAttachments] = useState<string[]>([]);

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

  // ── Refs ──
  const activeChatIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const supabase = createClient();

  // ── Init ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);

      // Fetch token
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

      // Fetch projects
      try {
        const { data: projectsData } = await supabase
          .from("projects")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (projectsData) setProjects(projectsData as DbProject[]);
      } catch { /* ignore */ }

      // Fetch recent chats
      try {
        const { data: chatsData } = await supabase
          .from("chats")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(50);
        if (chatsData) setChats(chatsData as DbChat[]);
      } catch { /* ignore */ }
    };
    init();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }, [input]);

  // Focus rename input when it becomes active
  useEffect(() => {
    if (renamingChatId || renamingProjectId) {
      setTimeout(() => renameInputRef.current?.focus(), 0);
    }
  }, [renamingChatId, renamingProjectId]);

  // ── Chat & project handlers ──────────────────────────────────────────────────

  const startNewChat = useCallback((projectId: string | null = null) => {
    setMessages([]);
    setConversationHistory([]);
    setActiveChatId(null);
    activeChatIdRef.current = null;
    setNewChatProjectId(projectId);
    setRenamingChatId(null);
  }, []);

  const loadChat = useCallback((chat: DbChat) => {
    setMessages(chat.messages);
    setActiveChatId(chat.id);
    activeChatIdRef.current = chat.id;
    setRenamingChatId(null);
    // Reconstruct conversation history from saved messages
    const history: ConversationMessage[] = [];
    for (const msg of chat.messages) {
      if (msg.role === "user") history.push({ role: "user", content: msg.text });
      else if (msg.role === "ai" && msg.text) history.push({ role: "assistant", content: msg.text });
    }
    setConversationHistory(history);
  }, []);

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
    if (supabase) {
      await supabase.from("chats").update({ title }).eq("id", renamingChatId);
    }
  }, [renamingChatId, renamingChatTitle]);

  const createProject = useCallback(async () => {
    if (!user || !supabase) return;
    const name = "New Project";
    try {
      const { data } = await supabase
        .from("projects")
        .insert({ user_id: user.id, name })
        .select()
        .single();
      if (data) {
        const project = data as DbProject;
        setProjects((prev) => [project, ...prev]);
        // Start renaming immediately
        setRenamingProjectId(project.id);
        setRenamingProjectName(name);
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
    if (supabase) {
      await supabase.from("projects").update({ name }).eq("id", renamingProjectId);
    }
  }, [renamingProjectId, renamingProjectName]);

  const toggleProjectCollapse = useCallback((projectId: string) => {
    setCollapsedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }, []);

  // ── Main send handler ────────────────────────────────────────────────────────

  const handleSend = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || isStreaming) return;
    setInput("");

    const isNewChat = !activeChatIdRef.current && messages.length === 0;
    const projectIdForNewChat = newChatProjectId;
    if (isNewChat) setNewChatProjectId(null);

    setMessages((prev) => [...prev, { role: "user", text }]);
    setMessages((prev) => [...prev, { role: "ai", text: "", streaming: true }]);
    setIsStreaming(true);

    // Create chat row on the first message
    if (isNewChat && user && supabase) {
      const title = text.slice(0, 40);
      try {
        const { data } = await supabase
          .from("chats")
          .insert({
            user_id: user.id,
            title,
            messages: [{ role: "user", text }],
            project_id: projectIdForNewChat,
          })
          .select()
          .single();
        if (data) {
          const newChat = data as DbChat;
          activeChatIdRef.current = newChat.id;
          setActiveChatId(newChat.id);
          setChats((prev) => [newChat, ...prev]);
        }
      } catch { /* chat creation failed — still run the conversation */ }
    }

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
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].role === "ai") {
            updated[i] = { role: "ai", text: errText };
            break;
          }
        }
        return updated;
      });
    } finally {
      const displayText = fullText.replace(/```json[\s\S]*?```/, "").trim();
      const chatId = activeChatIdRef.current;

      // Capture the final messages list synchronously inside the setter
      let capturedFinalMessages: Message[] = [];
      setMessages((prev) => {
        const updated = [...prev];
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].role === "ai") {
            updated[i] = { role: "ai", text: displayText };
            break;
          }
        }
        capturedFinalMessages = updated;
        return updated;
      });

      setIsStreaming(false);

      setConversationHistory((prev) => [
        ...prev,
        { role: "user", content: text },
        { role: "assistant", content: fullText },
      ]);

      // Persist the updated messages to Supabase
      if (chatId && supabase) {
        const now = new Date().toISOString();
        supabase
          .from("chats")
          .update({ messages: capturedFinalMessages, updated_at: now })
          .eq("id", chatId)
          .then(() => {
            setChats((prev) =>
              prev.map((c) =>
                c.id === chatId
                  ? { ...c, messages: capturedFinalMessages, updated_at: now }
                  : c
              )
            );
          })
          .catch(() => { /* ignore save errors */ });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setAttachments((prev) => [...prev, ...files.map((f) => f.name)]);
    e.target.value = "";
  }, []);

  const removeAttachment = useCallback((i: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== i));
  }, []);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const maskedToken = syncToken
    ? syncToken.slice(0, 4) + "●".repeat(10) + syncToken.slice(-4)
    : null;

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;

  const unassignedChats = chats.filter((c) => !c.project_id);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: "#080808" }}>

      {/* ── SIDEBAR ── */}
      <div className="hidden md:flex flex-col w-[300px] shrink-0 border-r border-white/[0.06]" style={{ background: "#0c0c0c" }}>

        {/* Logo */}
        <div className="flex items-center px-5 h-[60px] border-b border-white/[0.06]">
          <Image src="/logo.png" alt="Bloxr" width={26} height={26} className="object-contain" />
          <span className="ml-2 text-white text-[15px] font-bold tracking-tight">Bloxr</span>
        </div>

        {/* New Chat button */}
        <div className="px-3 pt-3">
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
              <button
                onClick={createProject}
                title="New project"
                className="flex items-center gap-1 text-[11px] text-white/25 hover:text-white/60 transition-colors"
              >
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                New Project
              </button>
            </div>

            {/* Projects (with nested chats) */}
            {projects.map((project) => {
              const projectChats = chats.filter((c) => c.project_id === project.id);
              const isCollapsed = collapsedProjects.has(project.id);
              return (
                <div key={project.id} className="mb-1">
                  {/* Project header */}
                  <div className="flex items-center gap-1 group rounded-xl hover:bg-white/[0.03] pr-1">
                    <button
                      onClick={() => toggleProjectCollapse(project.id)}
                      className="flex items-center gap-1.5 flex-1 min-w-0 px-2 py-2"
                    >
                      <motion.svg
                        width="10" height="10" viewBox="0 0 12 12" fill="none"
                        animate={{ rotate: isCollapsed ? -90 : 0 }}
                        transition={{ duration: 0.15 }}
                        className="shrink-0 text-white/25"
                      >
                        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </motion.svg>
                      {renamingProjectId === project.id ? (
                        <input
                          ref={renameInputRef}
                          value={renamingProjectName}
                          onChange={(e) => setRenamingProjectName(e.target.value)}
                          onBlur={commitRenameProject}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitRenameProject();
                            if (e.key === "Escape") setRenamingProjectId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 min-w-0 bg-transparent text-[13px] text-white outline-none border-b border-white/25"
                        />
                      ) : (
                        <span className="flex-1 min-w-0 text-[13px] font-medium text-white/55 truncate text-left">
                          {project.name}
                        </span>
                      )}
                    </button>
                    {/* Rename project icon */}
                    <button
                      onClick={(e) => startRenameProject(project, e)}
                      className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-white/60 transition-all p-1 shrink-0"
                    >
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                        <path d="M11 2l3 3-8 8H3v-3l8-8z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                      </svg>
                    </button>
                    {/* New chat in project */}
                    <button
                      onClick={() => startNewChat(project.id)}
                      className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-white/60 transition-all p-1 shrink-0"
                    >
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                        <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>

                  {/* Chats nested under project */}
                  {!isCollapsed && (
                    <div className="ml-3 border-l border-white/[0.05] pl-2 space-y-0.5 mt-0.5">
                      {projectChats.length === 0 ? (
                        <p className="text-[11px] text-white/15 px-2 py-1">No chats yet</p>
                      ) : (
                        projectChats.map((chat) => (
                          <ChatRow
                            key={chat.id}
                            chat={chat}
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
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Unassigned chats */}
            {unassignedChats.length > 0 && (
              <div className={`space-y-0.5 ${projects.length > 0 ? "mt-3" : ""}`}>
                {projects.length > 0 && (
                  <p className="text-[11px] text-white/15 px-1 mb-1.5">Other chats</p>
                )}
                {unassignedChats.map((chat) => (
                  <ChatRow
                    key={chat.id}
                    chat={chat}
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

          {/* ── Studio section ── */}
          <div className="border-t border-white/[0.06] pt-4 mt-4">
            <p className="text-[11px] text-white/25 font-semibold uppercase tracking-[0.1em] px-1 mb-3">Studio</p>

            <div className="flex items-center gap-2.5 px-1 mb-2">
              <div className="relative shrink-0">
                {connected && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-[#10B981]"
                    animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
                <div className={`w-2 h-2 rounded-full ${connected ? "bg-[#10B981]" : "bg-white/20"}`} />
              </div>
              <span className={`text-[13px] font-medium ${connected ? "text-[#10B981]" : "text-white/35"}`}>
                {connected ? "Studio connected" : "Not connected"}
              </span>
            </div>

            <p className="text-[11px] text-white/20 px-1 leading-relaxed">
              Open Roblox Studio and activate the Bloxr plugin to connect.
            </p>
          </div>

          {/* ── Token section ── */}
          {!tokenLoading && (
            <div className="border-t border-white/[0.06] pt-4 mt-4 pb-3">
              <div className="flex items-center justify-between px-1 mb-2.5">
                <p className="text-[11px] text-white/25 font-semibold uppercase tracking-[0.1em]">Studio Token</p>
                <button
                  onClick={() => setTokenRevealed((v) => !v)}
                  className="text-white/20 hover:text-white/50 transition-colors"
                >
                  {tokenRevealed ? (
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                      <path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z" stroke="currentColor" strokeWidth="1.2" />
                      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                      <path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z" stroke="currentColor" strokeWidth="1.2" />
                      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                  )}
                </button>
              </div>

              {syncToken ? (
                <div className="rounded-xl border border-white/[0.07] overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-black/30">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4F8EF7]/60 shrink-0" />
                    <span className="flex-1 text-[11px] font-mono text-white/40 truncate">
                      {tokenRevealed ? syncToken : maskedToken}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyToken}
                    className="w-full flex items-center justify-center gap-2 py-2 text-[12px] bg-white/[0.02] hover:bg-white/[0.05] border-t border-white/[0.06] transition-all duration-200"
                  >
                    {copied ? (
                      <>
                        <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8L6.5 11.5L13 5" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-[#10B981] font-medium">Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                          <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />
                          <path d="M3 11V3.5A1.5 1.5 0 014.5 2H11" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round" />
                        </svg>
                        <span className="text-white/30 font-medium">Copy token</span>
                      </>
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
        <div className="px-4 py-4 border-t border-white/[0.06] flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4F8EF7]/30 to-[#4F8EF7]/10 border border-[#4F8EF7]/20 flex items-center justify-center shrink-0">
            <span className="text-[14px] text-[#4F8EF7] font-bold uppercase">
              {user?.email?.[0] ?? "U"}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white/80 text-[13px] font-semibold truncate">{user?.email?.split("@")[0] ?? "User"}</p>
            <p className="text-white/30 text-[12px] truncate">{user?.email ?? ""}</p>
          </div>
          <button
            title="Settings"
            className="text-white/25 hover:text-white/70 transition-colors shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M17 10a7 7 0 01-.07 1l1.53 1.19a.4.4 0 01.09.5l-1.45 2.51a.4.4 0 01-.48.17l-1.8-.72a7.1 7.1 0 01-.87.5l-.27 1.91a.39.39 0 01-.39.34H8.71a.39.39 0 01-.39-.34l-.27-1.91a7.1 7.1 0 01-.87-.5l-1.8.72a.4.4 0 01-.48-.17L3.45 12.7a.4.4 0 01.09-.5L5.07 11A7.12 7.12 0 015 10c0-.34.02-.68.07-1L3.54 7.81a.4.4 0 01-.09-.5l1.45-2.51a.4.4 0 01.48-.17l1.8.72a7.1 7.1 0 01.87-.5l.27-1.91A.39.39 0 018.71 2.6h2.9c.2 0 .36.14.39.34l.27 1.91c.3.14.6.31.87.5l1.8-.72a.4.4 0 01.48.17l1.45 2.51a.4.4 0 01-.09.5L15.93 9c.05.32.07.66.07 1z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── MAIN CHAT AREA ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 h-[60px] border-b border-white/[0.06] shrink-0">
          <div>
            <p className="text-white text-[14px] font-semibold truncate max-w-[400px]">
              {activeChat ? activeChat.title : "Chat"}
            </p>
            <p className="text-white/30 text-[12px]">Powered by Bloxr</p>
          </div>

          <div className="flex items-center gap-3">
            {connected && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#10B981]/[0.08] border border-[#10B981]/20"
              >
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-[#10B981]"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-[12px] text-[#10B981] font-medium">Live sync active</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {messages.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full px-8 pb-16"
              >
                {/* Logo with glow */}
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-[#4F8EF7]/10 rounded-full blur-[60px] scale-[2]" />
                  <motion.div
                    className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4F8EF7]/20 to-[#4F8EF7]/5 border border-[#4F8EF7]/20 flex items-center justify-center"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Image src="/logo.png" alt="Bloxr" width={32} height={32} className="object-contain" />
                  </motion.div>
                </div>

                <h2 className="text-white text-[22px] font-semibold mb-2 tracking-tight">
                  What do you want to build?
                </h2>
                <p className="text-white/35 text-[15px] text-center max-w-[360px] leading-relaxed mb-10">
                  Describe any Roblox feature in plain English. Bloxr writes the code and pushes it to your game instantly.
                </p>

                {/* Suggestion grid */}
                <div className="grid grid-cols-2 gap-2.5 w-full max-w-[580px]">
                  {EXAMPLE_PROMPTS.map((prompt, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 + 0.1 }}
                      onClick={() => handleSend(prompt)}
                      className="text-left px-4 py-3.5 rounded-xl border border-white/[0.07] hover:border-white/[0.14] bg-white/[0.02] hover:bg-white/[0.04] text-white/50 hover:text-white/80 text-[13px] leading-relaxed transition-all duration-200 group"
                    >
                      <div className="flex items-start gap-2.5">
                        <svg className="shrink-0 mt-0.5 text-white/20 group-hover:text-[#4F8EF7]/60 transition-colors" width="13" height="13" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8L6.5 11.5L13 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {prompt}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="messages"
                className="px-8 py-8 space-y-6 max-w-[820px] mx-auto w-full"
              >
                <AnimatePresence initial={false}>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {/* AI avatar */}
                      {msg.role === "ai" && (
                        <div className="w-7 h-7 rounded-lg bg-[#4F8EF7]/10 border border-[#4F8EF7]/20 flex items-center justify-center shrink-0 mt-0.5">
                          <Image src="/logo.png" alt="Bloxr" width={16} height={16} className="object-contain" />
                        </div>
                      )}

                      {/* User bubble */}
                      {msg.role === "user" && (
                        <div className="max-w-[60%] bg-white text-black text-[14px] rounded-2xl rounded-tr-sm px-4 py-2.5 leading-relaxed font-medium whitespace-pre-wrap">
                          {msg.text}
                        </div>
                      )}

                      {/* AI message */}
                      {msg.role === "ai" && (
                        <div className="max-w-[640px] min-w-0">
                          {msg.streaming && !msg.text ? (
                            <TypingDots />
                          ) : (
                            renderMarkdown(msg.text)
                          )}
                        </div>
                      )}

                      {/* Status — pushed */}
                      {msg.role === "status" && msg.statusKind === "pushed" && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-[13px] font-medium"
                          style={{ background: "#111", border: "1px solid rgba(16,185,129,0.2)" }}
                        >
                          <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.4 }}>
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                              <path d="M3 8L6.5 11.5L13 5" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </motion.div>
                          <span className="text-[#10B981]">1 change pushed to Studio</span>
                        </motion.div>
                      )}

                      {/* Status — building */}
                      {msg.role === "status" && msg.statusKind === "building" && (
                        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-[13px] text-white/40" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <TypingDots />
                          <span>Building...</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input */}
        <div className="px-6 pb-5 pt-3 shrink-0">
          <div
            className="rounded-2xl border border-white/[0.08] focus-within:border-white/[0.14] transition-colors duration-200"
            style={{ background: "#111" }}
          >
            {/* Attachment chips */}
            <AnimatePresence>
              {attachments.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-2 px-4 pt-3"
                >
                  {attachments.map((name, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] text-[12px] text-white/50"
                    >
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                        <rect x="2" y="1" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="1.3" />
                        <path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      </svg>
                      <span className="max-w-[140px] truncate">{name}</span>
                      <button
                        onClick={() => removeAttachment(i)}
                        className="text-white/20 hover:text-white/60 transition-colors ml-0.5"
                      >
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                          <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        </svg>
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-end gap-2.5 px-3 pt-3 pb-3">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.txt,.lua,.rbxl,.rbxlx"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              {/* Plus / attach button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-white/[0.08] hover:border-white/[0.18] hover:bg-white/[0.05] text-white/30 hover:text-white/70 transition-all duration-200"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>

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
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isStreaming}
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                  input.trim() && !isStreaming
                    ? "bg-white hover:bg-white/90 active:scale-95"
                    : "bg-white/[0.06] cursor-not-allowed"
                }`}
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 12V4M8 4L4.5 7.5M8 4L11.5 7.5"
                    stroke={input.trim() && !isStreaming ? "#000" : "rgba(255,255,255,0.25)"}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── ChatRow component ────────────────────────────────────────────────────────

function ChatRow({
  chat,
  isActive,
  isRenaming,
  renameTitle,
  renameInputRef,
  onLoad,
  onStartRename,
  onRenameChange,
  onRenameCommit,
  onRenameCancel,
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
        className={`flex-1 min-w-0 flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all duration-150 ${
          isActive
            ? "bg-white/[0.06] text-white"
            : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
        }`}
      >
        <div className={`w-1 h-1 rounded-full shrink-0 ${isActive ? "bg-[#4F8EF7]" : "bg-white/10"}`} />
        {isRenaming ? (
          <input
            ref={renameInputRef}
            value={renameTitle}
            onChange={(e) => onRenameChange(e.target.value)}
            onBlur={onRenameCommit}
            onKeyDown={(e) => {
              if (e.key === "Enter") onRenameCommit();
              if (e.key === "Escape") onRenameCancel();
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 min-w-0 bg-transparent text-[13px] text-white outline-none border-b border-white/25"
          />
        ) : (
          <span className="flex-1 min-w-0 text-[13px] truncate">{chat.title}</span>
        )}
      </button>
      {/* Edit icon */}
      {!isRenaming && (
        <button
          onClick={onStartRename}
          className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-white/60 transition-all p-1.5 shrink-0"
        >
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
            <path d="M11 2l3 3-8 8H3v-3l8-8z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
