import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-700 to-emerald-900 flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-white text-center">
        <div className="text-7xl mb-5">🏥</div>
        <h1 className="text-5xl font-bold mb-3 tracking-tight">JagaKL</h1>
        <p className="text-emerald-200 text-xl mb-2 font-medium">
          Free AI health guide for everyone in KL
        </p>
        <p className="text-emerald-300 text-sm mb-10">
          Migrants · Refugees · B40 · Elderly · No IC required
        </p>

        {/* Feature tiles */}
        <div className="grid grid-cols-3 gap-3 mb-10 max-w-sm w-full">
          {[
            { icon: "🦟", label: "Dengue triage" },
            { icon: "🫁", label: "TB screen" },
            { icon: "💊", label: "Medication help" },
            { icon: "🧠", label: "Mental health" },
            { icon: "🩺", label: "NGO routing" },
            { icon: "🔒", label: "Anonymous safe" },
          ].map((f) => (
            <div
              key={f.label}
              className="bg-white/10 hover:bg-white/20 transition-colors rounded-2xl p-3 flex flex-col items-center gap-1"
            >
              <span className="text-2xl">{f.icon}</span>
              <span className="text-xs text-emerald-100 font-medium leading-tight">
                {f.label}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          to="/chat"
          className="bg-white text-emerald-800 font-bold px-10 py-4 rounded-2xl text-lg hover:bg-emerald-50 active:scale-95 transition-all shadow-lg shadow-emerald-900/40"
        >
          Start chat — it's free
        </Link>
        <p className="text-emerald-400 text-xs mt-4">
          No app install · No IC · No registration
        </p>
      </div>

      {/* Stats strip */}
      <div className="bg-emerald-800/60 backdrop-blur border-t border-emerald-600/40 px-6 py-5">
        <div className="max-w-lg mx-auto grid grid-cols-3 gap-4 text-center text-white">
          {[
            { stat: "3M+", label: "Migrant workers in Malaysia" },
            { stat: "122K", label: "Dengue cases in 2024" },
            { stat: "91", label: "Klinik over capacity" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-bold">{s.stat}</p>
              <p className="text-xs text-emerald-300 mt-0.5 leading-snug">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer nav */}
      <div className="bg-emerald-900 px-6 py-3 flex justify-center gap-6 text-xs text-emerald-400">
        <Link to="/chat" className="hover:text-white transition-colors">
          Chat
        </Link>
        <Link to="/dashboard" className="hover:text-white transition-colors">
          Dashboard
        </Link>
      </div>
    </div>
  );
}
