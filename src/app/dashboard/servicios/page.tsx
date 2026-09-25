import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { crearServicio } from "@/app/actions/servicios";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { ServicioItem } from "./servicio-item";

export const metadata: Metadata = { title: "Servicios" };

export default async function ServiciosPage() {
  const servicios = await prisma.servicio.findMany({
    orderBy: [{ activo: "desc" }, { nombre: "asc" }],
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <PageHeader
        title="Servicios"
        subtitle="Lo que realizan las podólogas (Consulta, uñas, etc.). Generan comisión según el % de cada podóloga."
      />

      <form
        action={crearServicio}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4"
      >
        <Field label="Nombre" className="flex-1">
          <Input name="nombre" required placeholder="Consulta, uñas, etc." />
        </Field>
        <Field label="Precio" className="w-28">
          <Input name="precio" required inputMode="decimal" placeholder="380" />
        </Field>
        <Button type="submit">Agregar</Button>
      </form>

      {servicios.length === 0 ? (
        <EmptyState>Aún no hay servicios. Agrega el primero arriba.</EmptyState>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface">
          {servicios.map((s) => (
            <ServicioItem
              key={s.id}
              servicio={{
                id: s.id,
                nombre: s.nombre,
                precio: Number(s.precio),
                activo: s.activo,
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
