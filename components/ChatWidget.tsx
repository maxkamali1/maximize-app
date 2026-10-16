"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type Msg = { role: "user" | "assistant"; content: string };

// Fired by <ChatLauncher /> (the in-page "Chat with us" button on the
// homepage) to open the chat panel.
export const OPEN_CHAT_EVENT = "maximize:open-chat";

// True inside the iHome Max native app (which loads this same site). Starts
// as true so nothing chat-related ever flashes in the app before the check.
export function useIsNative(): boolean {
  const [isNative, setIsNative] = useState(true);
  useEffect(() => {
    let cancelled = false;
    import("@capacitor/core")
      .then(({ Capacitor }) => {
        if (!cancelled) setIsNative(Capacitor.isNativePlatform());
      })
      .catch(() => !cancelled && setIsNative(false));
    return () => {
      cancelled = true;
    };
  }, []);
  return isNative;
}

const GREETING: Msg = {
  role: "assistant",
  content:
    "Hi! I'm Max's assistant at the MAXimize Team. Are you thinking about buying, selling, or investing?",
};

// Floating chat bubble for the website. Hidden inside the iHome Max native
// app (which loads this same site) and on the internal /admin pages.
export function ChatWidget() {
  const pathname = usePathname();
  const isNative = useIsNative();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const openChat = () => setOpen(true);
    window.addEventListener(OPEN_CHAT_EVENT, openChat);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, openChat);
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending, open]);

  if (isNative || pathname?.startsWith("/admin")) return null;

  // On the homepage the "Chat with us" button sits in the page itself (next
  // to "I'm Just Exploring"), so the floating one is only shown elsewhere.
  const showFloatingButton = pathname !== "/";

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim().slice(0, 1500);
    if (!text || sending) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      // The greeting is UI-only; the model sees the conversation from the visitor's first message.
      const history = next.slice(1).slice(-30);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, leadSaved }),
      });
      const data = await res.json();
      if (data.leadSaved) setLeadSaved(true);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply || "Sorry, something went wrong. Please call Max at 416-723-0353." },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Sorry, I couldn't connect. Please call Max at 416-723-0353." },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="fixed z-50 right-4 flex flex-col items-end gap-3"
      style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      {open && (
        <div
          role="dialog"
          aria-label="Chat with Max's assistant"
          className="w-[calc(100vw-2rem)] max-w-sm h-[min(70vh,32rem)] flex flex-col rounded-2xl border border-line bg-paper shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 bg-accent text-accent-ink">
            <div className="leading-tight">
              <p className="font-display font-semibold">MAXimize Assistant</p>
              <p className="text-xs opacity-80">Usually replies instantly</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="text-2xl leading-none px-2 opacity-80 hover:opacity-100"
            >
              &times;
            </button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2 bg-surface">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "self-end bg-accent text-accent-ink rounded-br-sm"
                    : "self-start bg-paper text-ink border border-line rounded-bl-sm"
                }`}
              >
                {m.content}
              </div>
            ))}
            {sending && (
              <div className="self-start bg-paper border border-line rounded-2xl px-3 py-2 text-sm text-ink-faint">
                Typing…
              </div>
            )}
          </div>

          <form onSubmit={send} className="flex gap-2 p-3 border-t border-line bg-paper">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message…"
              maxLength={1500}
              aria-label="Your message"
              className="flex-1 min-w-0 rounded-full border border-line-strong bg-paper px-4 py-2 text-[16px] text-ink focus:outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="rounded-full bg-accent text-accent-ink px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Send
            </button>
          </form>
          <p className="px-3 pb-2 text-[10px] text-ink-faint bg-paper">
            AI assistant — general info only, not professional advice.
          </p>
        </div>
      )}

      {showFloatingButton && (
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Chat with us"}
        className="flex items-center gap-2 rounded-full bg-accent text-accent-ink px-5 py-3 shadow-xl font-semibold hover:bg-accent-strong transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 5h16v11H8l-4 4V5z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
        {open ? "Close" : "Chat with us"}
      </button>
      )}
    </div>
  );
}
