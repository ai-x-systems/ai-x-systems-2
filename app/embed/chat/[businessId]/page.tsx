"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

/**
 * app/embed/chat/[businessId]/page.tsx
 * ---------------------------------------------------------------------
 * Loaded inside widget.js's iframe. Deliberately header-less — the outer
 * widget panel (public/widget.js) already renders the branded gradient
 * header with the business name and the close button, so a second header
 * in here would duplicate it. Opening this URL directly (e.g. for QA)
 * will look header-less; that's an accepted trade-off for not showing
 * two stacked headers in the real embedded experience.
 *
 * Mobile-safe height: uses 100dvh (dynamic viewport height) with a 100vh
 * fallback via CSS cascade (the second declaration wins in browsers that
 * support dvh, is silently ignored in ones that don't). Plain 100vh
 * inside an iframe on mobile Safari/Chrome is taller than the visible
 * area once the address bar is showing, which pushes the input box below
 * the fold — this fixes that.
 * ---------------------------------------------------------------------
 */

interface Message {
  role: "user" | "assistant";
  content: string;
}

const GRADIENT = "linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)";

export default function EmbeddedChatPage() {
  const { businessId } = useParams<{ businessId: string }>();

  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const nextMessages: Message[] = [...messages, { role: "user", content: input }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`/api/chat/${businessId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();
      const replyContent = data.success ? data.reply : data.error.message;
      setMessages([...nextMessages, { role: "assistant", content: replyContent }]);
    } catch {
      setMessages([
        ...nextMessages,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        fontFamily:
          "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        background: "#ffffff",
        overflow: "hidden",
      }}
      className="aixw-embed-root"
    >
      <style>{`
        .aixw-embed-root { height: 100vh; height: 100dvh; }
        .aixw-scroll::-webkit-scrollbar { width: 6px; }
        .aixw-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
        @keyframes aixw-bounce { 0%, 60%, 100% { transform: translateY(0); opacity: .4; } 30% { transform: translateY(-4px); opacity: 1; } }
        .aixw-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #6b7280; margin: 0 2px; animation: aixw-bounce 1.2s infinite; }
        .aixw-dot:nth-child(2) { animation-delay: .15s; }
        .aixw-dot:nth-child(3) { animation-delay: .3s; }
        textarea.aixw-input::placeholder { color: #9ca3af; }
      `}</style>

      <div ref={scrollRef} className="aixw-scroll" style={{ flex: 1, overflowY: "auto", padding: "16px 14px" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", marginBottom: 12, justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            {m.role === "assistant" && (
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: GRADIENT, flexShrink: 0, marginRight: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>
                AI
              </div>
            )}
            <div
              style={{
                display: "inline-block",
                padding: "10px 14px",
                borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                background: m.role === "user" ? GRADIENT : "#f3f4f6",
                color: m.role === "user" ? "#fff" : "#111827",
                maxWidth: "78%",
                fontSize: 14,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: GRADIENT, flexShrink: 0, marginRight: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>
              AI
            </div>
            <div style={{ padding: "10px 14px", borderRadius: "14px 14px 14px 4px", background: "#f3f4f6" }}>
              <span className="aixw-dot" />
              <span className="aixw-dot" />
              <span className="aixw-dot" />
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
          borderTop: "1px solid #e5e7eb",
          padding: "10px 12px",
          paddingBottom: "calc(10px + env(safe-area-inset-bottom))",
          background: "#ffffff",
        }}
      >
        <textarea
          ref={inputRef}
          className="aixw-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Type a message…"
          rows={1}
          style={{
            flex: 1,
            resize: "none",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            padding: "9px 12px",
            fontSize: 14,
            fontFamily: "inherit",
            maxHeight: 96,
            outline: "none",
            color: "#111827",
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            flexShrink: 0,
            background: loading || !input.trim() ? "#d1d5db" : undefined,
            backgroundImage: loading || !input.trim() ? "none" : GRADIENT,
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "9px 16px",
            fontSize: 14,
            fontWeight: 600,
            cursor: loading || !input.trim() ? "default" : "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
