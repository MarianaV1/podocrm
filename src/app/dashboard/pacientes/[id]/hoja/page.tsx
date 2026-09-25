import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { HojaForm } from "./hoja-form";

export const metadata: Metadata = { title: "Hoja clínica" };

export default async function HojaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const paciente = await prisma.paciente.findUnique({
    where: { id },
    include: { hojaClinica: true },
  });
  if (!paciente) notFound();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <Link
          href={`/dashboard/pacientes/${paciente.id}`}
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={15} /> {paciente.nombre}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {paciente.hojaClinica ? "Editar hoja clínica" : "Nueva hoja clínica"}
        </h1>
        {paciente.hojaClinica && (
          <p className="text-sm text-muted">
            Folio {paciente.hojaClinica.folio}
          </p>
        )}
      </div>
      <HojaForm pacienteId={paciente.id} hoja={paciente.hojaClinica} />
    </div>
  );
}
