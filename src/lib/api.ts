import type { ChatRequest, ChatResponse, Session } from "./types";

// Set VITE_API_URL in your Lovable project's environment variables.
// During local dev, point to http://localhost:8000
// After Railway/Render deploy, point to your live URL.
export const API_BASE =
  (import.meta as any).env?.VITE_API_URL ?? "http://localhost:8000";

async function request<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
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
  request<{ status: string; service: string }>("/");

// ── Chat ──────────────────────────────────────────────────────────────────────

export const sendMessage = (body: ChatRequest) =>
  request<ChatResponse>("/chat", {
    method: "POST",
    body: JSON.stringify(body),
  });

// ── Sessions ──────────────────────────────────────────────────────────────────

export const listSessions = () =>
  request<Session[]>("/sessions");

export const getSession = (phone: string) =>
  request<Session>(`/session/${encodeURIComponent(phone)}`);

export const deleteSession = (phone: string) =>
  request<{ deleted: boolean; phone: string }>(
    `/session/${encodeURIComponent(phone)}`,
    { method: "DELETE" }
  );

export const resetAllSessions = () =>
  request<{ cleared: number }>("/sessions/reset-all", { method: "POST" });
