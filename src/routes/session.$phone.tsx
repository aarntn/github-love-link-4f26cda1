import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSession } from "../hooks/useSession";
import type { GlucoseEntry, BPEntry } from "../lib/types";

export const Route = createFileRoute("/session/$phone")({
  component: SessionDetailPage,
});

function timeSince(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function GlucoseTable({ log }: { log: GlucoseEntry[] }) {
  return (
    <section className="mb-6">
      <h3 className="font-semibold text-gray-700 mb-2">🩸 Glucose Log</h3>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
            <th className="py-1.5 pr-4 font-medium">Reading</th>
            <th className="py-1.5 pr-4 font-medium">Status</th>
            <th className="py-1.5 font-medium">Recorded</th>
          </tr>
        </thead>
        <tbody>
          {log.map((g, i) => {
            const val = g.v;
            const inRange = val >= 4.0 && val <= 7.0;
            const isLow = val < 3.9;
            return (
              <tr key={i} className="border-b border-gray-50">
                <td className="py-1.5 pr-4 font-mono font-medium">
                  {val} mmol/L
                </td>
                <td className="py-1.5 pr-4">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      isLow
                        ? "bg-red-100 text-red-700"
                        : inRange
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {isLow ? "⚠ Low" : inRange ? "✓ In range" : "↑ High"}
                  </span>
                </td>
                <td className="py-1.5 text-gray-400 text-xs">
                  {timeSince(g.ts)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function BPTable({ log }: { log: BPEntry[] }) {
  return (
    <section className="mb-6">
      <h3 className="font-semibold text-gray-700 mb-2">💓 BP Log</h3>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
            <th className="py-1.5 pr-4 font-medium">Reading</th>
            <th className="py-1.5 pr-4 font-medium">Status</th>
            <th className="py-1.5 font-medium">Recorded</th>
          </tr>
        </thead>
        <tbody>
          {log.map((b, i) => {
            const inRange = b.sys < 130 && b.dia < 80;
            const elevated = b.sys >= 140 || b.dia >= 90;
            return (
              <tr key={i} className="border-b border-gray-50">
                <td className="py-1.5 pr-4 font-mono font-medium">
                  {b.sys}/{b.dia} mmHg
                </td>
                <td className="py-1.5 pr-4">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      elevated
                        ? "bg-orange-100 text-orange-700"
                        : inRange
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {elevated ? "↑ High" : inRange ? "✓ In range" : "↑ Watch"}
                  </span>
                </td>
                <td className="py-1.5 text-gray-400 text-xs">
                  {timeSince(b.ts)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function SessionDetailPage() {
  const { phone } = Route.useParams();
  const navigate = useNavigate();
  const { session, loading, error } = useSession(phone);

  if (loading)
    return (
      <div className="p-8 text-center text-gray-400">
        <div className="animate-spin text-3xl mb-2">⏳</div>Loading session…
      </div>
    );
  if (error)
    return <p className="p-8 text-red-500">{error}</p>;
  if (!session)
    return (
      <p className="p-8 text-gray-400">
        Session not found.
      </p>
    );

  const LANG_LABEL: Record<string, string> = {
    en: "English", ms: "Bahasa Melayu", ta: "Tamil",
    zh: "Chinese", bn: "Bangla",
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Back */}
      <button
        onClick={() => navigate({ to: "/dashboard" })}
        className="text-sm text-emerald-600 hover:underline mb-5 block"
      >
        ← Back to dashboard
      </button>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono font-semibold text-gray-800">{session.phone}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {LANG_LABEL[session.language ?? ""] ?? session.language ?? "—"} ·{" "}
              {session.mode ?? "—"} · last active {timeSince(session.last_active)}
            </p>
          </div>
          <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
            {session.stage ?? "unknown"}
          </span>
        </div>
        {/* Quick stats */}
        <div className="flex gap-4 mt-3 text-xs text-gray-500">
          <span>💬 {session.conversation_history.length} messages</span>
          {session.glucose_log.length > 0 && (
            <span>🩸 {session.glucose_log.length} glucose readings</span>
          )}
          {session.bp_log.length > 0 && (
            <span>💓 {session.bp_log.length} BP readings</span>
          )}
          {session.refill_notes.length > 0 && (
            <span>💊 {session.refill_notes.length} refill notes</span>
          )}
        </div>
      </div>

      {/* Conversation */}
      <section className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Conversation</h3>
        <div className="space-y-2">
          {session.conversation_history.length === 0 ? (
            <p className="text-gray-400 text-sm">No messages yet.</p>
          ) : (
            session.conversation_history.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] text-sm px-3 py-2 rounded-xl whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-emerald-600 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-800 rounded-bl-none"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Vitals */}
      {session.glucose_log.length > 0 && (
        <GlucoseTable log={session.glucose_log} />
      )}
      {session.bp_log.length > 0 && (
        <BPTable log={session.bp_log} />
      )}

      {/* Refill notes */}
      {session.refill_notes.length > 0 && (
        <section>
          <h3 className="font-semibold text-gray-700 mb-2">💊 Refill Notes</h3>
          <ul className="space-y-1">
            {session.refill_notes.map((n, i) => (
              <li key={i} className="text-sm text-gray-700 bg-indigo-50 rounded-lg px-3 py-2">
                {n}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
