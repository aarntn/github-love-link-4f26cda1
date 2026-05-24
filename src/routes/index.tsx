import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { TopNav } from "@/components/klinika/TopNav";
import { LiveCasesTab } from "@/components/klinika/LiveCasesTab";
import { ClinicianTab } from "@/components/klinika/ClinicianTab";
import { ImpactTab } from "@/components/klinika/ImpactTab";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Klinika — Clinician Copilot for AI Triage in Kuala Lumpur" },
      {
        name: "description",
        content:
          "Klinika is a clinician copilot for healthcare workers in Kuala Lumpur, monitoring AI-triaged patient cases in real time.",
      },
      { property: "og:title", content: "Klinika — Clinician Copilot" },
      {
        property: "og:description",
        content:
          "Real-time triage dashboard for clinicians: live cases, action queue, and impact stats.",
      },
    ],
  }),
  component: KlinikaDashboard,
});

function KlinikaDashboard() {
  const [tab, setTab] = useState("live");

  return (
    <div className="min-h-screen bg-background">
      <Tabs value={tab} onValueChange={setTab} className="flex min-h-screen flex-col">
        <TopNav />
        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-6">
          <h1 className="sr-only">Klinika clinician dashboard</h1>
          <TabsContent value="live" className="mt-0">
            <LiveCasesTab />
          </TabsContent>
          <TabsContent value="clinician" className="mt-0">
            <ClinicianTab />
          </TabsContent>
          <TabsContent value="impact" className="mt-0">
            <ImpactTab />
          </TabsContent>
        </main>
      </Tabs>
      <Toaster position="top-right" richColors />
    </div>
  );
}
