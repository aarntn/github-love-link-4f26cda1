import { useMemo } from "react";
import type { TriageCase } from "@/lib/klinika";
import { flowLabel } from "@/lib/klinika";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { CardShell } from "./CardShell";

const TEAL = "oklch(0.62 0.13 165)";
const AMBER = "oklch(0.62 0.13 65)";

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "primary" | "destructive" | "warning" | "muted";
}) {
  const dot = {
    primary: "bg-primary",
    destructive: "bg-destructive",
    warning: "bg-warning",
    muted: "bg-muted-foreground/50",
  }[accent];

  // simple synthetic sparkline bars based on the value
  const bars = Array.from({ length: 18 }, (_, i) => {
    const seed = (value + 1) * (i + 1);
    return 30 + ((seed * 37) % 70);
  });

  return (
    <CardShell label={label} dotClassName={dot} meta="LIVE">
      <div className="flex items-end justify-between gap-3">
        <p className="text-4xl font-semibold tracking-tight leading-none">{value}</p>
        <div className="flex items-end gap-[3px] h-10">
          {bars.map((h, i) => (
            <span
              key={i}
              className="w-[3px] rounded-sm bg-muted-foreground/25"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </CardShell>
  );
}

interface Props {
  cases: TriageCase[];
}

export function ImpactTab({ cases }: Props) {
  const stats = useMemo(() => {
    const total = cases.length;
    const redFlags = cases.filter((c) => c.red_flag).length;
    const dengueHotspots = cases.filter(
      (c) => c.flow === "dengue" && c.is_dengue_hotspot,
    ).length;
    const anonTb = cases.filter((c) => c.flow === "tb" && c.mode === "anonymous").length;

    const flowCounts = ["dengue", "tb", "ncd", "general"].map((f) => ({
      name: flowLabel(f),
      count: cases.filter((c) => c.flow === f).length,
    }));

    const clinicMap = new Map<string, number>();
    cases.forEach((c) => clinicMap.set(c.recommended_clinic, (clinicMap.get(c.recommended_clinic) ?? 0) + 1));
    const clinics = Array.from(clinicMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return { total, redFlags, dengueHotspots, anonTb, flowCounts, clinics };
  }, [cases]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Impact</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Live analytics across all triage cases.
        </p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total cases" value={stats.total} accent="primary" />
        <StatCard label="Red flags" value={stats.redFlags} accent="destructive" />
        <StatCard label="Dengue hotspot" value={stats.dengueHotspots} accent="warning" />
        <StatCard label="Anonymous TB" value={stats.anonTb} accent="muted" />
      </div>

      <CardShell label="Cases by Flow" meta="DISTRIBUTION" dotClassName="bg-primary">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={stats.flowCounts}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 240)" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill={TEAL} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardShell>

      <CardShell label="Top Clinics" meta="REFERRALS" dotClassName="bg-warning">
        <ResponsiveContainer width="100%" height={Math.max(180, stats.clinics.slice(0, 5).length * 38)}>
          <BarChart data={stats.clinics.slice(0, 5)} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 240)" />
            <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={180} />
            <Tooltip />
            <Bar dataKey="count" fill={AMBER} radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardShell>

      <CardShell
        label="All Referrals"
        meta={`${stats.clinics.length} CLINICS`}
        dotClassName="bg-muted-foreground/50"
        contentClassName="p-0"
      >
        <table className="w-full text-sm">
          <thead className="text-[10px] text-muted-foreground uppercase tracking-[0.18em]">
            <tr>
              <th className="text-left px-5 py-3 font-semibold">Clinic</th>
              <th className="text-right px-5 py-3 font-semibold">Referrals</th>
            </tr>
          </thead>
          <tbody>
            {stats.clinics.map((c) => (
              <tr key={c.name} className="border-t border-border/60">
                <td className="px-5 py-3">{c.name}</td>
                <td className="px-5 py-3 text-right tabular-nums font-medium">{c.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardShell>
    </div>
  );
}
