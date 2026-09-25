import { Check, Clock, X } from "lucide-react";
import { cn } from "@/lib/cn";

// Barras horizontales de una sola serie, con el valor y el detalle visibles
// (no dependen del hover). La barra crece desde la izquierda.
export function GraficaBarras({
  filas,
}: {
  filas: { id: string; nombre: string; valor: number; valorTexto: string; detalle: string }[];
}) {
  const max = Math.max(0, ...filas.map((f) => f.valor));
  if (filas.length === 0) {
    return <p className="text-sm text-muted">Sin datos en este periodo.</p>;
  }
  return (
    <ul className="flex flex-col gap-4">
      {filas.map((f) => (
        <li key={f.id}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{f.nombre}</span>
            <span className="shrink-0 font-medium tabular-nums">{f.valorTexto}</span>
          </div>
          <div
            aria-hidden
            className="mt-1.5 h-2 rounded-r-[4px] bg-chart-1"
            style={{ width: `${max > 0 ? Math.max((f.valor / max) * 100, 1) : 0}%` }}
          />
          <p className="mt-1 text-xs text-muted">{f.detalle}</p>
        </li>
      ))}
    </ul>
  );
}

const ESTADOS = [
  { clave: "llego", label: "Llegó", icono: Check, color: "bg-status-good" },
  { clave: "tarde", label: "Llegó tarde", icono: Clock, color: "bg-status-warning" },
  { clave: "noVino", label: "No vino", icono: X, color: "bg-status-critical" },
] as const;

// Reparto de asistencia (parte de un todo) en una barra apilada. Cada estado
// lleva ícono, nombre, cantidad y %: el color nunca va solo.
export function BarraAsistencia({
  conteo,
}: {
  conteo: { llego: number; tarde: number; noVino: number };
}) {
  const total = conteo.llego + conteo.tarde + conteo.noVino;
  if (total === 0) {
    return <p className="text-sm text-muted">Sin citas en este periodo.</p>;
  }
  const pct = (n: number) => Math.round((n / total) * 100);
  const visibles = ESTADOS.filter((e) => conteo[e.clave] > 0);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-3xl font-semibold tracking-tight">
          {pct(conteo.llego + conteo.tarde)}%
        </p>
        <p className="text-xs text-muted">de {total} citas se atendieron</p>
      </div>

      <div aria-hidden className="flex h-3 gap-[2px]">
        {visibles.map((e, i) => (
          <div
            key={e.clave}
            className={cn(
              e.color,
              i === 0 && "rounded-l-[4px]",
              i === visibles.length - 1 && "rounded-r-[4px]"
            )}
            style={{ width: `${(conteo[e.clave] / total) * 100}%` }}
          />
        ))}
      </div>

      <ul className="flex flex-col gap-2 text-sm">
        {ESTADOS.map((e) => {
          const Icono = e.icono;
          return (
            <li key={e.clave} className="flex items-center gap-2">
              <span className={cn("h-2.5 w-2.5 shrink-0 rounded-sm", e.color)} aria-hidden />
              <Icono size={14} className="text-muted" aria-hidden />
              <span className="flex-1">{e.label}</span>
              <span className="tabular-nums text-muted">{conteo[e.clave]}</span>
              <span className="w-10 text-right font-medium tabular-nums">
                {pct(conteo[e.clave])}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
