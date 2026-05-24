import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import type { TriageCase, Status } from "@/lib/klinika";
import { urgencyRank, timeAgo, flowLabel } from "@/lib/klinika";
import { CaseDetailSheet } from "./CaseDetailSheet";
import { UrgencyBadge, FlowBadge, LanguageBadge } from "./badges";
import { Button } from "@/components/ui/button";
import {
  Check,
  ArrowUpRight,
  Loader2,
  AlertTriangle,
  MapPin,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  cases: TriageCase[];
  updateStatus: (id: string, status: Status) => Promise<void>;
  rerouteCase?: (
    id: string,
    payload: { clinic: string; reason: string; note?: string | null },
  ) => Promise<void>;
}

interface RowProps {
  case: TriageCase;
  onOpen: () => void;
  onAction: (status: Status) => void;
  onReroute?: () => void;
  pending: Status | null;
}

function CaseRow({ case: c, onOpen, onAction, onReroute, pending }: RowProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = (c.triage_summary?.length ?? 0) > 220;

  return (
    <div
      className={cn(
        "bg-card border rounded-xl overflow-hidden transition-all hover:shadow-md",
        c.red_flag ? "border-destructive/40" : "hover:border-primary/30",
      )}
    >
      {c.red_flag && (
        <div className="bg-destructive/10 text-destructive px-5 py-2 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Red flag — immediate attention
        </div>
      )}
      <div className="p-5 space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <UrgencyBadge urgency={c.urgency} />
            <FlowBadge flow={c.flow} />
            <LanguageBadge language={c.language} />
            {c.is_dengue_hotspot && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-warning/10 text-warning">
                Hotspot
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {timeAgo(c.created_at)}
          </span>
        </div>

        {/* Chief complaint */}
        <button onClick={onOpen} className="text-left w-full">
          <p className="font-semibold text-foreground leading-snug hover:text-primary transition-colors">
            {c.chief_complaint}
          </p>
        </button>

        {/* Triage summary block — primary decision input */}
        <div
          className="rounded-lg border-l-[3px] p-4"
          style={{ backgroundColor: "#F7F9F8", borderLeftColor: "#0D9E75" }}
        >
          <p
            className={cn(
              "text-[14px] leading-relaxed text-foreground/90",
              !expanded && isLong && "line-clamp-3",
            )}
          >
            {c.triage_summary}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              {expanded ? "Show less" : "Show more"}
              <ChevronDown
                className={cn(
                  "h-3 w-3 transition-transform",
                  expanded && "rotate-180",
                )}
              />
            </button>
          )}
        </div>

        {/* Footer: clinic + actions */}
        <div className="flex items-end justify-between gap-3 flex-wrap pt-1">
          <div className="flex flex-col gap-0.5 text-xs text-muted-foreground min-w-0">
            <div className="flex items-start gap-1.5">
              <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span className="truncate">{c.recommended_clinic}</span>
            </div>
            <span
              className={cn(
                "text-[10px] uppercase tracking-wide font-medium ml-5",
                c.original_clinic && c.original_clinic !== c.recommended_clinic
                  ? "text-primary"
                  : "text-muted-foreground/70",
              )}
            >
              {c.original_clinic && c.original_clinic !== c.recommended_clinic
                ? "Clinician recommended"
                : "AI Recommended"}
            </span>
          </div>
          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              disabled={!!pending}
              onClick={(e) => {
                e.stopPropagation();
                onAction("reviewed");
              }}
            >
              {pending === "reviewed" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Mark Reviewed
            </Button>
            {showReroute && (
              <Button
                size="sm"
                variant="outline"
                disabled={!!pending}
                className={cn(
                  isEmergencyRow
                    ? "border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    : "border-warning/40 text-warning hover:bg-warning/10 hover:text-warning",
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onReroute?.();
                }}
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                Reroute
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionList({
  title,
  accent,
  items,
  pending,
  onOpen,
  onAction,
}: {
  title: React.ReactNode;
  accent: "destructive" | "muted";
  items: TriageCase[];
  pending: Record<string, Status | null>;
  onOpen: (c: TriageCase) => void;
  onAction: (c: TriageCase, status: Status) => void;
}) {
  return (
    <section className="space-y-3">
      <h2
        className={cn(
          "text-sm font-semibold uppercase tracking-wide flex items-center gap-2",
          accent === "destructive" ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {title}
        <span className="text-xs font-normal opacity-70">({items.length})</span>
      </h2>
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {items.map((c) => (
            <motion.div
              key={c.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 60, scale: 0.96 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <CaseRow
                case={c}
                onOpen={() => onOpen(c)}
                onAction={(s) => onAction(c, s)}
                pending={pending[c.id] ?? null}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

export function ClinicianTab({ cases, updateStatus }: Props) {
  const [pending, setPending] = useState<Record<string, Status | null>>({});
  const [selected, setSelected] = useState<TriageCase | null>(null);

  const { emergencies, pendingList } = useMemo(() => {
    const open = cases
      .filter((c) => c.status === "new" || c.status === "escalated")
      .sort((a, b) => {
        const r = urgencyRank(b.urgency) - urgencyRank(a.urgency);
        if (r !== 0) return r;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    return {
      emergencies: open.filter((c) => c.red_flag || c.urgency === "emergency"),
      pendingList: open.filter((c) => !(c.red_flag || c.urgency === "emergency")),
    };
  }, [cases]);

  const handleAction = async (c: TriageCase, status: Status) => {
    setPending((p) => ({ ...p, [c.id]: status }));
    try {
      await updateStatus(c.id, status);
      toast.success(
        status === "reviewed" ? "Case marked as reviewed" : "Case escalated",
        {
          description: c.chief_complaint.length > 60
            ? c.chief_complaint.slice(0, 60) + "…"
            : c.chief_complaint,
        },
      );
    } catch (e) {
      toast.error("Failed to update case", {
        description: e instanceof Error ? e.message : "Please try again",
      });
    } finally {
      setPending((p) => {
        const { [c.id]: _, ...rest } = p;
        return rest;
      });
    }
  };

  const totalOpen = emergencies.length + pendingList.length;

  return (
    <div className="space-y-8 max-w-3xl">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clinician View</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Action queue — review or escalate cases.
          </p>
        </div>
        {totalOpen > 0 && (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
            {totalOpen} needing attention
          </span>
        )}
      </header>

      {totalOpen === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <p className="text-base font-medium text-foreground">
            All cases reviewed. Good work.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {emergencies.length > 0 && (
            <SectionList
              title={<span>🚨 Requires Immediate Attention</span>}
              accent="destructive"
              items={emergencies}
              pending={pending}
              onOpen={setSelected}
              onAction={handleAction}
            />
          )}
          {pendingList.length > 0 && (
            <SectionList
              title="Pending Review"
              accent="muted"
              items={pendingList}
              pending={pending}
              onOpen={setSelected}
              onAction={handleAction}
            />
          )}
        </div>
      )}

      <CaseDetailSheet
        case={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        updateStatus={updateStatus}
      />
    </div>
  );
}
