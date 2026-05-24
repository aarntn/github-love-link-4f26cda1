import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchTriageCases, type TriageCase } from "@/lib/klinika";

export function useTriageCases() {
  const [cases, setCases] = useState<TriageCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    fetchTriageCases()
      .then((rows) => {
        if (!alive) return;
        setCases(rows);
        setLoading(false);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e.message ?? "Failed to load");
        setLoading(false);
      });

    const channel = supabase
      .channel("triage_cases_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "triage_cases" },
        (payload) => {
          setCases((prev) => {
            if (payload.eventType === "INSERT") {
              const next = payload.new as TriageCase;
              if (prev.some((c) => c.id === next.id)) return prev;
              return [next, ...prev];
            }
            if (payload.eventType === "UPDATE") {
              const next = payload.new as TriageCase;
              return prev.map((c) => (c.id === next.id ? next : c));
            }
            if (payload.eventType === "DELETE") {
              const old = payload.old as Partial<TriageCase>;
              return prev.filter((c) => c.id !== old.id);
            }
            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { cases, loading, error, setCases };
}
