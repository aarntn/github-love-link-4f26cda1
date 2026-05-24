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

export const STATUS_META: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  new: { label: "Belum Review", bg: "#BA7517", text: "#ffffff" },
  reviewed: { label: "Reviewed", bg: "#0D9E75", text: "#ffffff" },
  escalated: { label: "Direroute", bg: "#D85A30", text: "#ffffff" },
};

export function StatusBadge({
  status,
  size = "md",
}: {
  status: string;
  size?: "sm" | "md";
}) {
  const meta = STATUS_META[status] ?? {
    label: status,
    bg: "#6b7280",
    text: "#ffffff",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
      )}
      style={{ backgroundColor: meta.bg, color: meta.text }}
    >
      {meta.label}
    </span>
  );
}

export function UrgencyDot({ urgency }: { urgency: string }) {
  const dot =
    urgency === "emergency"
      ? "bg-destructive"
      : urgency === "urgent"
        ? "bg-warning"
        : "bg-primary";
  const text =
    urgency === "emergency"
      ? "text-destructive"
      : urgency === "urgent"
        ? "text-warning"
        : "text-muted-foreground";
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs capitalize", text)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {urgency}
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
