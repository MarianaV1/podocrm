"use client";

import { useState, useTransition } from "react";
import { editarPodologa, toggleActivaPodologa } from "@/app/actions/podologas";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const fmtMoneda = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

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
            <Field label="Nombre">
              <Input name="nombre" maxLength={80} defaultValue={podologa.nombre} required />
            </Field>
            <Field label="Comisión %" className="w-24">
              <Input
                name="comisionPct"
                defaultValue={podologa.comisionPct}
                inputMode="numeric"
              />
            </Field>
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
          </form>
        ) : (
          <>
            <div className="min-w-0">
              <span
                className={
                  podologa.activa ? "font-medium" : "text-muted line-through"
                }
              >
                {podologa.nombre}
              </span>
              <Badge tone="primary" className="ml-2">
                {podologa.comisionPct}%
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {!podologa.activa && <Badge tone="neutral">Inactiva</Badge>}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditando(true)}
              >
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggle}
                disabled={pending}
              >
                {podologa.activa ? "Desactivar" : "Activar"}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Totales de comisión (como el Excel: efectivo / T.C. / total) */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span>
          Comisión efectivo:{" "}
          <span className="font-medium text-foreground">
            {fmtMoneda.format(comisiones.efectivo)}
          </span>
        </span>
        <span>
          Comisión T.C.:{" "}
          <span className="font-medium text-foreground">
            {fmtMoneda.format(comisiones.tarjeta)}
          </span>
        </span>
        <span>
          Total:{" "}
          <span className="font-semibold text-foreground">
            {fmtMoneda.format(total)}
          </span>
        </span>
        <span>
          {comisiones.pagos} pago{comisiones.pagos === 1 ? "" : "s"}
        </span>
      </div>
    </li>
  );
}
