// ── Chat ────────────────────────────────────────────────────────────────────

export type Language = "en" | "ms" | "ta" | "zh" | "bn";
export type Mode = "citizen" | "anonymous";
export type FlagCategory =
  | "chest_pain"
  | "stroke"
  | "breathing"
  | "bleeding"
  | "unconscious"
  | null;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  ts: number; // client-side timestamp (ms)
}

export interface ChatRequest {
  phone: string;
  message: string;
}

export interface ChatResponse {
  reply: string;
  flag: FlagCategory;
}

// ── Vitals ───────────────────────────────────────────────────────────────────

export interface GlucoseEntry {
  value: number;
  unit: "mmol/L" | "mg/dL";
  ts: string; // ISO
}

export interface BPEntry {
  systolic: number;
  diastolic: number;
  ts: string; // ISO
}

// ── Session ──────────────────────────────────────────────────────────────────

export interface Session {
  phone: string;
  language: Language | null;
  mode: Mode | null;
  stage: string | null;
  postcode: string | null;
  last_active: string; // ISO
  tb_answers: string[];
  phq_answers: string[];
  glucose_log: GlucoseEntry[];
  bp_log: BPEntry[];
  refill_notes: string[];
  conversation_history: Array<{ role: "user" | "assistant"; content: string }>;
}

// ── API error ────────────────────────────────────────────────────────────────

export interface ApiError {
  detail: string;
  status: number;
}
