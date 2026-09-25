import Link from "next/link";
import { Plus, ArrowRight, TriangleAlert } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { whatsappUrl } from "@/lib/whatsapp";
import { WhatsAppIconLink } from "@/components/whatsapp-link";
import { PageHeader } from "@/components/ui/page-header";
import { buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

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
      <PageHeader
        title="Pacientes"
        subtitle={`${pacientes.length} registrado${pacientes.length === 1 ? "" : "s"}`}
        actions={
          <Link
            href="/dashboard/pacientes/nuevo"
            className={buttonClasses("primary")}
          >
            <Plus size={16} />
            Nuevo paciente
          </Link>
        }
      />

      {pacientes.length === 0 ? (
        <EmptyState>
          Aún no hay pacientes. Crea el primero con “Nuevo paciente”.
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Teléfono</th>
                <th className="px-4 py-3 font-medium">Hoja clínica</th>
                <th className="px-4 py-3 font-medium">Salud</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {pacientes.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border/60 transition-colors last:border-0 hover:bg-surface-2"
                >
                  <td className="px-4 py-3 font-medium">{p.nombre}</td>
                  <td className="px-4 py-3 text-muted">
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
                  <td className="px-4 py-3">
                    {p.hojaClinica ? (
                      <Badge tone="success">Folio {p.hojaClinica.folio}</Badge>
                    ) : (
                      <span className="text-xs text-muted">Sin hoja</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <SaludCelda hoja={p.hojaClinica} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/pacientes/${p.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      Ver ficha <ArrowRight size={14} />
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
    return <span className="text-xs text-muted">—</span>;
  }
  return (
    <span data-tour="salud-alerta" className="group relative inline-block">
      <Badge tone="danger" className="cursor-default">
        <TriangleAlert size={13} /> {alertas.length}
      </Badge>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full right-0 z-20 mb-1 hidden whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-xs font-normal text-white shadow-lg group-hover:block dark:bg-zinc-700"
      >
        {alertas.join(", ")}
      </span>
    </span>
  );
}
