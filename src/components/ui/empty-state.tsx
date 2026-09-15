import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function EmptyState({
  icon,
  children,
  className,
}: {
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted",
        className
      )}
    >
      {icon && <span className="text-muted">{icon}</span>}
      {children}
    </div>
  );
}
