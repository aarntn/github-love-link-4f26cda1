import { useState, useCallback, useEffect } from "react";
import { sendMessage, deleteSession, resetMockSession } from "../lib/api";
import type { ChatMessage, FlagCategory } from "../lib/types";

const BOT_PHONE = "web-demo"; // fixed phone key for the web chat session

export function useChat(phone: string = BOT_PHONE) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [flag, setFlag] = useState<FlagCategory>(null);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      // Don't show the silent "hello" onboarding trigger in the message list
      const isHidden = text === "hello" && messages.length === 0;

      if (!isHidden) {
        const userMsg: ChatMessage = {
          role: "user",
          content: text.trim(),
          ts: Date.now(),
        };
        setMessages((prev) => [...prev, userMsg]);
      }

      setLoading(true);
      setError(null);

      try {
        const res = await sendMessage({ phone, message: text.trim() });
        setFlag(res.flag);
        const botMsg: ChatMessage = {
          role: "assistant",
          content: res.reply,
          ts: Date.now(),
        };
        setMessages((prev) => [...prev, botMsg]);
      } catch (err: any) {
        setError(err.message ?? "Network error — please try again.");
      } finally {
        setLoading(false);
      }
    },
    [phone, messages.length]
  );

  const reset = useCallback(async () => {
    setMessages([]);
    setFlag(null);
    setError(null);
    resetMockSession();
    // Also reset the backend session if connected
    try {
      await deleteSession(phone);
    } catch {
      // ignore — mock mode or network error
    }
  }, [phone]);

  // Kick off onboarding silently on mount
  useEffect(() => {
    send("hello");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { messages, loading, flag, error, send, reset };
}
