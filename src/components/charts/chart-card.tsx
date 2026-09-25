"use client";

import { useState, type ReactNode } from "react";
import { ChartColumn, Table2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

// Tarjeta de gráfica con su versión en tabla (la alternativa accesible:
// todos los valores se pueden leer sin depender del color ni del hover).
export function ChartCard({
  titulo,
  resumen,
  grafica,
  tabla,
  tour,
}: {
  titulo: string;
  resumen?: ReactNode;
  grafica: ReactNode;
  tabla: ReactNode;
  tour?: string;
}) {
  const [verTabla, setVerTabla] = useState(false);

  return (
    <Card data-tour={tour} className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{titulo}</h3>
          {resumen && <div className="mt-0.5 text-xs text-muted">{resumen}</div>}
        </div>
        <button
          type="button"
          onClick={() => setVerTabla((v) => !v)}
          aria-pressed={verTabla}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
        >
          {verTabla ? <ChartColumn size={14} /> : <Table2 size={14} />}
          {verTabla ? "Ver gráfica" : "Ver tabla"}
        </button>
      </div>
      {verTabla ? <div className="overflow-x-auto">{tabla}</div> : grafica}
    </Card>
  );
}

// Tabla compacta para la vista alternativa de las gráficas.
export function TablaDatos({
  columnas,
  filas,
}: {
  columnas: string[];
  filas: (string | number)[][];
}) {
  return (
    <table className="w-full text-left text-sm">
      <thead className="text-xs uppercase tracking-wide text-muted">
        <tr>
          {columnas.map((c, i) => (
            <th key={c} className={cn("pb-2 font-medium", i > 0 && "text-right")}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {filas.map((f, i) => (
          <tr key={i}>
            {f.map((v, j) => (
              <td key={j} className={cn("py-1.5", j > 0 && "text-right tabular-nums")}>
                {v}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
