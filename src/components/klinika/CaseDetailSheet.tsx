import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { TriageCase, Status } from "@/lib/klinika";
import { timeAgo, rerouteReasonLabel } from "@/lib/klinika";
import { UrgencyBadge, FlowBadge, LanguageBadge } from "./badges";
import { AlertTriangle, Shield, Copy, Check, ArrowUpRight, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { RerouteModal } from "./RerouteModal";

interface Props {
  case: TriageCase | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  updateStatus?: (id: string, status: Status) => Promise<void>;
  rerouteCase?: (
    id: string,
    payload: { clinic: string; reason: string; note?: string | null },
  ) => Promise<void>;
}

function Field({ label, value, labelClassName }: { label: string; value: React.ReactNode; labelClassName?: string }) {
  return (
    <div>
      <p className={cn("text-xs font-medium uppercase tracking-wide mb-1 text-muted-foreground", labelClassName)}>
        {label}
      </p>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles =
    status === "reviewed"
      ? "bg-primary/10 text-primary border-primary/20"
      : status === "escalated"
        ? "bg-destructive/10 text-destructive border-destructive/20"
        : "bg-muted text-muted-foreground border-border";
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize border",
        styles,
      )}
    >
      {status}
    </span>
  );
}

export function CaseDetailSheet({ case: c, open, onOpenChange, updateStatus, rerouteCase }: Props) {
  const [pending, setPending] = useState<Status | null>(null);
  const [copied, setCopied] = useState(false);
  const [rerouteOpen, setRerouteOpen] = useState(false);

  if (!c) return null;

  const isEmergency = c.red_flag || c.urgency === "emergency";
  const isUrgent = c.urgency === "urgent";
  const canReroute = (isEmergency || isUrgent) && !!rerouteCase;
  const isAnonymous = c.mode === "anonymous";
  const isClosed = c.status === "reviewed" || c.status === "escalated";
  const wasRerouted = !!c.original_clinic && c.original_clinic !== c.recommended_clinic;

  const handle = async (status: Status) => {
    if (!updateStatus) return;
    setPending(status);
    try {
      await updateStatus(c.id, status);
    } finally {
      setPending(null);
    }
  };

  const copyId = async () => {
    await navigator.clipboard.writeText(c.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const exactTime = format(new Date(c.created_at), "d MMM yyyy, h:mm a");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className={cn(
          "overflow-y-auto sm:max-w-lg w-full p-0",
          isEmergency && "border-l-4",
        )}
        style={
          isEmergency
            ? { backgroundColor: "#FFF5F5", borderLeftColor: "#D85A30" }
            : undefined
        }
      >
        <div className="p-6 space-y-5">
          <SheetHeader className="space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <SheetTitle className="text-lg font-semibold">Case Details</SheetTitle>
              <StatusPill status={c.status} />
            </div>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <div>{timeAgo(c.created_at)}</div>
              <div className="tabular-nums">{exactTime}</div>
            </div>
          </SheetHeader>

          {c.red_flag && (
            <div className="bg-destructive/15 text-destructive border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
              <div className="text-sm font-bold leading-snug">
                Red flag case — immediate clinical attention required.
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <UrgencyBadge urgency={c.urgency} />
            <FlowBadge flow={c.flow} />
            <LanguageBadge language={c.language} />
          </div>

          {/* Triage Summary — hero */}
          <div
            className="rounded-lg border-l-4 bg-card border border-border/50 p-5"
            style={{ borderLeftColor: "#0D9E75" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: "#0D9E75" }}
            >
              Triage Summary
            </p>
            <p
              className="text-base leading-relaxed font-medium"
              style={{ color: "#1a1a1a" }}
            >
              {c.triage_summary}
            </p>
          </div>

          <Field
            label="Chief complaint"
            value={<p className="font-medium">{c.chief_complaint}</p>}
          />

          {/* Recommended clinic — with before/after if rerouted */}
          {wasRerouted ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide mb-2 text-muted-foreground">
                Clinic recommendation
              </p>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground line-through inline-flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI recommended: {c.original_clinic}
                </div>
                <div className="text-sm font-semibold" style={{ color: "#0D9E75" }}>
                  Clinician recommended: {c.recommended_clinic}
                </div>
                {c.reroute_reason && (
                  <div className="text-xs italic text-muted-foreground">
                    Reason: {rerouteReasonLabel(c.reroute_reason) ?? c.reroute_reason}
                  </div>
                )}
                {c.reroute_note && (
                  <div className="text-xs text-foreground/80 bg-muted/50 rounded p-2">
                    “{c.reroute_note}”
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Field
              label="Recommended clinic"
              value={
                <div className="space-y-1">
                  <div className="font-medium">{c.recommended_clinic}</div>
                  <div className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Sparkles className="h-3 w-3" />
                    AI Recommended
                  </div>
                </div>
              }
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Mode"
              value={
                <span className="inline-flex items-center gap-1.5 capitalize">
                  {isAnonymous && <Shield className="h-3.5 w-3.5 text-muted-foreground" />}
                  {c.mode}
                </span>
              }
            />
            <Field label="Postcode" value={c.postcode ?? "—"} />
            <Field
              label="Dengue hotspot"
              value={
                c.is_dengue_hotspot ? (
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: "rgba(186, 117, 23, 0.12)", color: "#BA7517" }}
                  >
                    Hotspot
                  </span>
                ) : (
                  <span className="text-muted-foreground/70 text-sm">Not in hotspot</span>
                )
              }
            />
            <Field
              label="Case ID"
              value={
                <button
                  onClick={copyId}
                  className="inline-flex items-center gap-1.5 font-mono text-xs hover:text-foreground text-muted-foreground transition-colors"
                  title="Copy full ID"
                >
                  <span>{c.id.slice(0, 8)}…</span>
                  {copied ? (
                    <Check className="h-3 w-3 text-primary" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              }
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t">
            {isClosed ? (
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">Case closed</span>
                <StatusPill status={c.status} />
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  disabled={!!pending || !updateStatus}
                  onClick={() => handle("reviewed")}
                >
                  {pending === "reviewed" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Mark Reviewed
                </Button>
                {canReroute && (
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1",
                      isEmergency
                        ? "border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        : "border-warning/40 text-warning hover:bg-warning/10 hover:text-warning",
                    )}
                    disabled={!!pending}
                    onClick={() => setRerouteOpen(true)}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    Reroute
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </SheetContent>

      {rerouteCase && (
        <RerouteModal
          case={c}
          open={rerouteOpen}
          onOpenChange={setRerouteOpen}
          onConfirm={(p) => rerouteCase(c.id, p)}
        />
      )}
    </Sheet>
  );
}
