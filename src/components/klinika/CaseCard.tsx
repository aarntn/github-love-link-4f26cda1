import { Globe, MessageCircle, MapPin, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { timeAgo, type TriageCase } from "@/lib/klinika";
import { FlowTag, UrgencyBadge } from "./badges";

export function CaseCard({
  c,
  onClick,
}: {
  c: TriageCase;
  onClick?: () => void;
}) {
  const ChannelIcon = c.channel === "whatsapp" ? MessageCircle : Globe;
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative w-full overflow-hidden rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring",
        c.red_flag && "border-destructive/30",
      )}
    >
      {c.red_flag && (
        <span className="absolute inset-y-0 left-0 w-1 bg-destructive" aria-hidden />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <ChannelIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
            {c.chief_complaint}
          </p>
        </div>
        <UrgencyBadge urgency={c.urgency} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <FlowTag flow={c.flow} />
        <span className="text-[11px] text-muted-foreground">{c.language}</span>
        {c.red_flag && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-destructive">
            <AlertTriangle className="h-3 w-3" />
            Red flag
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-xs">
        <div className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{c.recommended_clinic}</span>
        </div>
        <span className="shrink-0 text-muted-foreground">{timeAgo(c.created_at)}</span>
      </div>
    </button>
  );
}
