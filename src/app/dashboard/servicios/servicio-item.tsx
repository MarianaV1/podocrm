"use client";

import { useState, useTransition } from "react";
import {
  editarServicio,
  toggleActivoServicio,
  eliminarServicio,
} from "@/app/actions/servicios";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const fmtMoneda = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

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
          <Field label="Nombre" className="flex-1">
            <Input name="nombre" maxLength={80} defaultValue={servicio.nombre} required />
          </Field>
          <Field label="Precio" className="w-28">
            <Input
              name="precio"
              defaultValue={servicio.precio}
              inputMode="decimal"
              required
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
        <p className={servicio.activo ? "font-medium" : "text-muted line-through"}>
          {servicio.nombre}
        </p>
        <p className="text-xs text-muted">{fmtMoneda.format(servicio.precio)}</p>
      </div>
      <div className="flex items-center gap-2">
        {!servicio.activo && <Badge tone="neutral">Inactivo</Badge>}
        <Button variant="outline" size="sm" onClick={() => setEditando(true)}>
          Editar
        </Button>
        <Button variant="outline" size="sm" onClick={toggle} disabled={pending}>
          {servicio.activo ? "Desactivar" : "Activar"}
        </Button>
        <Button variant="danger" size="sm" onClick={borrar} disabled={pending}>
          Eliminar
        </Button>
      </div>
    </li>
  );
}
