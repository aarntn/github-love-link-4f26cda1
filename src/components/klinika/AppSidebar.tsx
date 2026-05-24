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

function BrandIcon({ className }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <g clipPath="url(#clip0_31181_2788)">
        <path
          d="M10.0243 2.98951C9.91384 2.79815 9.66917 2.73259 9.47783 2.84307L6.99979 4.27401V1.41251C6.99979 1.1916 6.82071 1.01251 6.59979 1.01251H5.39979C5.17888 1.01251 4.99979 1.1916 4.99979 1.41251V4.27401L2.52175 2.84307C2.33042 2.73259 2.08574 2.79815 1.97529 2.98951L1.37523 4.02912C1.2648 4.22044 1.33036 4.46504 1.52166 4.57549L3.99929 6.00601L1.52166 7.43653C1.33036 7.54698 1.2648 7.79159 1.37523 7.9829L1.97532 9.02256C2.08576 9.2139 2.3304 9.27947 2.52173 9.16902L4.99979 7.73851V10.6C4.99979 10.8209 5.17888 11 5.39979 11H6.59979C6.82071 11 6.99979 10.8209 6.99979 10.6V7.73851L9.47785 9.16902C9.66918 9.27947 9.91383 9.2139 10.0243 9.02256L10.6244 7.9829C10.7348 7.79159 10.6692 7.54698 10.4779 7.43653L8.00029 6.00601L10.4779 4.57549C10.6692 4.46504 10.7348 4.22044 10.6244 4.02912L10.0243 2.98951Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_31181_2788">
          <rect width="12" height="12" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

function Brand() {
  return (
    <div className="px-6 py-6 flex items-center gap-2">
      <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
        <BrandIcon className="h-4 w-4" />
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
