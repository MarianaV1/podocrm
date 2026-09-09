import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { whatsappUrl } from "@/lib/whatsapp";
import { WhatsAppIconLink } from "@/components/whatsapp-link";

export default async function PacientesPage() {
  const pacientes = await prisma.paciente.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      hojaClinica: {
        select: {
          folio: true,
          diabetico: true,
          hipertenso: true,
          otrasCondiciones: true,
          comentarioSalud: true,
          alergias: true,
        },
      },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pacientes</h1>
          <p className="text-sm text-zinc-500">
            {pacientes.length} registrado{pacientes.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          href="/dashboard/pacientes/nuevo"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          + Nuevo paciente
        </Link>
      </div>

      {pacientes.length === 0 ? (
        <p className="rounded-md border border-dashed border-black/15 p-8 text-center text-sm text-zinc-500 dark:border-white/15">
          Aún no hay pacientes. Crea el primero con “Nuevo paciente”.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-black/10 dark:border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 bg-black/[.02] text-xs uppercase tracking-wide text-zinc-500 dark:border-white/10 dark:bg-white/[.03]">
              <tr>
                <th className="px-4 py-2.5 font-medium">Nombre</th>
                <th className="px-4 py-2.5 font-medium">Teléfono</th>
                <th className="px-4 py-2.5 font-medium">Hoja clínica</th>
                <th className="px-4 py-2.5 font-medium">Salud</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {pacientes.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-black/5 last:border-0 dark:border-white/5"
                >
                  <td className="px-4 py-2.5 font-medium">{p.nombre}</td>
                  <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-400">
                    {p.telefono ? (
                      <span className="inline-flex items-center gap-2">
                        {p.telefono}
                        {whatsappUrl(p.telefono) && (
                          <WhatsAppIconLink href={whatsappUrl(p.telefono)!} />
                        )}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {p.hojaClinica ? (
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                        Folio {p.hojaClinica.folio}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400">Sin hoja</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <SaludCelda hoja={p.hojaClinica} />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link
                      href={`/dashboard/pacientes/${p.id}`}
                      className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Ver ficha →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

type HojaResumen = {
  diabetico: boolean;
  hipertenso: boolean;
  otrasCondiciones: string | null;
  comentarioSalud: string | null;
  alergias: string | null;
} | null;

function resumenSalud(hoja: HojaResumen): string[] {
  if (!hoja) return [];
  const alertas: string[] = [];
  if (hoja.diabetico) alertas.push("Diabético");
  if (hoja.hipertenso) alertas.push("Hipertenso");
  if (hoja.otrasCondiciones) alertas.push("Otras condiciones");
  if (hoja.comentarioSalud) alertas.push("Comentario de salud");
  if (hoja.alergias) alertas.push("Alergias");
  return alertas;
}

function SaludCelda({ hoja }: { hoja: HojaResumen }) {
  const alertas = resumenSalud(hoja);
  if (alertas.length === 0) {
    return <span className="text-xs text-zinc-400">—</span>;
  }
  return (
    <span className="group relative inline-block">
      <span className="inline-flex cursor-default items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-500/20 dark:text-red-200">
        ⚠️ {alertas.length}
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full right-0 z-20 mb-1 hidden whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-xs font-normal text-white shadow-lg group-hover:block dark:bg-zinc-700 dark:text-zinc-100"
      >
        {alertas.join(", ")}
      </span>
    </span>
  );
}
