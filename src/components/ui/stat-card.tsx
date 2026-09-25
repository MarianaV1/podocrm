import type { ComponentProps, ReactNode } from "react";
import { InfoTip } from "./info-tip";

export function StatCard({
  label,
  value,
  icon,
  hint,
  info,
  infoAlign = "start",
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: ReactNode;
  info?: string;
  infoAlign?: ComponentProps<typeof InfoTip>["align"];
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
          {label}
          {info && <InfoTip texto={info} align={infoAlign} />}
        </p>
        {icon && <span className="text-primary">{icon}</span>}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}
