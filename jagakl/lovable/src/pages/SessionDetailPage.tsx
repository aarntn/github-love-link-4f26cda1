import { useParams, useNavigate } from "react-router-dom";
import { useSession } from "../hooks/useSession";

export default function SessionDetailPage() {
  const { phone } = useParams<{ phone: string }>();
  const navigate = useNavigate();
  const { session, loading, error } = useSession(phone ?? "");

  if (loading) return <p className="p-8 text-gray-400">Loading…</p>;
  if (error) return <p className="p-8 text-red-500">{error}</p>;
  if (!session) return null;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-emerald-600 hover:underline mb-4 block"
      >
        ← Back to dashboard
      </button>

      <h2 className="text-xl font-bold mb-1">{session.phone}</h2>
      <p className="text-sm text-gray-500 mb-4">
        {session.language} · {session.mode} · stage: {session.stage}
      </p>

      {/* Conversation history */}
      <section className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-2">Conversation</h3>
        <div className="space-y-1">
          {session.conversation_history.map((m, i) => (
            <div key={i} className={`text-sm ${m.role === "user" ? "text-gray-800" : "text-emerald-700"}`}>
              <span className="font-medium">{m.role}: </span>{m.content}
            </div>
          ))}
        </div>
      </section>

      {/* Vitals */}
      {session.glucose_log.length > 0 && (
        <section className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-2">Glucose Log</h3>
          {/* TODO: render chart or table */}
          <pre className="text-xs bg-gray-50 rounded p-3 overflow-auto">
            {JSON.stringify(session.glucose_log, null, 2)}
          </pre>
        </section>
      )}

      {session.bp_log.length > 0 && (
        <section className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-2">BP Log</h3>
          {/* TODO: render chart or table */}
          <pre className="text-xs bg-gray-50 rounded p-3 overflow-auto">
            {JSON.stringify(session.bp_log, null, 2)}
          </pre>
        </section>
      )}

      {session.refill_notes.length > 0 && (
        <section>
          <h3 className="font-semibold text-gray-700 mb-2">Refill Notes</h3>
          <ul className="text-sm space-y-1">
            {session.refill_notes.map((n, i) => (
              <li key={i} className="text-gray-700">• {n}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
