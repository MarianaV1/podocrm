import { prisma } from "@/lib/prisma";
import { crearPodologa } from "@/app/actions/podologas";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { PodologaItem } from "./podologa-item";

export default async function PodologasPage() {
  const [podologas, comisiones] = await Promise.all([
    prisma.podologa.findMany({
      orderBy: [{ activa: "desc" }, { nombre: "asc" }],
    }),
    // Comisiones agrupadas por podóloga y método (efectivo / tarjeta).
    prisma.pago.groupBy({
      by: ["podologaId", "metodo"],
      _sum: { comision: true },
      _count: { _all: true },
    }),
  ]);

  // Mapa podologaId → { efectivo, tarjeta, pagos }.
  const porPodologa = new Map<
    string,
    { efectivo: number; tarjeta: number; pagos: number }
  >();
  for (const c of comisiones) {
    if (!c.podologaId) continue;
    const acc = porPodologa.get(c.podologaId) ?? {
      efectivo: 0,
      tarjeta: 0,
      pagos: 0,
    };
    const monto = Number(c._sum.comision ?? 0);
    if (c.metodo === "EFECTIVO") acc.efectivo += monto;
    else acc.tarjeta += monto;
    acc.pagos += c._count._all;
    porPodologa.set(c.podologaId, acc);
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <PageHeader
        title="Podólogas"
        subtitle="Cada podóloga tiene un % de comisión fijo que se aplica a lo que cobra."
      />

      <form
        action={crearPodologa}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4"
      >
        <Field label="Nombre" className="flex-1">
          <Input name="nombre" required placeholder="Nombre de la podóloga" />
        </Field>
        <Field label="Comisión %" className="w-28">
          <Input name="comisionPct" inputMode="numeric" defaultValue={30} />
        </Field>
        <Button type="submit">Agregar</Button>
      </form>

      {podologas.length === 0 ? (
        <EmptyState>Aún no hay podólogas. Agrega la primera arriba.</EmptyState>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface">
          {podologas.map((p) => (
            <PodologaItem
              key={p.id}
              podologa={{
                id: p.id,
                nombre: p.nombre,
                comisionPct: p.comisionPct,
                activa: p.activa,
              }}
              comisiones={
                porPodologa.get(p.id) ?? { efectivo: 0, tarjeta: 0, pagos: 0 }
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}
