import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { REROUTE_REASONS, type RerouteReason, type TriageCase } from "@/lib/klinika";

interface Props {
  case: TriageCase | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (payload: { clinic: string; reason: string; note?: string | null }) => Promise<void>;
}

const severityDot = {
  high: "bg-destructive",
  med: "bg-warning",
  low: "bg-muted-foreground/40",
} as const;

export function RerouteModal({ case: c, open, onOpenChange, onConfirm }: Props) {
  const [clinic, setClinic] = useState("");
  const [reason, setReason] = useState<RerouteReason | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setClinic("");
      setReason(null);
      setNote("");
    }
  }, [open, c?.id]);

  if (!c) return null;

  const aiSuggestion = c.original_clinic ?? c.recommended_clinic;
  const canSubmit = clinic.trim().length > 0 && reason !== null && !submitting;

  const handleConfirm = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onConfirm({
        clinic: clinic.trim(),
        reason: reason!,
        note: note.trim() ? note.trim() : null,
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Recommend a Clinic</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-medium">AI suggested:</span> {aiSuggestion}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Clinician recommendation
            </label>
            <Input
              autoFocus
              placeholder="Type clinic / facility name…"
              value={clinic}
              onChange={(e) => setClinic(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Reason
            </label>
            <div className="flex flex-wrap gap-2">
              {REROUTE_REASONS.map((r) => {
                const active = reason === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setReason(r.value)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-foreground hover:bg-muted",
                    )}
                  >
                    <span className={cn("h-2 w-2 rounded-full", severityDot[r.severity])} />
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Note <span className="normal-case font-normal text-muted-foreground/70">(optional)</span>
            </label>
            <Textarea
              placeholder="Extra context for the receiving team…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!canSubmit}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm Recommendation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
