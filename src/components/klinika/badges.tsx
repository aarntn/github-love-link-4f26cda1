import { cn } from "@/lib/utils";
import type { Flow, Urgency } from "@/lib/klinika";
import { FLOW_LABEL } from "@/lib/klinika";

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  const styles: Record<Urgency, string> = {
    emergency: "bg-destructive text-destructive-foreground",
    urgent: "bg-warning text-warning-foreground",
    routine: "bg-secondary text-secondary-foreground",
  };
  const label = urgency.charAt(0).toUpperCase() + urgency.slice(1);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        styles[urgency],
      )}
    >
      {label}
    </span>
  );
}

export function FlowTag({ flow }: { flow: Flow }) {
  const styles: Record<Flow, string> = {
    dengue: "bg-[oklch(0.95_0.05_36)] text-[oklch(0.45_0.15_36)] border-[oklch(0.85_0.08_36)]",
    tb: "bg-[oklch(0.95_0.04_70)] text-[oklch(0.45_0.13_70)] border-[oklch(0.85_0.07_70)]",
    ncd: "bg-[oklch(0.95_0.03_230)] text-[oklch(0.4_0.1_230)] border-[oklch(0.85_0.06_230)]",
    general: "bg-accent text-accent-foreground border-border",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium",
        styles[flow],
      )}
    >
      {FLOW_LABEL[flow]}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    new: "bg-primary/10 text-primary border-primary/20",
    reviewed: "bg-muted text-muted-foreground border-border",
    escalated: "bg-destructive/10 text-destructive border-destructive/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        styles[status] ?? styles.new,
      )}
    >
      {status}
    </span>
  );
}
