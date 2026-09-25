import type { Metadata } from "next";
import Link from "next/link";
import {
  Wallet,
  Banknote,
  CreditCard,
  UserCheck,
  Users,
  FileText,
  ArrowRight,
  Receipt,
  CalendarCheck,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { hoyMX, rangoDia, fechaLegible } from "@/lib/fecha";
import { PERIODOS, leerPeriodo, obtenerEstadisticas, type Periodo } from "@/lib/estadisticas";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard, type Delta } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { ChartCard, TablaDatos } from "@/components/charts/chart-card";
import { GraficaColumnas } from "@/components/charts/grafica-columnas";
import { BarraAsistencia, GraficaBarras } from "@/components/charts/graficas-simples";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Panel" };

const fmt = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});
// Totales de periodo: sin centavos, se leen más rápido.
const fmt0 = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

// Cambio en % contra el periodo anterior (o en puntos, para tasas).
function delta(cambio: number | null, enPuntos = false): Delta | undefined {
  if (cambio === null) return undefined;
  const n = Math.round(cambio * (enPuntos ? 1000 : 100)) / (enPuntos ? 10 : 1);
  if (n === 0) return { texto: "Igual que el periodo anterior", direccion: "igual", tono: "neutro" };
  const signo = n > 0 ? "+" : "−";
  const valor = `${Math.abs(n).toLocaleString("es-MX")}${enPuntos ? " pts" : "%"}`;
  return {
    texto: `${signo}${valor} vs periodo anterior`,
    direccion: n > 0 ? "sube" : "baja",
    tono: n > 0 ? "bueno" : "malo",
  };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const periodo = leerPeriodo((await searchParams).periodo);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hoy = hoyMX();
  const { inicio, fin } = rangoDia(hoy);

  const [totalPacientes, pagosHoy, atendidosHoy, stats] = await Promise.all([
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
    obtenerEstadisticas(periodo),
  ]);

  let efectivo = 0;
  let tarjeta = 0;
  for (const p of pagosHoy) {
    if (p.metodo === "EFECTIVO") efectivo += Number(p.monto);
    else tarjeta += Number(p.monto);
  }
  const totalHoy = efectivo + tarjeta;

  const { kpis, buckets } = stats;
  const conIngresos = buckets.filter((b) => b.total > 0);
  const mejor = conIngresos.reduce<(typeof buckets)[number] | null>(
    (m, b) => (!m || b.total > m.total ? b : m),
    null
  );
  const unidad = stats.semanal ? "semana" : "día trabajado";

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

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Tendencias · {stats.rango}
          </h2>
          <SelectorPeriodo actual={periodo} />
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Ingresos"
            value={fmt0.format(kpis.ingresos.valor)}
            icon={<Wallet size={18} />}
            delta={delta(kpis.ingresos.cambio)}
          />
          <StatCard
            label="Pacientes atendidos"
            value={kpis.atendidos.valor.toLocaleString("es-MX")}
            icon={<UserCheck size={18} />}
            delta={delta(kpis.atendidos.cambio)}
          />
          <StatCard
            label="Ticket promedio"
            value={fmt0.format(kpis.ticket.valor)}
            icon={<Receipt size={18} />}
            delta={delta(kpis.ticket.cambio)}
            info="Ingresos del periodo entre pacientes atendidos (incluye venta de productos)."
            infoAlign="start"
          />
          <StatCard
            label="Asistencia"
            value={
              kpis.asistencia.valor === null
                ? "—"
                : `${Math.round(kpis.asistencia.valor * 100)}%`
            }
            icon={<CalendarCheck size={18} />}
            delta={delta(kpis.asistencia.cambio, true)}
            info="Citas atendidas entre citas ya resueltas (se excluyen las que siguen agendadas)."
            infoAlign="end"
          />
        </div>

        <ChartCard
          tour="tendencias"
          titulo={stats.semanal ? "Ingresos por semana" : "Ingresos por día"}
          resumen={
            conIngresos.length > 0 && mejor ? (
              <>
                Promedio por {unidad}:{" "}
                {fmt0.format(kpis.ingresos.valor / conIngresos.length)} · Mejor{" "}
                {stats.semanal ? "semana" : "día"}: {mejor.detalle} ({fmt0.format(mejor.total)})
              </>
            ) : (
              "Sin cobros en este periodo."
            )
          }
          grafica={
            <GraficaColumnas
              descripcion={`Ingresos por ${stats.semanal ? "semana" : "día"}, ${stats.rango}`}
              columnas={buckets.map((b) => ({
                clave: b.clave,
                etiqueta: b.etiqueta,
                detalle: b.detalle,
                valor: b.total,
                valorTexto: b.total > 0 ? fmt0.format(b.total) : "Sin ingresos",
                filas: [
                  { label: "Efectivo", valor: fmt0.format(b.efectivo) },
                  { label: "Tarjeta", valor: fmt0.format(b.tarjeta) },
                  { label: "Atendidos", valor: String(b.atendidos) },
                ],
              }))}
            />
          }
          tabla={
            <TablaDatos
              columnas={[stats.semanal ? "Semana" : "Día", "Ingresos", "Efectivo", "Tarjeta", "Atendidos"]}
              filas={buckets.map((b) => [
                b.detalle,
                fmt0.format(b.total),
                fmt0.format(b.efectivo),
                fmt0.format(b.tarjeta),
                b.atendidos,
              ])}
            />
          }
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <ChartCard
            titulo="Por podóloga"
            resumen="Ingresos por servicios"
            grafica={
              <GraficaBarras
                filas={stats.porPodologa.map((f) => ({
                  id: f.id,
                  nombre: f.nombre,
                  valor: f.ingresos,
                  valorTexto: fmt0.format(f.ingresos),
                  detalle: `${f.servicios} servicios · comisión ${fmt0.format(f.comision)}`,
                }))}
              />
            }
            tabla={
              <TablaDatos
                columnas={["Podóloga", "Servicios", "Ingresos", "Comisión"]}
                filas={stats.porPodologa.map((f) => [
                  f.nombre,
                  f.servicios,
                  fmt0.format(f.ingresos),
                  fmt0.format(f.comision),
                ])}
              />
            }
          />
          <ChartCard
            titulo="Servicios más solicitados"
            resumen="Veces que se cobró cada servicio"
            grafica={
              <GraficaBarras
                filas={stats.porServicio.slice(0, 5).map((f) => ({
                  id: f.id,
                  nombre: f.nombre,
                  valor: f.veces,
                  valorTexto: f.veces.toLocaleString("es-MX"),
                  detalle: `${fmt0.format(f.ingresos)} en ingresos`,
                }))}
              />
            }
            tabla={
              <TablaDatos
                columnas={["Servicio", "Veces", "Ingresos"]}
                filas={stats.porServicio.map((f) => [f.nombre, f.veces, fmt0.format(f.ingresos)])}
              />
            }
          />
          <ChartCard
            titulo="Asistencia"
            resumen="Citas del periodo ya resueltas"
            grafica={<BarraAsistencia conteo={stats.asistencia} />}
            tabla={
              <TablaDatos
                columnas={["Estado", "Citas"]}
                filas={[
                  ["Llegó", stats.asistencia.llego],
                  ["Llegó tarde", stats.asistencia.tarde],
                  ["No vino", stats.asistencia.noVino],
                ]}
              />
            }
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

// Selector de periodo: filtra toda la sección de tendencias.
function SelectorPeriodo({ actual }: { actual: Periodo }) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1 text-sm">
      {PERIODOS.map((p) => (
        <Link
          key={p.valor}
          href={`/dashboard?periodo=${p.valor}`}
          scroll={false}
          aria-current={p.valor === actual ? "true" : undefined}
          className={cn(
            "rounded-md px-3 py-1",
            p.valor === actual
              ? "bg-primary font-medium text-primary-foreground"
              : "text-muted transition-colors hover:text-foreground"
          )}
        >
          {p.label}
        </Link>
      ))}
    </div>
  );
}
