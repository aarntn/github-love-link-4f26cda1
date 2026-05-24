import { useState } from "react";
import { useSessions } from "../hooks/useSessions";
import { SessionCard } from "./SessionCard";
import type { Session } from "../lib/types";

interface DashboardProps {
  onSelectSession: (phone: string) => void;
}

export function Dashboard({ onSelectSession }: DashboardProps) {
  const { sessions, loading, error, refetch, remove, clearAll } =
    useSessions(10_000);
  const [search, setSearch] = useState("");
  const [clearing, setClearing] = useState(false);

  const filtered = sessions.filter(
    (s) =>
      s.phone.includes(search) ||
      (s.language ?? "").includes(search) ||
      (s.stage ?? "").includes(search)
  );

  const handleClearAll = async () => {
    if (!window.confirm("Delete ALL sessions? This cannot be undone.")) return;
    setClearing(true);
    await clearAll();
    setClearing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              JagaKL Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Live patient sessions · auto-refreshes every 10 s
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={refetch}
              className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={handleClearAll}
              disabled={clearing || sessions.length === 0}
              className="text-sm px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 disabled:opacity-40 transition-colors"
            >
              {clearing ? "Clearing…" : "Clear all"}
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total sessions", value: sessions.length },
            {
              label: "Citizen",
              value: sessions.filter((s) => s.mode === "citizen").length,
            },
            {
              label: "Anonymous",
              value: sessions.filter((s) => s.mode === "anonymous").length,
            },
            {
              label: "In triage",
              value: sessions.filter((s) => s.stage === "triage_start").length,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-200 px-4 py-3"
            >
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Filter by phone, language, stage…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        {/* Content */}
        {loading && (
          <p className="text-center text-gray-400 py-12">Loading sessions…</p>
        )}
        {error && (
          <p className="text-center text-red-500 py-12">{error}</p>
        )}
        {!loading && filtered.length === 0 && (
          <p className="text-center text-gray-400 py-12">
            No sessions yet. Start a chat to see it here.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((s) => (
            <SessionCard
              key={s.phone}
              session={s}
              onClick={() => onSelectSession(s.phone)}
              onDelete={() => remove(s.phone)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
