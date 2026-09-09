"use client";

import { useActionState } from "react";
import { crearPaciente } from "@/app/actions/pacientes";

type State = { error: string } | undefined;

const field =
  "rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:bg-zinc-900";

export function PacienteForm() {
  const [state, action, pending] = useActionState<State, FormData>(
    crearPaciente,
    undefined
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="nombre" className="text-sm font-medium">
          Nombre completo <span className="text-red-500">*</span>
        </label>
        <input id="nombre" name="nombre" required className={field} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="telefono" className="text-sm font-medium">
          Teléfono (WhatsApp)
        </label>
        <input
          id="telefono"
          name="telefono"
          type="tel"
          inputMode="tel"
          placeholder="10 dígitos"
          className={field}
        />
        <p className="text-xs text-zinc-500">
          Con este número se abrirá el chat de WhatsApp desde la ficha.
        </p>
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 self-start rounded-md bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {pending ? "Guardando…" : "Guardar paciente"}
      </button>
    </form>
  );
}
