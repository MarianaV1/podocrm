import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { EstadoCita } from "@prisma/client";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { whatsappUrl } from "@/lib/whatsapp";
import { WhatsAppButton } from "@/components/whatsapp-link";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { TelefonoEditable } from "./telefono-editable";

const fmtFechaHora = new Intl.DateTimeFormat("es-MX", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function PacientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const paciente = await prisma.paciente.findUnique({
    where: { id },
    include: {
      hojaClinica: true,
      citas: {
        orderBy: { inicio: "desc" },
        include: { podologa: { select: { nombre: true } } },
      },
    },
  });
  if (!paciente) notFound();

  const hoja = paciente.hojaClinica;
  const citas = paciente.citas;
  const wa = whatsappUrl(paciente.telefono);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <Link
          href="/dashboard/pacientes"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={15} /> Pacientes
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {paciente.nombre}
        </h1>
      </div>

      <Card className="p-5">
        <CardTitle className="mb-3">Datos</CardTitle>
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">
              Teléfono
            </dt>
            <dd className="mt-0.5">
              <TelefonoEditable
                pacienteId={paciente.id}
                telefono={paciente.telefono}
              />
            </dd>
          </div>
          {wa && <WhatsAppButton href={wa} />}
        </div>
      </Card>

      <Card data-tour="hoja-clinica" className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <CardTitle>Hoja clínica</CardTitle>
          <div className="flex items-center gap-4">
            {hoja && (
              <Link
                href={`/dashboard/pacientes/${paciente.id}/hoja/imprimir`}
                className="text-sm font-medium text-primary hover:underline"
              >
                Imprimir
              </Link>
            )}
            <Link
              href={`/dashboard/pacientes/${paciente.id}/hoja`}
              className="text-sm font-medium text-primary hover:underline"
            >
              {hoja ? "Editar hoja" : "+ Crear hoja"}
            </Link>
          </div>
        </div>

        {!hoja ? (
          <p className="text-sm text-muted">
            Este paciente aún no tiene hoja clínica.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <Badge tone="primary">Folio {hoja.folio}</Badge>
            </div>

            {(hoja.diabetico ||
              hoja.hipertenso ||
              hoja.otrasCondiciones ||
              hoja.comentarioSalud ||
              hoja.alergias) && (
              <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-2 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Alertas de salud
                </p>

                {(hoja.diabetico || hoja.hipertenso) && (
                  <div className="flex flex-wrap gap-2">
                    {hoja.diabetico && <FlagAlerta>Diabético</FlagAlerta>}
                    {hoja.hipertenso && <FlagAlerta>Hipertenso</FlagAlerta>}
                  </div>
                )}

                {(hoja.otrasCondiciones || hoja.comentarioSalud) && (
                  <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900 dark:border-yellow-500/40 dark:bg-yellow-500/10 dark:text-yellow-200">
                    <p className="flex items-center gap-1.5 font-semibold">
                      <TriangleAlert size={15} /> Condiciones de salud a
                      considerar
                    </p>
                    {hoja.otrasCondiciones && (
                      <p className="mt-1">{hoja.otrasCondiciones}</p>
                    )}
                    {hoja.comentarioSalud && (
                      <p className="mt-1 italic">{hoja.comentarioSalud}</p>
                    )}
                  </div>
                )}

                {hoja.alergias && (
                  <p className="text-sm text-muted">
                    <span className="font-medium">Alergias:</span>{" "}
                    {hoja.alergias}
                  </p>
                )}
              </div>
            )}

            <dl className="grid grid-cols-1 gap-x-8 gap-y-3 text-sm">
              <Dato label="Motivo de consulta" value={hoja.motivoConsulta ?? "—"} />
              <Dato label="Antecedentes" value={hoja.antecedentes ?? "—"} />
              <Dato label="Observaciones" value={hoja.observaciones ?? "—"} />
            </dl>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <CardTitle className="mb-4">Citas ({citas.length})</CardTitle>

        {citas.length === 0 ? (
          <p className="text-sm text-muted">
            Este paciente aún no tiene citas registradas.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {citas.map((cita) => (
              <li
                key={cita.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {fmtFechaHora.format(cita.inicio)}
                  </p>
                  <p className="text-xs text-muted">
                    {cita.podologa
                      ? `Podóloga: ${cita.podologa.nombre}`
                      : "Sin podóloga asignada"}
                  </p>
                </div>
                <EstadoBadge estado={cita.estado} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: EstadoCita }) {
  const map: Record<EstadoCita, { label: string; tone: BadgeTone }> = {
    AGENDADA: { label: "Agendada", tone: "neutral" },
    LLEGO: { label: "Llegó", tone: "success" },
    LLEGO_TARDE: { label: "Llegó tarde", tone: "warning" },
    NO_SHOW: { label: "No vino", tone: "danger" },
  };
  const s = map[estado];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="whitespace-pre-wrap">{value}</dd>
    </div>
  );
}

function FlagAlerta({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-red-100 px-3 py-1 text-sm font-semibold text-red-800 dark:border-red-500/40 dark:bg-red-500/20 dark:text-red-200">
      <span aria-hidden className="text-red-500 dark:text-red-400">
        ●
      </span>
      {children}
    </span>
  );
}
