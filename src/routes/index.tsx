import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppSidebar, type TabKey } from "@/components/klinika/AppSidebar";
import { LiveCasesTab } from "@/components/klinika/LiveCasesTab";
import { ClinicianTab } from "@/components/klinika/ClinicianTab";
import { ImpactTab } from "@/components/klinika/ImpactTab";
import { useTriageCases } from "@/hooks/useTriageCases";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

function DashboardPage() {
  const [tab, setTab] = useState<TabKey>("clinician");
  const { cases, isLoading, error, updateStatus } = useTriageCases();

  const pendingCount = cases.filter(
    (c) => c.status === "new" || c.status === "escalated",
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar active={tab} onChange={setTab} pendingCount={pendingCount} />
      <main className="md:ml-[220px] p-6 md:p-8 max-w-[1400px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-32 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading cases…
          </div>
        ) : error ? (
          <div className="border border-destructive/30 bg-destructive/5 text-destructive rounded-xl p-4 text-sm">
            Failed to load cases: {error}
          </div>
        ) : (
          <>
            {tab === "live" && <LiveCasesTab cases={cases} updateStatus={updateStatus} />}
            {tab === "clinician" && (
              <ClinicianTab cases={cases} updateStatus={updateStatus} />
            )}
            {tab === "impact" && <ImpactTab cases={cases} />}
          </>
        )}
      </main>
    </div>
  );
}
