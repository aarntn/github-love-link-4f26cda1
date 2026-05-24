import { cn } from "@/lib/utils";

interface CardShellProps {
  label: string;
  meta?: React.ReactNode;
  dotClassName?: string;
  className?: string;
  contentClassName?: string;
  onClick?: () => void;
  children: React.ReactNode;
}

export function CardShell({
  label,
  meta,
  dotClassName = "bg-primary",
  className,
  contentClassName,
  onClick,
  children,
}: CardShellProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-card rounded-3xl border border-border/70 overflow-hidden transition-colors",
        onClick && "cursor-pointer hover:border-foreground/20",
        className,
      )}
    >
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", dotClassName)} />
          <span className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            {label}
          </span>
        </div>
        {meta && (
          <span className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            {meta}
          </span>
        )}
      </div>
      <div className={cn("border-t border-border/60 px-5 py-5", contentClassName)}>
        {children}
      </div>
    </div>
  );
}
