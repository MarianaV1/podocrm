import { prisma } from "@/lib/prisma";
import { crearPodologa } from "@/app/actions/podologas";
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
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Podólogas</h1>
        <p className="text-sm text-zinc-500">
          Cada podóloga tiene un % de comisión fijo que se aplica a lo que cobra.
        </p>
      </div>

      <form
        action={crearPodologa}
        className="flex flex-wrap items-end gap-2 rounded-lg border border-black/10 p-4 dark:border-white/10"
      >
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-xs text-zinc-500">Nombre</span>
          <input
            name="nombre"
            required
            placeholder="Nombre de la podóloga"
            className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:bg-zinc-900"
          />
        </label>
        <label className="flex w-28 flex-col gap-1">
          <span className="text-xs text-zinc-500">Comisión %</span>
          <input
            name="comisionPct"
            inputMode="numeric"
            defaultValue={30}
            className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:bg-zinc-900"
          />
        </label>
        <button className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">
          Agregar
        </button>
      </form>

      {podologas.length === 0 ? (
        <p className="rounded-md border border-dashed border-black/15 p-8 text-center text-sm text-zinc-500 dark:border-white/15">
          Aún no hay podólogas. Agrega la primera arriba.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-black/5 rounded-lg border border-black/10 dark:divide-white/10 dark:border-white/10">
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
