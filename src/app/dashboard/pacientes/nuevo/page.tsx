import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PacienteForm } from "./paciente-form";

export default function NuevoPacientePage() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div>
        <Link
          href="/dashboard/pacientes"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={15} /> Pacientes
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Nuevo paciente
        </h1>
      </div>
      <PacienteForm />
    </div>
  );
}
