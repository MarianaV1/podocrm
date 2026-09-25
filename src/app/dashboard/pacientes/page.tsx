import type { Metadata } from "next";
import Link from "next/link";
import { Plus, ArrowRight, ArrowLeft, TriangleAlert } from "lucide-react";
import { whatsappUrl } from "@/lib/whatsapp";
import { buscarPacientes } from "@/lib/busqueda-pacientes";
import { leerFiltros } from "@/lib/filtros-pacientes";
import { WhatsAppIconLink } from "@/components/whatsapp-link";
import { PageHeader } from "@/components/ui/page-header";
import { buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FiltrosPacientes } from "./filtros-pacientes";

export const metadata: Metadata = { title: "Pacientes" };

const TZ = "America/Mexico_City";
const fmtVisita = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: TZ });
const fmtVisitaAnio = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: TZ,
});

function ultimaVisita(d: Date | null) {
  if (!d) return null;
  const esteAnio = new Date().getFullYear() === d.getFullYear();
  return (esteAnio ? fmtVisita : fmtVisitaAnio).format(d);
}

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; salud?: string; orden?: string; pagina?: string }>;
}) {
  const filtros = leerFiltros(await searchParams);
  const { pacientes, total, todos, paginas } = await buscarPacientes(filtros);
  const filtrando = Boolean(filtros.q || filtros.salud);

  // Enlace a otra página conservando búsqueda, filtro y orden.
  const hrefPagina = (n: number) => {
    const params = new URLSearchParams();
    if (filtros.q) params.set("q", filtros.q);
    if (filtros.salud) params.set("salud", filtros.salud);
    if (filtros.orden !== "recientes") params.set("orden", filtros.orden);
    if (n > 1) params.set("pagina", String(n));
    const qs = params.toString();
    return qs ? `/dashboard/pacientes?${qs}` : "/dashboard/pacientes";
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pacientes"
        subtitle={`${todos} registrado${todos === 1 ? "" : "s"}`}
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

      {todos === 0 ? (
        <EmptyState>
          Aún no hay pacientes. Crea el primero con “Nuevo paciente”.
        </EmptyState>
      ) : (
        <FiltrosPacientes q={filtros.q} salud={filtros.salud} orden={filtros.orden}>
          {pacientes.length === 0 ? (
            <EmptyState>
              <span className="flex flex-col items-center gap-3">
                Ningún paciente coincide con la búsqueda.
                <Link href="/dashboard/pacientes" className={buttonClasses("outline", "sm")}>
                  Limpiar filtros
                </Link>
              </span>
            </EmptyState>
          ) : (
            <div className="flex flex-col gap-3">
              {filtrando && (
                <p className="text-sm text-muted" aria-live="polite">
                  {total} resultado{total === 1 ? "" : "s"}
                </p>
              )}
              <div className="overflow-x-auto rounded-xl border border-border bg-surface">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-muted">
                    <tr>
                      <th className="px-4 py-3 font-medium">Nombre</th>
                      <th className="px-4 py-3 font-medium">Teléfono</th>
                      <th className="px-4 py-3 font-medium">Hoja clínica</th>
                      <th className="px-4 py-3 font-medium">Salud</th>
                      <th className="px-4 py-3 font-medium">Última visita</th>
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
                        <td className="whitespace-nowrap px-4 py-3 text-muted">
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
                        <td className="whitespace-nowrap px-4 py-3 text-muted">
                          {ultimaVisita(p.ultimaVisita) ?? (
                            <span className="text-xs">Sin visitas</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/dashboard/pacientes/${p.id}`}
                            className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-medium text-primary hover:underline"
                          >
                            Ver ficha <ArrowRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {paginas > 1 && (
                <nav
                  aria-label="Paginación"
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="text-muted">
                    Página {Math.min(filtros.pagina, paginas)} de {paginas}
                  </span>
                  <div className="flex gap-2">
                    <PaginaLink href={filtros.pagina > 1 ? hrefPagina(filtros.pagina - 1) : null}>
                      <ArrowLeft size={14} /> Anterior
                    </PaginaLink>
                    <PaginaLink href={filtros.pagina < paginas ? hrefPagina(filtros.pagina + 1) : null}>
                      Siguiente <ArrowRight size={14} />
                    </PaginaLink>
                  </div>
                </nav>
              )}
            </div>
          )}
        </FiltrosPacientes>
      )}
    </div>
  );
}

function PaginaLink({ href, children }: { href: string | null; children: React.ReactNode }) {
  if (!href) {
    return (
      <span aria-disabled="true" className={buttonClasses("outline", "sm", "opacity-50")}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} scroll={false} className={buttonClasses("outline", "sm")}>
      {children}
    </Link>
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
