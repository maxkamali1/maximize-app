"use client";

import { OPEN_CHAT_EVENT, useIsNative } from "./ChatWidget";

// The homepage's in-page "Chat with us" button, placed in the empty grid slot
// beside "I'm Just Exploring". Opens the same chat panel as the floating
// button on other pages. Hidden inside the iHome Max app.
export function ChatLauncher() {
  const isNative = useIsNative();
  if (isNative) return null;

  return (
    <div className="flex items-center justify-end">
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event(OPEN_CHAT_EVENT))}
        className="flex items-center gap-2 rounded-full bg-accent text-accent-ink px-5 py-3 shadow-xl font-semibold hover:bg-accent-strong transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 5h16v11H8l-4 4V5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
        Chat with us
      </button>
    </div>
  );
}
