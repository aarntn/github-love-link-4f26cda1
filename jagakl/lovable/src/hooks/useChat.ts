import { useState, useCallback } from "react";
import { sendMessage } from "../lib/api";
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

      const userMsg: ChatMessage = {
        role: "user",
        content: text.trim(),
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
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
    [phone]
  );

  const reset = useCallback(() => {
    setMessages([]);
    setFlag(null);
    setError(null);
  }, []);

  return { messages, loading, flag, error, send, reset };
}
