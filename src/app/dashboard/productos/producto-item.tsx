"use client";

import { useState, useTransition } from "react";
import {
  editarProducto,
  toggleActivoProducto,
  eliminarProducto,
} from "@/app/actions/productos";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const fmtMoneda = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

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
          <Field label="Nombre" className="flex-1">
            <Input name="nombre" maxLength={80} defaultValue={producto.nombre} required />
          </Field>
          <Field label="Precio venta" className="w-24">
            <Input
              name="precioVenta"
              defaultValue={producto.precioVenta}
              inputMode="decimal"
              required
            />
          </Field>
          <Field label="Costo" className="w-24">
            <Input
              name="costo"
              defaultValue={producto.costo}
              inputMode="decimal"
            />
          </Field>
          <Field label="Stock" className="w-20">
            <Input
              name="stock"
              defaultValue={producto.stock}
              inputMode="numeric"
            />
          </Field>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Guardando…" : "Guardar"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditando(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
      <div className="min-w-0">
        <p className={producto.activo ? "font-medium" : "text-muted line-through"}>
          {producto.nombre}
        </p>
        <p className="text-xs text-muted">
          Venta {fmtMoneda.format(producto.precioVenta)} · Costo{" "}
          {fmtMoneda.format(producto.costo)} · Utilidad{" "}
          <span className="font-medium text-emerald-700 dark:text-emerald-400">
            {fmtMoneda.format(utilidad)}
          </span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge
          tone={
            producto.stock <= 0
              ? "danger"
              : producto.stock <= 3
                ? "warning"
                : "neutral"
          }
        >
          {producto.stock} en stock
        </Badge>
        {!producto.activo && <Badge tone="neutral">Inactivo</Badge>}
        <Button variant="outline" size="sm" onClick={() => setEditando(true)}>
          Editar
        </Button>
        <Button variant="outline" size="sm" onClick={toggle} disabled={pending}>
          {producto.activo ? "Desactivar" : "Activar"}
        </Button>
        <Button variant="danger" size="sm" onClick={borrar} disabled={pending}>
          Eliminar
        </Button>
      </div>
    </li>
  );
}
