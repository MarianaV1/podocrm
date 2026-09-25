import type { ComponentProps, ReactNode } from "react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/cn";
import { InfoTip } from "./info-tip";

// Cambio contra el periodo anterior. `tono` dice si el cambio es bueno o malo
// para el negocio (no siempre "subir" es bueno); el ícono marca la dirección.
export type Delta = {
  texto: string;
  direccion: "sube" | "baja" | "igual";
  tono: "bueno" | "malo" | "neutro";
};

export function StatCard({
  label,
  value,
  icon,
  hint,
  info,
  infoAlign = "start",
  delta,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: ReactNode;
  info?: string;
  infoAlign?: ComponentProps<typeof InfoTip>["align"];
  delta?: Delta;
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
      {delta && <DeltaTexto delta={delta} />}
    </div>
  );
}

function DeltaTexto({ delta }: { delta: Delta }) {
  const Icono =
    delta.direccion === "sube" ? TrendingUp : delta.direccion === "baja" ? TrendingDown : Minus;
  return (
    <p
      className={cn(
        "mt-1 flex items-center gap-1 text-xs",
        delta.tono === "bueno" && "text-emerald-700 dark:text-emerald-400",
        delta.tono === "malo" && "text-red-700 dark:text-red-400",
        delta.tono === "neutro" && "text-muted"
      )}
    >
      <Icono size={14} aria-hidden />
      {delta.texto}
    </p>
  );
}
