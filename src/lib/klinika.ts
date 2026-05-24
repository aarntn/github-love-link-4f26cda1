import { supabase } from "@/integrations/supabase/client";

export type Channel = "web" | "whatsapp";
export type Mode = "citizen" | "anonymous";
export type Flow = "dengue" | "tb" | "ncd" | "general";
export type Urgency = "emergency" | "urgent" | "routine";
export type CaseStatus = "new" | "reviewed" | "escalated";

export interface TriageCase {
  id: string;
  created_at: string;
  channel: Channel;
  mode: Mode;
  language: string;
  chief_complaint: string;
  flow: Flow;
  urgency: Urgency;
  red_flag: boolean;
  postcode: string | null;
  is_dengue_hotspot: boolean | null;
  recommended_clinic: string;
  triage_summary: string;
  status: CaseStatus;
}

export async function fetchTriageCases(): Promise<TriageCase[]> {
  const { data, error } = await supabase
    .from("triage_cases")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as TriageCase[];
}

export async function updateCaseStatus(id: string, status: CaseStatus) {
  const { error } = await supabase
    .from("triage_cases")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

export function timeAgo(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export const FLOW_LABEL: Record<Flow, string> = {
  dengue: "Dengue",
  tb: "TB",
  ncd: "NCD",
  general: "General",
};

export const URGENCY_RANK: Record<Urgency, number> = {
  emergency: 0,
  urgent: 1,
  routine: 2,
};
