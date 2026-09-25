"use client";

import { useActionState } from "react";
import type { HojaClinica } from "@prisma/client";
import { guardarHoja } from "@/app/actions/pacientes";
import { Button } from "@/components/ui/button";
import { inputClasses } from "@/components/ui/input";

type State = { error: string } | undefined;

export function HojaForm({
  pacienteId,
  hoja,
}: {
  pacienteId: string;
  hoja: HojaClinica | null;
}) {
  const boundAction = guardarHoja.bind(null, pacienteId);
  const [state, formAction, pending] = useActionState<State, FormData>(
    boundAction,
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
        <legend className="px-1 text-sm font-semibold">Banderas médicas</legend>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="diabetico"
            defaultChecked={hoja?.diabetico}
            className="h-4 w-4 accent-primary"
          />
          Diabético
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="hipertenso"
            defaultChecked={hoja?.hipertenso}
            className="h-4 w-4 accent-primary"
          />
          Hipertenso
        </label>

        <Textarea
          name="otrasCondiciones"
          label="Otras enfermedades / condiciones"
          defaultValue={hoja?.otrasCondiciones}
        />
        <Textarea
          name="comentarioSalud"
          label="Comentario a destacar (se muestra resaltado en amarillo)"
          defaultValue={hoja?.comentarioSalud}
        />
      </fieldset>

      <Textarea name="alergias" label="Alergias" defaultValue={hoja?.alergias} />
      <Textarea
        name="motivoConsulta"
        label="Motivo de consulta"
        defaultValue={hoja?.motivoConsulta}
      />
      <Textarea
        name="antecedentes"
        label="Antecedentes"
        defaultValue={hoja?.antecedentes}
      />
      <Textarea
        name="observaciones"
        label="Observaciones"
        defaultValue={hoja?.observaciones}
      />

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Guardando…" : "Guardar hoja clínica"}
      </Button>
    </form>
  );
}

function Textarea({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={2}
        maxLength={1000}
        defaultValue={defaultValue ?? ""}
        className={inputClasses}
      />
    </div>
  );
}
