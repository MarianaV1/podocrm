"use client";

import { useState, useTransition } from "react";
import { editarPodologa, toggleActivaPodologa } from "@/app/actions/podologas";

const fmtMoneda = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

const inputCls =
  "rounded-md border border-black/10 bg-white px-2 py-1 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:bg-zinc-900";
const btnCls =
  "rounded-md border border-black/10 px-3 py-1 text-xs font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10";

export function PodologaItem({
  podologa,
  comisiones,
}: {
  podologa: {
    id: string;
    nombre: string;
    comisionPct: number;
    activa: boolean;
  };
  comisiones: { efectivo: number; tarjeta: number; pagos: number };
}) {
  const [editando, setEditando] = useState(false);
  const [pending, startTransition] = useTransition();
  const total = comisiones.efectivo + comisiones.tarjeta;

  function guardar(formData: FormData) {
    startTransition(async () => {
      await editarPodologa(podologa.id, formData);
      setEditando(false);
    });
  }

  function toggle() {
    startTransition(() => toggleActivaPodologa(podologa.id, !podologa.activa));
  }

  return (
    <li className="flex flex-col gap-2 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {editando ? (
          <form action={guardar} className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-zinc-500">Nombre</span>
              <input
                name="nombre"
                defaultValue={podologa.nombre}
                required
                className={inputCls}
              />
            </label>
            <label className="flex w-24 flex-col gap-1">
              <span className="text-xs text-zinc-500">Comisión %</span>
              <input
                name="comisionPct"
                defaultValue={podologa.comisionPct}
                inputMode="numeric"
                className={inputCls}
              />
            </label>
            <button
              disabled={pending}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {pending ? "Guardando…" : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setEditando(false)}
              disabled={pending}
              className={btnCls}
            >
              Cancelar
            </button>
          </form>
        ) : (
          <>
            <div className="min-w-0">
              <span
                className={
                  podologa.activa ? "font-medium" : "text-zinc-400 line-through"
                }
              >
                {podologa.nombre}
              </span>
              <span className="ml-2 rounded bg-black/5 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                comisión {podologa.comisionPct}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              {!podologa.activa && (
                <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  Inactiva
                </span>
              )}
              <button onClick={() => setEditando(true)} className={btnCls}>
                Editar
              </button>
              <button onClick={toggle} disabled={pending} className={btnCls}>
                {podologa.activa ? "Desactivar" : "Activar"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Totales de comisión (como el Excel: efectivo / T.C. / total) */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
        <span>
          Comisión efectivo:{" "}
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            {fmtMoneda.format(comisiones.efectivo)}
          </span>
        </span>
        <span>
          Comisión T.C.:{" "}
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            {fmtMoneda.format(comisiones.tarjeta)}
          </span>
        </span>
        <span>
          Total:{" "}
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
            {fmtMoneda.format(total)}
          </span>
        </span>
        <span className="text-zinc-400">
          {comisiones.pagos} pago{comisiones.pagos === 1 ? "" : "s"}
        </span>
      </div>
    </li>
  );
}
