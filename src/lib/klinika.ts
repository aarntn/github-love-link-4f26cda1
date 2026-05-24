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
}

export const urgencyRank = (u: string): number =>
  u === "emergency" ? 3 : u === "urgent" ? 2 : 1;

export const flowLabel = (f: string): string =>
  ({ dengue: "Dengue", tb: "TB Screen", ncd: "NCD", general: "General" }[f] ?? f);

export const timeAgo = (date: string): string =>
  formatDistanceToNow(new Date(date), { addSuffix: true });
