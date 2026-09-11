"use client";

import { useState, useTransition } from "react";
import {
  editarProducto,
  toggleActivoProducto,
  eliminarProducto,
} from "@/app/actions/productos";

const fmtMoneda = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

const inputCls =
  "rounded-md border border-black/10 bg-white px-2 py-1 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:bg-zinc-900";
const btnCls =
  "rounded-md border border-black/10 px-3 py-1 text-xs font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10";

export function ProductoItem({
  producto,
}: {
  producto: {
    id: string;
    nombre: string;
    precioVenta: number;
    costo: number;
    stock: number;
    activo: boolean;
  };
}) {
  const [editando, setEditando] = useState(false);
  const [pending, startTransition] = useTransition();
  const utilidad = producto.precioVenta - producto.costo;

  function guardar(formData: FormData) {
    startTransition(async () => {
      await editarProducto(producto.id, formData);
      setEditando(false);
    });
  }

  function toggle() {
    startTransition(() => toggleActivoProducto(producto.id, !producto.activo));
  }

  function borrar() {
    if (!confirm(`¿Eliminar el producto "${producto.nombre}"?`)) return;
    startTransition(() => eliminarProducto(producto.id));
  }

  if (editando) {
    return (
      <li className="px-4 py-3">
        <form action={guardar} className="flex flex-wrap items-end gap-2">
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-xs text-zinc-500">Nombre</span>
            <input
              name="nombre"
              defaultValue={producto.nombre}
              required
              className={inputCls}
            />
          </label>
          <label className="flex w-24 flex-col gap-1">
            <span className="text-xs text-zinc-500">Precio venta</span>
            <input
              name="precioVenta"
              defaultValue={producto.precioVenta}
              inputMode="decimal"
              required
              className={inputCls}
            />
          </label>
          <label className="flex w-24 flex-col gap-1">
            <span className="text-xs text-zinc-500">Costo</span>
            <input
              name="costo"
              defaultValue={producto.costo}
              inputMode="decimal"
              className={inputCls}
            />
          </label>
          <label className="flex w-20 flex-col gap-1">
            <span className="text-xs text-zinc-500">Stock</span>
            <input
              name="stock"
              defaultValue={producto.stock}
              inputMode="numeric"
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
            producto.activo ? "font-medium" : "text-zinc-400 line-through"
          }
        >
          {producto.nombre}
        </p>
        <p className="text-xs text-zinc-500">
          Venta {fmtMoneda.format(producto.precioVenta)} · Costo{" "}
          {fmtMoneda.format(producto.costo)} · Utilidad{" "}
          <span className="font-medium text-green-700 dark:text-green-400">
            {fmtMoneda.format(utilidad)}
          </span>
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`rounded px-2 py-0.5 text-xs font-medium ${
            producto.stock <= 0
              ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
              : producto.stock <= 3
                ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
          }`}
          title="Existencias en inventario"
        >
          {producto.stock} en stock
        </span>
        {!producto.activo && (
          <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            Inactivo
          </span>
        )}
        <button onClick={() => setEditando(true)} className={btnCls}>
          Editar
        </button>
        <button onClick={toggle} disabled={pending} className={btnCls}>
          {producto.activo ? "Desactivar" : "Activar"}
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
