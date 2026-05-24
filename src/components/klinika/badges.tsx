import { cn } from "@/lib/utils";
import { flowLabel } from "@/lib/klinika";

export function UrgencyBadge({ urgency }: { urgency: string }) {
  const styles =
    urgency === "emergency"
      ? "bg-destructive/10 text-destructive"
      : urgency === "urgent"
        ? "bg-warning/10 text-warning"
        : "bg-primary/10 text-primary";
  const dot =
    urgency === "emergency"
      ? "bg-destructive"
      : urgency === "urgent"
        ? "bg-warning"
        : "bg-primary";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium capitalize",
        styles,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {urgency}
    </span>
  );
}

export function FlowBadge({ flow }: { flow: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground">
      {flowLabel(flow)}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "new"
      ? "bg-primary/10 text-primary"
      : status === "escalated"
        ? "bg-destructive/10 text-destructive"
        : "bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium capitalize",
        styles,
      )}
    >
      {status}
    </span>
  );
}

export function LanguageBadge({ language }: { language: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground">
      {language}
    </span>
  );
}
