import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { TriageCase, Status } from "@/lib/klinika";
import { urgencyRank } from "@/lib/klinika";
import { CaseCard } from "./CaseCard";
import { CaseDetailSheet } from "./CaseDetailSheet";
import { Button } from "@/components/ui/button";
import { Check, ArrowUpRight, Loader2 } from "lucide-react";

interface Props {
  cases: TriageCase[];
  updateStatus: (id: string, status: Status) => Promise<void>;
}

export function ClinicianTab({ cases, updateStatus }: Props) {
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<TriageCase | null>(null);

  const queue = useMemo(() => {
    return cases
      .filter((c) => c.status === "new" || c.status === "escalated")
      .sort((a, b) => {
        if (a.red_flag !== b.red_flag) return a.red_flag ? -1 : 1;
        const r = urgencyRank(b.urgency) - urgencyRank(a.urgency);
        if (r !== 0) return r;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [cases]);

  const handle = async (id: string, status: Status) => {
    setPending((p) => ({ ...p, [id]: true }));
    try {
      await updateStatus(id, status);
    } finally {
      setPending((p) => {
        const { [id]: _, ...rest } = p;
        return rest;
      });
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clinician View</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Action queue — review or escalate cases.
          </p>
        </div>
        <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
          {queue.length} needing attention
        </span>
      </header>

      {queue.length === 0 ? (
        <div className="border border-dashed rounded-xl py-16 text-center text-muted-foreground">
          🎉 Queue clear. All cases reviewed.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {queue.map((c) => {
              const isPending = pending[c.id];
              return (
                <motion.div
                  key={c.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <CaseCard
                    case={c}
                    onClick={() => setSelected(c)}
                    actions={
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={(e) => {
                            e.stopPropagation();
                            handle(c.id, "reviewed");
                          }}
                        >
                          {isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          Reviewed
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-warning hover:text-warning hover:bg-warning/10"
                          disabled={isPending}
                          onClick={(e) => {
                            e.stopPropagation();
                            handle(c.id, "escalated");
                          }}
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" />
                          Escalate
                        </Button>
                      </>
                    }
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <CaseDetailSheet
        case={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
      />
    </div>
  );
}
