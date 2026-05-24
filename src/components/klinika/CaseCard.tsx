import { MapPin, AlertTriangle } from "lucide-react";
import type { TriageCase } from "@/lib/klinika";
import { timeAgo } from "@/lib/klinika";
import { StatusBadge, UrgencyDot, FlowBadge, LanguageBadge } from "./badges";
import { cn } from "@/lib/utils";

interface Props {
  case: TriageCase;
  onClick?: () => void;
  actions?: React.ReactNode;
}

export function CaseCard({ case: c, onClick, actions }: Props) {
  const isReviewed = c.status === "reviewed";
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-card border rounded-xl overflow-hidden transition-all hover:shadow-md hover:border-primary/30",
        onClick && "cursor-pointer",
        c.red_flag && !isReviewed && "border-destructive/40",
        isReviewed && "opacity-60 bg-muted/30",
      )}
    >
      {c.red_flag && !isReviewed && (
        <div className="bg-destructive/10 text-destructive px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5" />
          Red flag — immediate attention
        </div>
      )}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <LanguageBadge language={c.language} />
          <StatusBadge status={c.status} />
        </div>

        <div className="space-y-1.5">
          <p className="font-medium text-foreground line-clamp-2 leading-snug">
            {c.chief_complaint}
          </p>
          <UrgencyDot urgency={c.urgency} />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <FlowBadge flow={c.flow} />
          {c.is_dengue_hotspot && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-warning/10 text-warning">
              Hotspot
            </span>
          )}
        </div>

        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span className="line-clamp-1">
            {c.recommended_clinic}
            {c.clinic_distance_km != null && ` · ${c.clinic_distance_km.toFixed(1)} km`}
          </span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-muted-foreground">{timeAgo(c.created_at)}</span>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
