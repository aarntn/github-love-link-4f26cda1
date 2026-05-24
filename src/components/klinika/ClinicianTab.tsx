import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, MapPin } from "lucide-react";
import { useTriageCases } from "@/hooks/useTriageCases";
import {
  updateCaseStatus,
  URGENCY_RANK,
  type TriageCase,
} from "@/lib/klinika";
import { FlowTag, UrgencyBadge } from "./badges";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";

export function ClinicianTab() {
  const { cases, loading, error, setCases } = useTriageCases();
  const [pending, setPending] = useState<Set<string>>(new Set());

  const queue = useMemo(() => {
    return cases
      .filter((c) => c.status === "new" || c.status === "escalated")
      .sort((a, b) => {
        const u = URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency];
        if (u !== 0) return u;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [cases]);

  const action = async (c: TriageCase, next: "reviewed" | "escalated") => {
    setPending((p) => new Set(p).add(c.id));
    // Optimistic local update so the card animates out immediately
    setCases((prev) =>
      prev.map((x) => (x.id === c.id ? { ...x, status: next } : x)),
    );
    try {
      await updateCaseStatus(c.id, next);
      toast.success(
        next === "reviewed" ? "Case marked reviewed" : "Case escalated",
      );
    } catch (e: any) {
      // Roll back
      setCases((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, status: c.status } : x)),
      );
      toast.error(e?.message ?? "Failed to update case");
    } finally {
      setPending((p) => {
        const n = new Set(p);
        n.delete(c.id);
        return n;
      });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Awaiting clinician review
          </h2>
          <p className="text-sm text-muted-foreground">
            Emergencies first, then urgent, then routine.
          </p>
        </div>
        <div className="rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
          {queue.length} case{queue.length === 1 ? "" : "s"} awaiting review
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
      )}
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </p>
      )}
      {!loading && queue.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
          <p className="mt-3 text-sm font-medium">Queue clear.</p>
          <p className="text-xs text-muted-foreground">
            No cases are waiting for review right now.
          </p>
        </div>
      )}

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {queue.map((c) => (
            <motion.div
              key={c.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.22 }}
              className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm"
              style={c.red_flag ? { borderLeftColor: "var(--destructive)", borderLeftWidth: 4 } : undefined}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <UrgencyBadge urgency={c.urgency} />
                    <FlowTag flow={c.flow} />
                    <span className="text-xs text-muted-foreground">
                      {c.language}
                    </span>
                    {c.red_flag && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-destructive">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Red flag
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {c.chief_complaint}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {c.triage_summary}
                  </p>
                  <div className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {c.recommended_clinic}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={() => action(c, "reviewed")}
                    disabled={pending.has(c.id)}
                  >
                    Mark reviewed
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => action(c, "escalated")}
                    disabled={pending.has(c.id) || c.status === "escalated"}
                    className="border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
                  >
                    Escalate
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
