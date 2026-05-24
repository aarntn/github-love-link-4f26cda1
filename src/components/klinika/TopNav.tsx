import { Activity } from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

export function TopNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <p className="text-base font-semibold tracking-tight">Klinika</p>
            <p className="text-xs text-muted-foreground">
              Clinician copilot · Kuala Lumpur
            </p>
          </div>
        </div>

        <TabsList className="h-10 gap-1 bg-secondary p-1">
          <TabsTrigger value="live" className="px-4">
            Live Cases
          </TabsTrigger>
          <TabsTrigger value="clinician" className="px-4">
            Clinician View
          </TabsTrigger>
          <TabsTrigger value="impact" className="px-4">
            Impact
          </TabsTrigger>
        </TabsList>

        <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          Realtime
        </div>
      </div>
    </header>
  );
}
