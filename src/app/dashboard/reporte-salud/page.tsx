import { prisma } from "@/lib/prisma";
import { hoyMX, inicioDeMesMX, rangoFechas, fechaLegible } from "@/lib/fecha";
import { PrintButton } from "@/components/print-button";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { InfoTip } from "@/components/ui/info-tip";

const fmtFecha = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Mexico_City",
});
const fmtHora = new Intl.DateTimeFormat("es-MX", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Mexico_City",
});

export default async function ReporteSaludPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}) {
  const sp = await searchParams;
  const re = /^\d{4}-\d{2}-\d{2}$/;
  const desde = re.test(sp.desde ?? "") ? (sp.desde as string) : inicioDeMesMX();
  const hasta = re.test(sp.hasta ?? "") ? (sp.hasta as string) : hoyMX();
  const { inicio, fin } = rangoFechas(desde, hasta);

  const citas = await prisma.cita.findMany({
    where: {
      inicio: { gte: inicio, lt: fin },
      estado: { in: ["LLEGO", "LLEGO_TARDE"] },
    },
    orderBy: { inicio: "asc" },
    include: {
      paciente: { select: { nombre: true } },
      podologa: { select: { nombre: true } },
    },
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div data-tour="reporte" className="no-print">
        <PageHeader
          title="Reporte Secretaría de Salud"
          subtitle="Pacientes que asistieron, con fecha, hora y podóloga."
          actions={<PrintButton label="Imprimir / Guardar PDF" />}
        />
      </div>

      <form
        method="get"
        className="no-print flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4"
      >
        <Field label="Desde">
          <Input type="date" name="desde" defaultValue={desde} />
        </Field>
        <Field label="Hasta">
          <Input type="date" name="hasta" defaultValue={hasta} />
        </Field>
        <Button type="submit">Ver</Button>
      </form>

      {/* Encabezado imprimible */}
      <div className="hidden print:block">
        <h1 className="text-xl font-bold">Reporte de pacientes atendidos</h1>
        <p className="text-sm">
          Del {fechaLegible(desde)} al {fechaLegible(hasta)}
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
            Pacientes atendidos
            <InfoTip
              texto="Solo cuenta citas marcadas como “Llegó” o “Llegó tarde”. Las que quedaron en “No vino” no aparecen."
              className="no-print"
            />
          </h2>
          <span className="text-sm text-muted">{citas.length} en total</span>
        </div>

        {citas.length === 0 ? (
          <EmptyState>
            No hay pacientes atendidos en este rango. Marca “Llegó” en las citas
            para que aparezcan aquí.
          </EmptyState>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-surface print:border-0">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Paciente</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Hora</th>
                  <th className="px-4 py-3 font-medium">Podóloga</th>
                </tr>
              </thead>
              <tbody>
                {citas.map((c, i) => (
                  <tr
                    key={c.id}
                    className="border-b border-border/60 last:border-0"
                  >
                    <td className="px-4 py-2.5 text-muted">{i + 1}</td>
                    <td className="px-4 py-2.5">
                      {c.paciente?.nombre ?? c.titulo}
                    </td>
                    <td className="px-4 py-2.5">{fmtFecha.format(c.inicio)}</td>
                    <td className="px-4 py-2.5">{fmtHora.format(c.inicio)}</td>
                    <td className="px-4 py-2.5">{c.podologa?.nombre ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
