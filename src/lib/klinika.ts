import { formatDistanceToNow } from "date-fns";

export type Urgency = "emergency" | "urgent" | "routine";
export type Status = "new" | "reviewed" | "escalated";
export type Flow = "dengue" | "tb" | "ncd" | "general";
export type Channel = "web" | "whatsapp";
export type Mode = "citizen" | "anonymous";

export interface TriageCase {
  id: string;
  created_at: string;
  channel: Channel | string;
  mode: Mode | string;
  language: string;
  chief_complaint: string;
  flow: Flow | string;
  urgency: Urgency | string;
  red_flag: boolean;
  postcode: string | null;
  is_dengue_hotspot: boolean | null;
  recommended_clinic: string;
  triage_summary: string;
  status: Status | string;
  original_clinic?: string | null;
  reroute_reason?: string | null;
  reroute_note?: string | null;
}

export type RerouteReason =
  | "worsening"
  | "specialist"
  | "travel"
  | "closer"
  | "other";

export const REROUTE_REASONS: { value: RerouteReason; label: string; severity: "high" | "med" | "low" }[] = [
  { value: "worsening", label: "Symptoms worsening", severity: "high" },
  { value: "specialist", label: "Needs specialist / hospital-level care", severity: "high" },
  { value: "travel", label: "Patient unable to travel to AI-recommended clinic", severity: "med" },
  { value: "closer", label: "Closer facility available", severity: "med" },
  { value: "other", label: "Other", severity: "low" },
];

export const rerouteReasonLabel = (v?: string | null): string | null =>
  REROUTE_REASONS.find((r) => r.value === v)?.label ?? null;

export const urgencyRank = (u: string): number =>
  u === "emergency" ? 3 : u === "urgent" ? 2 : 1;

export const flowLabel = (f: string): string =>
  ({ dengue: "Dengue", tb: "TB Screen", ncd: "NCD", general: "General" }[f] ?? f);

export const timeAgo = (date: string): string =>
  formatDistanceToNow(new Date(date), { addSuffix: true });
