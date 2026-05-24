import type { Session } from "../lib/types";

const LANG_LABEL: Record<string, string> = {
  en: "English",
  ms: "Bahasa Melayu",
  ta: "Tamil",
  zh: "Chinese",
  bn: "Bangla",
};

const STAGE_BADGE: Record<string, string> = {
  onboarding: "bg-gray-100 text-gray-600",
  awaiting_language: "bg-yellow-100 text-yellow-700",
  awaiting_mode: "bg-blue-100 text-blue-700",
  triage_start: "bg-emerald-100 text-emerald-700",
  tb_flow: "bg-orange-100 text-orange-700",
  myminda_flow: "bg-purple-100 text-purple-700",
  dengue_flow: "bg-red-100 text-red-700",
  ncd_flow: "bg-sky-100 text-sky-700",
  pharmacy_flow: "bg-indigo-100 text-indigo-700",
  ncd_log_flow: "bg-teal-100 text-teal-700",
};

function timeSince(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface SessionCardProps {
  session: Session;
  onClick: () => void;
  onDelete: () => void;
}

export function SessionCard({ session, onClick, onDelete }: SessionCardProps) {
  const badgeClass =
    STAGE_BADGE[session.stage ?? ""] ?? "bg-gray-100 text-gray-600";

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md cursor-pointer transition-shadow relative group"
    >
      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-3 right-3 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-lg leading-none"
        title="Delete session"
      >
        ×
      </button>

      <div className="flex items-start justify-between pr-4">
        <div>
          <p className="font-mono text-sm font-semibold text-gray-800">
            {session.phone}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {session.mode ?? "—"} ·{" "}
            {LANG_LABEL[session.language ?? ""] ?? session.language ?? "—"}
          </p>
        </div>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeClass}`}
        >
          {session.stage ?? "unknown"}
        </span>
      </div>

      <div className="mt-3 flex gap-4 text-xs text-gray-500">
        <span>💬 {session.conversation_history.length} msgs</span>
        {session.glucose_log.length > 0 && (
          <span>🩸 {session.glucose_log.length} glucose</span>
        )}
        {session.bp_log.length > 0 && (
          <span>💓 {session.bp_log.length} BP</span>
        )}
        {session.refill_notes.length > 0 && (
          <span>💊 {session.refill_notes.length} refill</span>
        )}
      </div>

      <p className="mt-2 text-xs text-gray-400">
        Active {timeSince(session.last_active)}
      </p>
    </div>
  );
}
