import { prisma } from "@/lib/prisma";
import { hoyMX, inicioDeMesMX, rangoFechas, fechaLegible } from "@/lib/fecha";
import { PrintButton } from "@/components/print-button";

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

const inputCls =
  "rounded-md border border-black/10 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:bg-zinc-900";

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
      <div className="no-print flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Reporte Secretaría de Salud
          </h1>
          <p className="text-sm text-zinc-500">
            Pacientes que asistieron, con fecha, hora y podóloga.
          </p>
        </div>
        <PrintButton label="Imprimir / Guardar PDF" />
      </div>

      <form
        method="get"
        className="no-print flex flex-wrap items-end gap-2 rounded-lg border border-black/10 p-4 dark:border-white/10"
      >
        <label className="flex flex-col gap-1">
          <span className="text-xs text-zinc-500">Desde</span>
          <input type="date" name="desde" defaultValue={desde} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-zinc-500">Hasta</span>
          <input type="date" name="hasta" defaultValue={hasta} className={inputCls} />
        </label>
        <button className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">
          Ver
        </button>
      </form>

      {/* Encabezado imprimible */}
      <div className="hidden print:block">
        <h1 className="text-xl font-bold">Reporte de pacientes atendidos</h1>
        <p className="text-sm">
          Del {fechaLegible(desde)} al {fechaLegible(hasta)}
        </p>
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Pacientes atendidos
          </h2>
          <span className="text-sm text-zinc-500">{citas.length} en total</span>
        </div>

        {citas.length === 0 ? (
          <p className="rounded-md border border-dashed border-black/15 p-8 text-center text-sm text-zinc-500 dark:border-white/15">
            No hay pacientes atendidos en este rango. Marca “Llegó” en las citas
            para que aparezcan aquí.
          </p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-black/15 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-white/15">
                <th className="py-2 pr-2 font-medium">#</th>
                <th className="py-2 pr-2 font-medium">Paciente</th>
                <th className="py-2 pr-2 font-medium">Fecha</th>
                <th className="py-2 pr-2 font-medium">Hora</th>
                <th className="py-2 font-medium">Podóloga</th>
              </tr>
            </thead>
            <tbody>
              {citas.map((c, i) => (
                <tr
                  key={c.id}
                  className="border-b border-black/5 dark:border-white/10"
                >
                  <td className="py-2 pr-2 text-zinc-400">{i + 1}</td>
                  <td className="py-2 pr-2">
                    {c.paciente?.nombre ?? c.titulo}
                  </td>
                  <td className="py-2 pr-2">{fmtFecha.format(c.inicio)}</td>
                  <td className="py-2 pr-2">{fmtHora.format(c.inicio)}</td>
                  <td className="py-2">{c.podologa?.nombre ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
