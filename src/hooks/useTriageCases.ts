import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { TriageCase, Status } from "@/lib/klinika";

export function useTriageCases() {
  const [cases, setCases] = useState<TriageCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("triage_cases")
        .select("*")
        .order("created_at", { ascending: false });
      if (!mounted) return;
      if (error) setError(error.message);
      else setCases((data ?? []) as TriageCase[]);
      setIsLoading(false);
    })();

    const channel = supabase
      .channel("triage_cases_rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "triage_cases" },
        (payload) => {
          setCases((prev) => {
            if (payload.eventType === "INSERT") {
              return [payload.new as TriageCase, ...prev];
            }
            if (payload.eventType === "UPDATE") {
              return prev.map((c) =>
                c.id === (payload.new as TriageCase).id
                  ? (payload.new as TriageCase)
                  : c,
              );
            }
            if (payload.eventType === "DELETE") {
              return prev.filter((c) => c.id !== (payload.old as TriageCase).id);
            }
            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const updateStatus = useCallback(async (id: string, status: Status) => {
    const prev = cases;
    setCases((cs) => cs.map((c) => (c.id === id ? { ...c, status } : c)));
    const { error } = await supabase
      .from("triage_cases")
      .update({ status })
      .eq("id", id);
    if (error) {
      setCases(prev);
      throw error;
    }
  }, [cases]);

  const rerouteCase = useCallback(
    async (
      id: string,
      payload: {
        clinic: string;
        reason: string;
        note?: string | null;
      },
    ) => {
      const prev = cases;
      const target = cases.find((c) => c.id === id);
      if (!target) return;
      const original = target.original_clinic ?? target.recommended_clinic;
      const optimistic = {
        recommended_clinic: payload.clinic,
        original_clinic: original,
        reroute_reason: payload.reason,
        reroute_note: payload.note ?? null,
        status: "escalated",
      };
      setCases((cs) => cs.map((c) => (c.id === id ? { ...c, ...optimistic } : c)));
      const { error } = await supabase
        .from("triage_cases")
        .update(optimistic)
        .eq("id", id);
      if (error) {
        setCases(prev);
        throw error;
      }
    },
    [cases],
  );

  return { cases, isLoading, error, updateStatus, rerouteCase };
}
