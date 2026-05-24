// ── Chat ────────────────────────────────────────────────────────────────────

export type Language = "en" | "ms" | "ta" | "zh" | "bn";
export type Mode = "citizen" | "anonymous";
export type FlagCategory =
  | "CHEST_PAIN"
  | "STROKE"
  | "BREATHING"
  | "SEVERE_BLEEDING"
  | "UNCONSCIOUS"
  | "SUICIDAL"
  | "CHILD_DANGER"
  | null;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  ts: number; // client-side timestamp (ms)
}

export interface ChatRequest {
  phone: string;
  message: string;
  latitude?: number | null;
  longitude?: number | null;
  location_label?: string | null;
  location_address?: string | null;
}

export interface ChatResponse {
  reply: string;
  flag: FlagCategory;
}

// ── Vitals ───────────────────────────────────────────────────────────────────

export interface GlucoseEntry {
  v: number;        // backend field name
  unit: string;
  ts: string;       // ISO
}

export interface BPEntry {
  sys: number;      // backend field name
  dia: number;
  ts: string;       // ISO
}

// ── Session ──────────────────────────────────────────────────────────────────

export interface Session {
  phone: string;
  language: Language | null;
  mode: Mode | null;
  stage: string | null;
  postcode: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  location_label?: string | null;
  location_address?: string | null;
  last_active: string; // ISO
  tb_answers: boolean[];
  phq_answers: number[];
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
