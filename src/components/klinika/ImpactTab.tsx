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
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";
import { Activity, AlertTriangle, MapPin, ShieldCheck } from "lucide-react";

const TEAL = "oklch(0.62 0.13 165)";
const CORAL = "oklch(0.62 0.18 35)";
const AMBER = "oklch(0.62 0.13 65)";
const SLATE = "oklch(0.5 0.02 240)";

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent: "primary" | "destructive" | "warning" | "muted";
}) {
  const cls = {
    primary: "bg-primary/10 text-primary",
    destructive: "bg-destructive/10 text-destructive",
    warning: "bg-warning/10 text-warning",
    muted: "bg-muted text-muted-foreground",
  }[accent];
  return (
    <div className="bg-card border rounded-xl p-5">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${cls}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <p className="text-3xl font-semibold mt-3 tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
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

    const channelCounts = ["whatsapp", "web"].map((ch) => ({
      name: ch === "whatsapp" ? "WhatsApp" : "Web",
      value: cases.filter((c) => c.channel === ch).length,
    }));

    const clinicMap = new Map<string, number>();
    cases.forEach((c) => clinicMap.set(c.recommended_clinic, (clinicMap.get(c.recommended_clinic) ?? 0) + 1));
    const clinics = Array.from(clinicMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return { total, redFlags, dengueHotspots, anonTb, flowCounts, channelCounts, clinics };
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
        <StatCard icon={Activity} label="Total cases" value={stats.total} accent="primary" />
        <StatCard icon={AlertTriangle} label="Red flags" value={stats.redFlags} accent="destructive" />
        <StatCard icon={MapPin} label="Dengue hotspot cases" value={stats.dengueHotspots} accent="warning" />
        <StatCard icon={ShieldCheck} label="Anonymous TB screens" value={stats.anonTb} accent="muted" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">Cases by flow</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.flowCounts}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 240)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill={TEAL} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">Channels</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={stats.channelCounts}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={85}
                paddingAngle={2}
              >
                {stats.channelCounts.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? TEAL : SLATE} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4">Top recommended clinics</h3>
        <ResponsiveContainer width="100%" height={Math.max(180, stats.clinics.slice(0, 5).length * 38)}>
          <BarChart data={stats.clinics.slice(0, 5)} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 240)" />
            <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={180} />
            <Tooltip />
            <Bar dataKey="count" fill={AMBER} radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b">
          <h3 className="text-sm font-semibold">All referrals</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-2.5 font-medium">Clinic</th>
              <th className="text-right px-5 py-2.5 font-medium">Referrals</th>
            </tr>
          </thead>
          <tbody>
            {stats.clinics.map((c) => (
              <tr key={c.name} className="border-t">
                <td className="px-5 py-2.5">{c.name}</td>
                <td className="px-5 py-2.5 text-right tabular-nums font-medium">{c.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
