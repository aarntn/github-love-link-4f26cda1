import { useMemo, useState } from "react";
import { useTriageCases } from "@/hooks/useTriageCases";
import {
  type Flow,
  type TriageCase,
  type Urgency,
  URGENCY_RANK,
} from "@/lib/klinika";
import { CaseCard } from "./CaseCard";
import { CaseDetailSheet } from "./CaseDetailSheet";
import { cn } from "@/lib/utils";

type UrgencyFilter = "all" | Urgency;
type FlowFilter = "all" | Flow;

export function LiveCasesTab() {
  const { cases, loading, error } = useTriageCases();
  const [urgency, setUrgency] = useState<UrgencyFilter>("all");
  const [flow, setFlow] = useState<FlowFilter>("all");
  const [selected, setSelected] = useState<TriageCase | null>(null);

  const filtered = useMemo(() => {
    const f = cases.filter(
      (c) =>
        (urgency === "all" || c.urgency === urgency) &&
        (flow === "all" || c.flow === flow),
    );
    return [...f].sort((a, b) => {
      if (a.red_flag !== b.red_flag) return a.red_flag ? -1 : 1;
      const u = URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency];
      if (u !== 0) return u;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [cases, urgency, flow]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-3">
        <FilterGroup label="Urgency">
          {(["all", "emergency", "urgent", "routine"] as UrgencyFilter[]).map((v) => (
            <Pill key={v} active={urgency === v} onClick={() => setUrgency(v)}>
              {v[0].toUpperCase() + v.slice(1)}
            </Pill>
          ))}
        </FilterGroup>
        <div className="hidden h-6 w-px bg-border sm:block" />
        <FilterGroup label="Flow">
          {(["all", "dengue", "tb", "ncd", "general"] as FlowFilter[]).map((v) => (
            <Pill key={v} active={flow === v} onClick={() => setFlow(v)}>
              {v === "tb" || v === "ncd" ? v.toUpperCase() : v[0].toUpperCase() + v.slice(1)}
            </Pill>
          ))}
        </FilterGroup>
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} case{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {loading && <SkeletonGrid />}
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </p>
      )}
      {!loading && !error && filtered.length === 0 && (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No cases match the current filters.
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <CaseCard key={c.id} c={c} onClick={() => setSelected(c)} />
        ))}
      </div>

      <CaseDetailSheet
        c={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
      />
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-36 animate-pulse rounded-xl border border-border bg-muted/40" />
      ))}
    </div>
  );
}
