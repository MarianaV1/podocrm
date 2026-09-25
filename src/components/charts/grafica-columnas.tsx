"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export type Columna = {
  clave: string;
  etiqueta: string; // eje X
  detalle: string; // encabezado del tooltip
  valor: number;
  valorTexto: string;
  filas: { label: string; valor: string }[]; // desglose en el tooltip
};

const ALTO = 200;

// Escala "bonita": el tope del eje es un múltiplo limpio (1, 2, 2.5, 5 × 10^n).
function escala(max: number, marcas = 4) {
  if (max <= 0) return { tope: 1, ticks: [0, 1] };
  const crudo = max / marcas;
  const pot = Math.pow(10, Math.floor(Math.log10(crudo)));
  const paso = [1, 2, 2.5, 5, 10].map((m) => m * pot).find((p) => p >= crudo)!;
  const tope = paso * Math.ceil(max / paso);
  const ticks = Array.from({ length: Math.round(tope / paso) + 1 }, (_, i) => i * paso);
  return { tope, ticks };
}

function tickMoneda(v: number) {
  if (v >= 1000) {
    return `$${(v / 1000).toLocaleString("es-MX", { maximumFractionDigits: 1 })}k`;
  }
  return `$${v.toLocaleString("es-MX")}`;
}

// Gráfica de columnas de una sola serie. Cada columna es su propia zona de
// hover/foco (toda la altura, no solo la barra) y muestra el desglose.
export function GraficaColumnas({
  columnas,
  descripcion,
}: {
  columnas: Columna[];
  descripcion: string;
}) {
  const [activa, setActiva] = useState<number | null>(null);
  const max = Math.max(0, ...columnas.map((c) => c.valor));
  const { tope, ticks } = escala(max);
  const iMax = columnas.findIndex((c) => c.valor === max && max > 0);
  // Etiquetas del eje X sin encimarse: como máximo ~8.
  const cadaCuanto = Math.ceil(columnas.length / 8);
  const n = columnas.length;

  const c = activa !== null ? columnas[activa] : null;
  // El tooltip va al lado de la columna (nunca encima de ella): a la derecha
  // en la primera mitad, a la izquierda en la segunda.
  const posicion =
    activa === null
      ? {}
      : activa < n / 2
        ? { left: `calc(${((activa + 1) / n) * 100}% + 4px)` }
        : { right: `calc(${((n - activa) / n) * 100}% + 4px)` };

  return (
    <figure aria-label={descripcion} className="m-0">
      <div className="flex">
        {/* Eje Y */}
        <div className="relative w-12 shrink-0" style={{ height: ALTO }} aria-hidden>
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute right-2 translate-y-1/2 text-[11px] tabular-nums text-muted"
              style={{ bottom: `${(t / tope) * 100}%` }}
            >
              {tickMoneda(t)}
            </span>
          ))}
        </div>

        {/* Área de trazado */}
        <div className="relative flex-1" style={{ height: ALTO }} onMouseLeave={() => setActiva(null)}>
          {ticks.map((t) => (
            <div
              key={t}
              aria-hidden
              className={cn("absolute inset-x-0 border-t", t === 0 ? "border-muted/40" : "border-border")}
              style={{ bottom: `${(t / tope) * 100}%` }}
            />
          ))}

          <div className="absolute inset-0 flex items-end">
            {columnas.map((col, i) => (
              <div
                key={col.clave}
                tabIndex={0}
                aria-label={`${col.detalle}: ${col.valorTexto}`}
                onMouseEnter={() => setActiva(i)}
                onFocus={() => setActiva(i)}
                onBlur={() => setActiva(null)}
                className={cn(
                  "relative flex h-full min-w-0 flex-1 flex-col items-center justify-end rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  activa === i && "bg-surface-2/70"
                )}
              >
                {i === iMax && (
                  <span
                    className="absolute whitespace-nowrap text-[11px] font-medium tabular-nums text-foreground"
                    style={{ bottom: `calc(${(col.valor / tope) * 100}% + 4px)` }}
                  >
                    {tickMoneda(Math.round(col.valor))}
                  </span>
                )}
                <div
                  className={cn(
                    "w-[70%] max-w-6 shrink-0 rounded-t-[4px] bg-chart-1 transition-[filter]",
                    activa === i && "brightness-110"
                  )}
                  style={{ height: `${(col.valor / tope) * 100}%` }}
                />
              </div>
            ))}
          </div>

          {c && (
            <div
              role="status"
              className="pointer-events-none absolute top-0 z-10 w-max max-w-56 rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-lg"
              style={posicion}
            >
              <p className="text-muted first-letter:uppercase">{c.detalle}</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums">{c.valorTexto}</p>
              {c.filas.map((f) => (
                <p key={f.label} className="mt-0.5 flex justify-between gap-4 text-muted">
                  <span>{f.label}</span>
                  <span className="tabular-nums text-foreground">{f.valor}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Eje X */}
      <div className="ml-12 mt-2 flex" aria-hidden>
        {columnas.map((col, i) => (
          <span key={col.clave} className="min-w-0 flex-1 text-center text-[11px] text-muted">
            {i % cadaCuanto === 0 ? (
              // En pantallas chicas solo una de cada dos, para que no se encimen.
              <span
                className={cn(
                  "whitespace-nowrap",
                  n > 4 && (i / cadaCuanto) % 2 === 1 && "hidden sm:inline"
                )}
              >
                {col.etiqueta}
              </span>
            ) : null}
          </span>
        ))}
      </div>
    </figure>
  );
}
