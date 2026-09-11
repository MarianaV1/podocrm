"use client";

import { useState, useTransition } from "react";
import {
  editarServicio,
  toggleActivoServicio,
  eliminarServicio,
} from "@/app/actions/servicios";

const fmtMoneda = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

const inputCls =
  "rounded-md border border-black/10 bg-white px-2 py-1 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:bg-zinc-900";
const btnCls =
  "rounded-md border border-black/10 px-3 py-1 text-xs font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10";

export function ServicioItem({
  servicio,
}: {
  servicio: { id: string; nombre: string; precio: number; activo: boolean };
}) {
  const [editando, setEditando] = useState(false);
  const [pending, startTransition] = useTransition();

  function guardar(formData: FormData) {
    startTransition(async () => {
      await editarServicio(servicio.id, formData);
      setEditando(false);
    });
  }

  function toggle() {
    startTransition(() => toggleActivoServicio(servicio.id, !servicio.activo));
  }

  function borrar() {
    if (!confirm(`¿Eliminar el servicio "${servicio.nombre}"?`)) return;
    startTransition(() => eliminarServicio(servicio.id));
  }

  if (editando) {
    return (
      <li className="px-4 py-3">
        <form action={guardar} className="flex flex-wrap items-end gap-2">
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-xs text-zinc-500">Nombre</span>
            <input
              name="nombre"
              defaultValue={servicio.nombre}
              required
              className={inputCls}
            />
          </label>
          <label className="flex w-28 flex-col gap-1">
            <span className="text-xs text-zinc-500">Precio</span>
            <input
              name="precio"
              defaultValue={servicio.precio}
              inputMode="decimal"
              required
              className={inputCls}
            />
          </label>
          <div className="flex gap-2">
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
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
      <div className="min-w-0">
        <p
          className={
            servicio.activo ? "font-medium" : "text-zinc-400 line-through"
          }
        >
          {servicio.nombre}
        </p>
        <p className="text-xs text-zinc-500">
          {fmtMoneda.format(servicio.precio)}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {!servicio.activo && (
          <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            Inactivo
          </span>
        )}
        <button onClick={() => setEditando(true)} className={btnCls}>
          Editar
        </button>
        <button onClick={toggle} disabled={pending} className={btnCls}>
          {servicio.activo ? "Desactivar" : "Activar"}
        </button>
        <button
          onClick={borrar}
          disabled={pending}
          className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10"
        >
          Eliminar
        </button>
      </div>
    </li>
  );
}
