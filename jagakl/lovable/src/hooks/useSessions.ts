import { useState, useEffect, useCallback } from "react";
import { listSessions, deleteSession, resetAllSessions } from "../lib/api";
import type { Session } from "../lib/types";

export function useSessions(pollIntervalMs = 10_000) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      const data = await listSessions();
      setSessions(data);
      setError(null);
    } catch (err: any) {
      setError(err.message ?? "Failed to load sessions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    const id = setInterval(fetch, pollIntervalMs);
    return () => clearInterval(id);
  }, [fetch, pollIntervalMs]);

  const remove = useCallback(
    async (phone: string) => {
      await deleteSession(phone);
      setSessions((prev) => prev.filter((s) => s.phone !== phone));
    },
    []
  );

  const clearAll = useCallback(async () => {
    await resetAllSessions();
    setSessions([]);
  }, []);

  return { sessions, loading, error, refetch: fetch, remove, clearAll };
}
