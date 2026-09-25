import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "Imprimir hoja clínica" };

function fmt(d: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "long",
    timeZone: "America/Mexico_City",
  }).format(d);
}

export default async function ImprimirHojaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const paciente = await prisma.paciente.findUnique({
    where: { id },
    include: { hojaClinica: true },
  });
  if (!paciente || !paciente.hojaClinica) notFound();
  const h = paciente.hojaClinica;

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Barra de acciones — no se imprime */}
      <div className="no-print mb-4 flex items-center justify-between">
        <Link
          href={`/dashboard/pacientes/${paciente.id}`}
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={15} /> Volver a la ficha
        </Link>
        <PrintButton />
      </div>

      {/* Hoja imprimible (colores fijos claros para que imprima bien) */}
      <div className="rounded-lg border border-gray-300 bg-white p-8 text-black shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <header className="mb-6 flex items-start justify-between border-b border-gray-300 pb-4">
          <div>
            <h1 className="text-xl font-bold">Hoja Clínica</h1>
            <p className="text-sm text-gray-600">Podología</p>
          </div>
          <div className="text-right text-sm">
            <p>
              <span className="font-semibold">Folio:</span> {h.folio}
            </p>
            <p className="text-gray-600">{fmt(h.createdAt)}</p>
          </div>
        </header>

        <section className="mb-5">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
            Datos del paciente
          </h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Campo label="Nombre" value={paciente.nombre} />
            <Campo label="Teléfono" value={paciente.telefono ?? "—"} />
          </div>
        </section>

        <section className="mb-5">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
            Condiciones médicas
          </h2>
          <div className="flex flex-wrap gap-6 text-sm">
            <Check label="Diabético" checked={h.diabetico} />
            <Check label="Hipertenso" checked={h.hipertenso} />
          </div>
          {h.otrasCondiciones && (
            <p className="mt-2 text-sm">
              <span className="font-semibold">Otras condiciones:</span>{" "}
              {h.otrasCondiciones}
            </p>
          )}
          {h.comentarioSalud && (
            <p className="mt-1 text-sm">
              <span className="font-semibold">Comentario:</span>{" "}
              {h.comentarioSalud}
            </p>
          )}
          {h.alergias && (
            <p className="mt-1 text-sm">
              <span className="font-semibold">Alergias:</span> {h.alergias}
            </p>
          )}
        </section>

        <section className="space-y-3 text-sm">
          <Bloque label="Motivo de consulta" value={h.motivoConsulta} />
          <Bloque label="Antecedentes" value={h.antecedentes} />
          <Bloque label="Observaciones" value={h.observaciones} />
        </section>
      </div>
    </div>
  );
}

function Campo({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="font-semibold">{label}:</span> {value}
    </p>
  );
}

function Check({ label, checked }: { label: string; checked: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`flex h-4 w-4 items-center justify-center border border-gray-600 text-[11px] leading-none ${
          checked ? "bg-gray-900 text-white" : "bg-white"
        }`}
      >
        {checked ? "✓" : ""}
      </span>
      {label}
    </span>
  );
}

function Bloque({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-500">
        {label}
      </h3>
      <div className="min-h-[2.5rem] whitespace-pre-wrap rounded border border-gray-300 p-2">
        {value || ""}
      </div>
    </div>
  );
}
