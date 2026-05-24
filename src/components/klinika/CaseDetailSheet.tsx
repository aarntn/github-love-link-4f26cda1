import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import type { TriageCase } from "@/lib/klinika";
import { timeAgo } from "@/lib/klinika";
import { UrgencyBadge, FlowBadge, StatusBadge, LanguageBadge } from "./badges";
import { AlertTriangle } from "lucide-react";

interface Props {
  case: TriageCase | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
        {label}
      </p>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  );
}

export function CaseDetailSheet({ case: c, open, onOpenChange }: Props) {
  if (!c) return null;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg w-full">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Case Details
            <StatusBadge status={c.status} />
          </SheetTitle>
          <SheetDescription>{timeAgo(c.created_at)}</SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-5">
          {c.red_flag && (
            <div className="bg-destructive/10 text-destructive border border-destructive/30 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="text-sm font-medium">Red flag case — immediate clinical attention required.</div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <UrgencyBadge urgency={c.urgency} />
            <FlowBadge flow={c.flow} />
            <LanguageBadge language={c.language} />
          </div>

          <Field label="Chief complaint" value={<p className="font-medium">{c.chief_complaint}</p>} />
          <Field label="Triage summary" value={<p className="leading-relaxed">{c.triage_summary}</p>} />
          <Field label="Recommended clinic" value={c.recommended_clinic} />

          <div className="grid grid-cols-2 gap-4">
            <Field label="Channel" value={<span className="capitalize">{c.channel}</span>} />
            <Field label="Mode" value={<span className="capitalize">{c.mode}</span>} />
            <Field label="Postcode" value={c.postcode ?? "—"} />
            <Field
              label="Dengue hotspot"
              value={c.is_dengue_hotspot ? "Yes" : "No"}
            />
          </div>

          <Field label="Case ID" value={<code className="text-xs">{c.id}</code>} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
