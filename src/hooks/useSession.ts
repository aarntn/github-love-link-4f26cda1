import { useState, useEffect, useCallback } from "react";
import { getSession } from "../lib/api";
import type { Session } from "../lib/types";

export function useSession(phone: string, pollIntervalMs = 5_000) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!phone) return;
    try {
      const data = await getSession(phone);
      setSession(data);
      setError(null);
    } catch (err: any) {
      setError(err.message ?? "Failed to load session.");
    } finally {
      setLoading(false);
    }
  }, [phone]);

  useEffect(() => {
    fetch();
    const id = setInterval(fetch, pollIntervalMs);
    return () => clearInterval(id);
  }, [fetch, pollIntervalMs]);

  return { session, loading, error, refetch: fetch };
}
