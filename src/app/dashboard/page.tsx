import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { hoyMX, rangoDia, fechaLegible } from "@/lib/fecha";

const fmt = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hoy = hoyMX();
  const { inicio, fin } = rangoDia(hoy);

  const [totalPacientes, pagosHoy, atendidosHoy] = await Promise.all([
    prisma.paciente.count(),
    prisma.pago.findMany({
      where: { fecha: { gte: inicio, lt: fin } },
      select: { monto: true, metodo: true },
    }),
    prisma.cita.count({
      where: {
        inicio: { gte: inicio, lt: fin },
        estado: { in: ["LLEGO", "LLEGO_TARDE"] },
      },
    }),
  ]);

  let efectivo = 0;
  let tarjeta = 0;
  for (const p of pagosHoy) {
    if (p.metodo === "EFECTIVO") efectivo += Number(p.monto);
    else tarjeta += Number(p.monto);
  }
  const totalHoy = efectivo + tarjeta;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Panel</h1>
        <p className="text-sm text-zinc-500">
          Sesión iniciada como {user?.email}
        </p>
      </div>

      {/* Resumen de hoy */}
      <section className="rounded-lg border border-black/10 p-5 dark:border-white/10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Hoy · {fechaLegible(hoy)}
          </h2>
          <Link
            href="/dashboard/caja"
            className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Ver corte de caja →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Mini titulo="Ingresos" valor={fmt.format(totalHoy)} />
          <Mini titulo="Efectivo" valor={fmt.format(efectivo)} />
          <Mini titulo="Tarjeta" valor={fmt.format(tarjeta)} />
          <Mini titulo="Pacientes atendidos" valor={String(atendidosHoy)} />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/dashboard/pacientes"
          className="rounded-lg border border-black/10 p-5 transition-colors hover:bg-black/[.02] dark:border-white/10 dark:hover:bg-white/[.03]"
        >
          <p className="text-sm text-zinc-500">Pacientes</p>
          <p className="mt-1 text-3xl font-semibold">{totalPacientes}</p>
          <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
            Ver pacientes →
          </p>
        </Link>

        <Link
          href="/dashboard/reporte-salud"
          className="rounded-lg border border-black/10 p-5 transition-colors hover:bg-black/[.02] dark:border-white/10 dark:hover:bg-white/[.03]"
        >
          <p className="text-sm text-zinc-500">Reporte</p>
          <p className="mt-1 text-lg font-semibold">Secretaría de Salud</p>
          <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
            Ver reporte →
          </p>
        </Link>
      </div>
    </div>
  );
}

function Mini({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-zinc-400">{titulo}</p>
      <p className="mt-0.5 text-xl font-semibold">{valor}</p>
    </div>
  );
}
