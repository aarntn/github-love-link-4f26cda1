import { timeAgo, flowLabel, type TriageCase } from "@/lib/klinika";
import { CardShell } from "./CardShell";
import { cn } from "@/lib/utils";

interface Props {
  case: TriageCase;
  onClick?: () => void;
  actions?: React.ReactNode;
}

const LANG_LABEL: Record<string, string> = {
  en: "EN",
  ms: "MS",
  ta: "TA",
  zh: "ZH",
  bn: "BN",
};

function Metric({
  label,
  value,
  tone,
  className,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "destructive" | "warning" | "default";
  className?: string;
}) {
  const toneCls =
    tone === "destructive"
      ? "text-destructive"
      : tone === "warning"
        ? "text-warning"
        : "text-foreground";
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className={cn("mt-1 text-sm font-medium truncate", toneCls)}>{value}</p>
    </div>
  );
}

export function CaseCard({ case: c, onClick, actions }: Props) {
  const dot =
    c.red_flag || c.urgency === "emergency"
      ? "bg-destructive"
      : c.urgency === "urgent"
        ? "bg-warning"
        : "bg-primary";

  const pillTone = c.red_flag || c.urgency === "emergency"
    ? "bg-destructive/10 text-destructive"
    : c.urgency === "urgent"
      ? "bg-warning/10 text-warning"
      : "bg-primary/10 text-primary";

  const shortId = c.id.slice(0, 6).toUpperCase();

  return (
    <CardShell
      label={c.red_flag ? "Red Flag · Triage" : "Live · Triage"}
      meta={`#${shortId}`}
      dotClassName={dot}
      onClick={onClick}
      contentClassName="space-y-4"
    >
      <div className="grid grid-cols-3 gap-4">
        <Metric label="Language" value={LANG_LABEL[c.language] ?? c.language.toUpperCase()} />
        <Metric label="Flow" value={flowLabel(c.flow)} />
        <Metric
          label="Clinic"
          value={c.recommended_clinic}
        />
      </div>

      <p className="text-sm text-foreground/80 line-clamp-2 leading-snug">
        “{c.chief_complaint}”
      </p>

      <div className="flex items-center justify-between gap-3 pt-1">
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.14em] uppercase",
            pillTone,
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
          {c.urgency} · {flowLabel(c.flow)}
          {c.is_dengue_hotspot && " · Hotspot"}
        </span>
        {actions ? (
          <div className="flex items-center gap-1">{actions}</div>
        ) : (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {timeAgo(c.created_at)}
          </span>
        )}
      </div>
    </CardShell>
  );
}
