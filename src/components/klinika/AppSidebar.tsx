import { Activity, Stethoscope, BarChart3, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export type TabKey = "live" | "clinician" | "impact";

const NAV = [
  { key: "live" as const, label: "Live Cases", icon: Activity },
  { key: "clinician" as const, label: "Clinician View", icon: Stethoscope },
  { key: "impact" as const, label: "Impact", icon: BarChart3 },
];

function NavList({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (k: TabKey) => void;
}) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left",
              isActive
                ? "bg-muted text-foreground font-semibold"
                : "text-muted-foreground font-medium hover:bg-muted/60 hover:text-foreground",
            )}

          >
            <Icon className="h-4.5 w-4.5 shrink-0" strokeWidth={2} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="px-6 py-6 flex items-center gap-2">
      <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
        K
      </div>
      <div>
        <p className="font-semibold text-foreground tracking-tight leading-none">Klinika</p>
      </div>
    </div>
  );
}

interface Props {
  active: TabKey;
  onChange: (k: TabKey) => void;
}

export function AppSidebar({ active, onChange }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMobileChange = (k: TabKey) => {
    onChange(k);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-30 w-[220px] flex-col bg-sidebar border-r border-border">
        <Brand />
        <NavList active={active} onChange={onChange} />
      </aside>

      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-30 h-14 bg-background border-b flex items-center px-3 gap-2">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[260px]">
            <Brand />
            <NavList active={active} onChange={handleMobileChange} />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
            K
          </div>
          <span className="font-semibold text-sm">Klinika</span>
        </div>
      </header>
    </>
  );
}
