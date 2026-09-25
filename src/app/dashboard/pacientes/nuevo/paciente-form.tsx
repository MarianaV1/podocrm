"use client";

import { useActionState } from "react";
import { crearPaciente } from "@/app/actions/pacientes";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

type State = { error: string } | undefined;

export function PacienteForm() {
  const [state, action, pending] = useActionState<State, FormData>(
    crearPaciente,
    undefined
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Nombre completo *">
        <Input name="nombre" maxLength={80} required />
      </Field>

      <Field
        label="Teléfono (WhatsApp)"
        hint="Con este número se abrirá el chat de WhatsApp desde la ficha."
      >
        <Input name="telefono" maxLength={20} type="tel" inputMode="tel" placeholder="10 dígitos" />
      </Field>

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}

      <Button type="submit" disabled={pending} className="mt-2 self-start">
        {pending ? "Guardando…" : "Guardar paciente"}
      </Button>
    </form>
  );
}
