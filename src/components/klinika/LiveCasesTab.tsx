import { useMemo, useState } from "react";
import type { TriageCase } from "@/lib/klinika";
import { CaseCard } from "./CaseCard";
import { CaseDetailSheet } from "./CaseDetailSheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  cases: TriageCase[];
  updateStatus?: (id: string, status: import("@/lib/klinika").Status) => Promise<void>;
  rerouteCase?: (
    id: string,
    payload: { clinic: string; reason: string; note?: string | null },
  ) => Promise<void>;
}

const STATUS_RANK: Record<string, number> = { new: 0, escalated: 1, reviewed: 2 };

export function LiveCasesTab({ cases, updateStatus, rerouteCase }: Props) {
  const [urgency, setUrgency] = useState<string>("all");
  const [flow, setFlow] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [selected, setSelected] = useState<TriageCase | null>(null);

  const filtered = useMemo(() => {
    return cases
      .filter((c) => (status === "all" ? true : c.status === status))
      .filter((c) => (urgency === "all" ? true : c.urgency === urgency))
      .filter((c) => (flow === "all" ? true : c.flow === flow))
      .sort((a, b) => {
        const sa = STATUS_RANK[a.status] ?? 99;
        const sb = STATUS_RANK[b.status] ?? 99;
        if (sa !== sb) return sa - sb;
        if (a.status === "new" && a.red_flag !== b.red_flag) {
          return a.red_flag ? -1 : 1;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [cases, status, urgency, flow]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Triage Feed</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Semua kes triaj masuk. Semak status review di sini.
        </p>
      </header>


      <div className="flex flex-wrap gap-3">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="new">Belum Review</SelectItem>
            <SelectItem value="escalated">Direroute</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={urgency} onValueChange={setUrgency}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Urgency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All urgencies</SelectItem>
            <SelectItem value="emergency">Emergency</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="routine">Routine</SelectItem>
          </SelectContent>
        </Select>
        <Select value={flow} onValueChange={setFlow}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Flow" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All flows</SelectItem>
            <SelectItem value="dengue">Dengue</SelectItem>
            <SelectItem value="tb">TB Screen</SelectItem>
            <SelectItem value="ncd">NCD</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto text-sm text-muted-foreground self-center">
          {filtered.length} case{filtered.length === 1 ? "" : "s"}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed rounded-xl py-16 text-center text-muted-foreground">
          No cases match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <CaseCard key={c.id} case={c} onClick={() => setSelected(c)} />
          ))}
        </div>
      )}

      <CaseDetailSheet
        case={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        updateStatus={updateStatus}
        rerouteCase={rerouteCase}
      />
    </div>
  );
}
