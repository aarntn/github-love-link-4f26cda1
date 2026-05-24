import type { ChatRequest, ChatResponse, Session } from "./types";

export const API_BASE =
  (import.meta as any).env?.VITE_API_URL ?? "http://localhost:8000";

// Mock mode is active when VITE_API_URL is not set (i.e. Lovable preview without a backend)
const USE_MOCK = !((import.meta as any).env?.VITE_API_URL);

// ── Mock flow (steps through the dengue demo scenario) ────────────────────────

const _mockFlow = (() => {
  let step = 0;

  const steps: Array<{ reply: string; flag: ChatResponse["flag"] }> = [
    {
      reply:
        "Welcome to *JagaKL* — your free health guide in KL.\n\n" +
        "Choose your language / Pilih bahasa:\n" +
        "1 - English\n" +
        "2 - Bahasa Melayu\n" +
        "3 - தமிழ் (Tamil)\n" +
        "4 - বাংলা (Bangla)\n" +
        "5 - 中文 (Chinese)\n\n" +
        "_Type 'Forget me' anytime to delete all your data._",
      flag: null,
    },
    {
      reply:
        "Are you:\n" +
        "1 - Malaysian citizen (with MyKad / IC)\n" +
        "2 - Without IC / migrant / refugee (anonymous — safe)\n\n" +
        "_In anonymous mode, we NEVER share your data with MOH or Immigration._",
      flag: null,
    },
    {
      reply:
        "How can I help you today?\n\n" +
        "Common topics:\n" +
        "- *Fever / demam* — dengue risk check\n" +
        "- *Cough 2+ weeks* — TB screen\n" +
        "- *Medication help* — prescription guidance\n" +
        "- *Feeling sad / stressed / anxious* — mental health check\n\n" +
        "Just describe your symptoms or type a question.",
      flag: null,
    },
    {
      reply:
        "To check dengue risk accurately, please share your postcode (5 digits, e.g. 50480).",
      flag: null,
    },
    {
      reply:
        "Which day of fever is this? Please reply with a number (e.g. 1, 3, or 5).",
      flag: null,
    },
    {
      reply:
        "⚠️ *Dengue Alert*: Postcode 52100 has 12 active cases.\n\n" +
        "On day 3 of fever, you need an *NS1/FBC test NOW*.\n\n" +
        "*MERCY Malaysia Chow Kit*\n" +
        "Jalan Chow Kit, 50350 Kuala Lumpur\n" +
        "Tel: 03-4041 2010\n" +
        "Hours: Mon 8:30am–5pm | Sat 8:30am–1pm\n" +
        "No IC required | FREE | Anonymous safe\n\n" +
        "Walk in and tell the nurse: fever day 3, dengue hotspot area.",
      flag: null,
    },
  ];

  return {
    next: (msg: string): ChatResponse => {
      const lower = msg.toLowerCase();

      // Red-flag override — fires immediately regardless of step
      if (
        lower.includes("chest pain") ||
        lower.includes("sakit dada") ||
        lower.includes("heart attack") ||
        lower.includes("serangan jantung")
      ) {
        return {
          reply:
            "EMERGENCY: You may be having a heart attack.\n" +
            "Call 999 NOW. Do not drive yourself. Sit down and stay calm.",
          flag: "CHEST_PAIN",
        };
      }
      if (
        lower.includes("cant breathe") ||
        lower.includes("can't breathe") ||
        lower.includes("sesak nafas") ||
        lower.includes("tak boleh bernafas")
      ) {
        return {
          reply:
            "EMERGENCY: You are having severe difficulty breathing.\nCall 999 NOW.",
          flag: "BREATHING",
        };
      }
      if (
        lower.includes("want to die") ||
        lower.includes("nak mati") ||
        lower.includes("bunuh diri") ||
        lower.includes("kill myself")
      ) {
        return {
          reply:
            "You are not alone and I am glad you reached out.\n" +
            "Please call Befrienders KL right now: 03-7627 2929\n" +
            "(24 hours, free, confidential). They will listen.",
          flag: "SUICIDAL",
        };
      }

      const result = steps[Math.min(step, steps.length - 1)];
      step = Math.min(step + 1, steps.length - 1);
      return result;
    },
    reset: () => {
      step = 0;
    },
  };
})();

// ── Helpers ───────────────────────────────────────────────────────────────────

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw Object.assign(new Error(detail), { status: res.status });
  }
  return res.json() as Promise<T>;
}

// ── Health ────────────────────────────────────────────────────────────────────

export const health = () =>
  USE_MOCK
    ? Promise.resolve({ status: "ok (mock)", service: "JagaKL" })
    : request<{ status: string; service: string }>("/");

// ── Chat ──────────────────────────────────────────────────────────────────────

export const sendMessage = (body: ChatRequest): Promise<ChatResponse> =>
  USE_MOCK
    ? new Promise((resolve) =>
        setTimeout(() => resolve(_mockFlow.next(body.message)), 650)
      )
    : request<ChatResponse>("/chat", {
        method: "POST",
        body: JSON.stringify(body),
      });

export const resetMockSession = () => _mockFlow.reset();

// ── Sessions ──────────────────────────────────────────────────────────────────

export const listSessions = (): Promise<Session[]> =>
  USE_MOCK
    ? Promise.resolve([])
    : request<Session[]>("/sessions");

export const getSession = (phone: string): Promise<Session | null> =>
  USE_MOCK
    ? Promise.resolve(null)
    : request<Session>(`/session/${encodeURIComponent(phone)}`);

export const deleteSession = (phone: string) =>
  USE_MOCK
    ? Promise.resolve({ deleted: true, phone })
    : request<{ deleted: boolean; phone: string }>(
        `/session/${encodeURIComponent(phone)}`,
        { method: "DELETE" }
      );

export const resetAllSessions = () =>
  USE_MOCK
    ? Promise.resolve({ cleared: 0 })
    : request<{ cleared: number }>("/sessions/reset-all", { method: "POST" });
