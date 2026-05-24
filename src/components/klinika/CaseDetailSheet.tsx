import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { timeAgo, type TriageCase } from "@/lib/klinika";
import { FlowTag, StatusBadge, UrgencyBadge } from "./badges";
import { AlertTriangle, Globe, MessageCircle } from "lucide-react";

export function CaseDetailSheet({
  c,
  open,
  onOpenChange,
}: {
  c: TriageCase | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {c && (
          <>
            <SheetHeader>
              <SheetTitle className="text-lg leading-snug">
                {c.chief_complaint}
              </SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-2 pt-1">
                <UrgencyBadge urgency={c.urgency} />
                <FlowTag flow={c.flow} />
                <StatusBadge status={c.status} />
                {c.red_flag && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Red flag
                  </span>
                )}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-5 p-4">
              <Section title="AI triage summary">
                <p className="text-sm leading-relaxed text-foreground">
                  {c.triage_summary}
                </p>
              </Section>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <Field label="Language" value={c.language} />
                <Field
                  label="Channel"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      {c.channel === "whatsapp" ? (
                        <MessageCircle className="h-3.5 w-3.5" />
                      ) : (
                        <Globe className="h-3.5 w-3.5" />
                      )}
                      {c.channel === "whatsapp" ? "WhatsApp" : "Web"}
                    </span>
                  }
                />
                <Field
                  label="Mode"
                  value={c.mode === "anonymous" ? "Anonymous" : "Citizen"}
                />
                <Field label="Postcode" value={c.postcode ?? "—"} />
                <Field
                  label="Dengue hotspot"
                  value={
                    c.is_dengue_hotspot === null
                      ? "—"
                      : c.is_dengue_hotspot
                        ? "Yes"
                        : "No"
                  }
                />
                <Field label="Received" value={timeAgo(c.created_at)} />
              </div>

              <Section title="Recommended clinic">
                <p className="text-sm font-medium text-foreground">
                  {c.recommended_clinic}
                </p>
              </Section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm text-foreground">{value}</p>
    </div>
  );
}
