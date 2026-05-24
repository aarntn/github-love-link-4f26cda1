import { useRef, useEffect, useState, type KeyboardEvent } from "react";
import { useChat } from "../hooks/useChat";
import type { ChatMessage, FlagCategory } from "../lib/types";

// ── Emergency banner ─────────────────────────────────────────────────────────

function EmergencyBanner({ flag }: { flag: FlagCategory }) {
  if (!flag) return null;
  return (
    <div className="bg-red-600 text-white px-4 py-2 text-sm font-semibold flex items-center gap-2 rounded-t-2xl">
      <span>🚨</span>
      <span>Emergency detected — call 999 immediately.</span>
    </div>
  );
}

// ── Single bubble ─────────────────────────────────────────────────────────────

function Bubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`
          max-w-[80%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed
          ${isUser
            ? "bg-emerald-600 text-white rounded-br-none"
            : "bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm"
          }
        `}
      >
        {msg.content}
      </div>
    </div>
  );
}

// ── Typing indicator ──────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-2">
      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── ChatWidget ────────────────────────────────────────────────────────────────

interface ChatWidgetProps {
  phone?: string;
  title?: string;
}

export function ChatWidget({ phone, title = "JagaKL" }: ChatWidgetProps) {
  const { messages, loading, flag, error, send, reset } = useChat(phone);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    send(text);
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[700px] w-full max-w-md mx-auto rounded-2xl shadow-xl overflow-hidden border border-gray-200 bg-gray-50">
      {/* Header */}
      <div className="bg-emerald-700 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏥</span>
          <div>
            <p className="font-bold text-base leading-tight">{title}</p>
            <p className="text-xs text-emerald-200">Free health guide • KL</p>
          </div>
        </div>
        <button
          onClick={reset}
          className="text-xs text-emerald-200 hover:text-white underline transition-colors"
          title="Start over"
        >
          Reset
        </button>
      </div>

      {/* Emergency banner */}
      <EmergencyBanner flag={flag} />

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 && !loading && (
          <p className="text-center text-gray-400 text-sm mt-8">
            Starting conversation…
          </p>
        )}
        {messages.map((m, i) => (
          <Bubble key={i} msg={m} />
        ))}
        {loading && <TypingIndicator />}
        {error && (
          <p className="text-center text-red-500 text-xs my-2">{error}</p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-3 py-2 flex items-end gap-2">
        <textarea
          className="flex-1 resize-none text-sm rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 max-h-32"
          rows={1}
          placeholder="Type a message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
