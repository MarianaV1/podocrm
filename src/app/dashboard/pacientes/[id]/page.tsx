import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { EstadoCita } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { whatsappUrl } from "@/lib/whatsapp";
import { WhatsAppButton } from "@/components/whatsapp-link";
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
          className="text-sm text-zinc-500 hover:underline"
        >
          ← Pacientes
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {paciente.nombre}
        </h1>
      </div>

      <section className="rounded-lg border border-black/10 p-5 dark:border-white/10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Datos
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-400">
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
      </section>

      <section className="rounded-lg border border-black/10 p-5 dark:border-white/10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Hoja clínica
          </h2>
          <div className="flex items-center gap-4">
            {hoja && (
              <Link
                href={`/dashboard/pacientes/${paciente.id}/hoja/imprimir`}
                className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                Imprimir
              </Link>
            )}
            <Link
              href={`/dashboard/pacientes/${paciente.id}/hoja`}
              className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              {hoja ? "Editar hoja" : "+ Crear hoja"}
            </Link>
          </div>
        </div>

        {!hoja ? (
          <p className="text-sm text-zinc-500">
            Este paciente aún no tiene hoja clínica.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <span className="rounded bg-black/5 px-2 py-0.5 text-sm font-medium dark:bg-white/10">
                Folio {hoja.folio}
              </span>
            </div>

            {(hoja.diabetico ||
              hoja.hipertenso ||
              hoja.otrasCondiciones ||
              hoja.comentarioSalud ||
              hoja.alergias) && (
              <div className="flex flex-col gap-3 rounded-lg border border-black/10 bg-black/[.02] p-4 dark:border-white/10 dark:bg-white/[.03]">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
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
                    <p className="font-semibold">
                      ⚠️ Condiciones de salud a considerar
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
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    <span className="font-medium text-zinc-500">Alergias:</span>{" "}
                    {hoja.alergias}
                  </p>
                )}
              </div>
            )}

            <dl className="grid grid-cols-1 gap-x-8 gap-y-3 text-sm">
              <Dato
                label="Motivo de consulta"
                value={hoja.motivoConsulta ?? "—"}
              />
              <Dato label="Antecedentes" value={hoja.antecedentes ?? "—"} />
              <Dato label="Observaciones" value={hoja.observaciones ?? "—"} />
            </dl>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-black/10 p-5 dark:border-white/10">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Citas ({citas.length})
        </h2>

        {citas.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Este paciente aún no tiene citas registradas.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-black/5 dark:divide-white/10">
            {citas.map((cita) => (
              <li
                key={cita.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {fmtFechaHora.format(cita.inicio)}
                  </p>
                  <p className="text-xs text-zinc-500">
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
      </section>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: EstadoCita }) {
  const map = {
    AGENDADA: {
      label: "Agendada",
      cls: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    },
    LLEGO: {
      label: "Llegó",
      cls: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    },
    LLEGO_TARDE: {
      label: "Llegó tarde",
      cls: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200",
    },
    NO_SHOW: {
      label: "No vino",
      cls: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200",
    },
  } as const;
  const s = map[estado];
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-zinc-400">{label}</dt>
      <dd className="whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">
        {value}
      </dd>
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
