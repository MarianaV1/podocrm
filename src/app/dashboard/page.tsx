import Link from "next/link";
import {
  Wallet,
  Banknote,
  CreditCard,
  UserCheck,
  Users,
  FileText,
  ArrowRight,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { hoyMX, rangoDia, fechaLegible } from "@/lib/fecha";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";

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
    <div className="flex flex-col gap-8">
      <PageHeader title="Panel" subtitle={`Sesión iniciada como ${user?.email}`} />

      <section data-tour="resumen-hoy" className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Hoy · {fechaLegible(hoy)}
          </h2>
          <Link
            href="/dashboard/caja"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Ver corte de caja <ArrowRight size={15} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Ingresos"
            value={fmt.format(totalHoy)}
            icon={<Wallet size={18} />}
          />
          <StatCard
            label="Efectivo"
            value={fmt.format(efectivo)}
            icon={<Banknote size={18} />}
          />
          <StatCard
            label="Tarjeta"
            value={fmt.format(tarjeta)}
            icon={<CreditCard size={18} />}
          />
          <StatCard
            label="Atendidos"
            value={String(atendidosHoy)}
            icon={<UserCheck size={18} />}
            info="Citas de hoy marcadas como “Llegó” o “Llegó tarde”."
            infoAlign="end"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/dashboard/pacientes" className="group">
          <Card className="p-5 transition-colors group-hover:border-primary/40">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">Pacientes</p>
              <Users size={18} className="text-muted" />
            </div>
            <p className="mt-1 text-3xl font-semibold">{totalPacientes}</p>
            <p className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary">
              Ver pacientes <ArrowRight size={15} />
            </p>
          </Card>
        </Link>

        <Link href="/dashboard/reporte-salud" className="group">
          <Card className="p-5 transition-colors group-hover:border-primary/40">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">Reporte</p>
              <FileText size={18} className="text-muted" />
            </div>
            <p className="mt-1 text-lg font-semibold">Secretaría de Salud</p>
            <p className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary">
              Ver reporte <ArrowRight size={15} />
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
