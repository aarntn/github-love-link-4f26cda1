import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, AlertTriangle, MapPin, ShieldCheck } from "lucide-react";
import { useTriageCases } from "@/hooks/useTriageCases";
import { FLOW_LABEL, type Flow, type TriageCase } from "@/lib/klinika";

const COLOR_PRIMARY = "var(--color-primary)";
const COLOR_DESTRUCTIVE = "var(--color-destructive)";
const COLOR_WARNING = "var(--color-warning)";
const COLOR_CHART_4 = "var(--color-chart-4)";

export function ImpactTab() {
  const { cases, loading } = useTriageCases();

  const stats = useMemo(() => deriveStats(cases), [cases]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-muted/40" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={<Activity className="h-4 w-4" />}
          label="Cases triaged"
          value={stats.total}
          tone="primary"
        />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Red flags caught"
          value={stats.redFlags}
          tone="destructive"
        />
        <StatCard
          icon={<MapPin className="h-4 w-4" />}
          label="Dengue hotspot referrals"
          value={stats.hotspotReferrals}
          tone="warning"
        />
        <StatCard
          icon={<ShieldCheck className="h-4 w-4" />}
          label="Anonymous-mode served"
          value={stats.anonymous}
          tone="primary"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Cases by flow">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byFlow} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "var(--color-muted)" }} contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill={COLOR_PRIMARY} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Cases by channel">
          <div className="flex h-64 items-center">
            <div className="h-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.byChannel}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {stats.byChannel.map((entry, i) => (
                      <Cell
                        key={entry.name}
                        fill={i === 0 ? COLOR_PRIMARY : COLOR_CHART_4}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex flex-col gap-2 pr-2 text-sm">
              {stats.byChannel.map((c, i) => (
                <li key={c.name} className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-sm"
                    style={{
                      backgroundColor:
                        i === 0 ? "var(--color-primary)" : "var(--color-chart-4)",
                    }}
                  />
                  <span className="capitalize">{c.name}</span>
                  <span className="ml-auto font-semibold tabular-nums">{c.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>

        <Panel title="Cases by language">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.byLanguage}
                layout="vertical"
                margin={{ top: 4, right: 16, bottom: 0, left: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={80}
                  tick={{ fontSize: 12, fill: "var(--color-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip cursor={{ fill: "var(--color-muted)" }} contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill={COLOR_WARNING} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Top recommended clinics">
          <div className="overflow-hidden rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-semibold">Clinic</th>
                  <th className="w-20 px-3 py-2 text-right font-semibold">Referrals</th>
                </tr>
              </thead>
              <tbody>
                {stats.topClinics.map((c) => (
                  <tr key={c.name} className="border-t border-border">
                    <td className="px-3 py-2.5">{c.name}</td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                      {c.value}
                    </td>
                  </tr>
                ))}
                {stats.topClinics.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-3 py-8 text-center text-muted-foreground">
                      No referrals yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}

const tooltipStyle: React.CSSProperties = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--color-foreground)",
  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
};

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-4 text-sm font-semibold tracking-tight">{title}</h3>
      {children}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "primary" | "destructive" | "warning";
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    destructive: "bg-destructive/10 text-destructive",
    warning: "bg-warning/15 text-warning",
  } as const;
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <span className={`flex h-7 w-7 items-center justify-center rounded-md ${tones[tone]}`}>
          {icon}
        </span>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
      <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight">
        {value}
      </p>
    </div>
  );
}

function deriveStats(cases: TriageCase[]) {
  const total = cases.length;
  const redFlags = cases.filter((c) => c.red_flag).length;
  const hotspotReferrals = cases.filter(
    (c) => c.flow === "dengue" && c.is_dengue_hotspot,
  ).length;
  const anonymous = cases.filter((c) => c.mode === "anonymous").length;

  const flowCounts: Record<Flow, number> = { dengue: 0, tb: 0, ncd: 0, general: 0 };
  for (const c of cases) flowCounts[c.flow]++;
  const byFlow = (Object.keys(flowCounts) as Flow[]).map((k) => ({
    name: FLOW_LABEL[k],
    value: flowCounts[k],
  }));

  const channelCounts = { web: 0, whatsapp: 0 };
  for (const c of cases) channelCounts[c.channel]++;
  const byChannel = [
    { name: "web", value: channelCounts.web },
    { name: "whatsapp", value: channelCounts.whatsapp },
  ];

  const langMap = new Map<string, number>();
  for (const c of cases) langMap.set(c.language, (langMap.get(c.language) ?? 0) + 1);
  const byLanguage = [...langMap.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const clinicMap = new Map<string, number>();
  for (const c of cases)
    clinicMap.set(c.recommended_clinic, (clinicMap.get(c.recommended_clinic) ?? 0) + 1);
  const topClinics = [...clinicMap.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return {
    total,
    redFlags,
    hotspotReferrals,
    anonymous,
    byFlow,
    byChannel,
    byLanguage,
    topClinics,
  };
}
