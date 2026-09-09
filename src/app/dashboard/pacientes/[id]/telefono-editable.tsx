"use client";

import { useState, useTransition } from "react";
import { actualizarTelefono } from "@/app/actions/pacientes";

const inputCls =
  "rounded-md border border-black/10 bg-white px-2 py-1 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:bg-zinc-900";
const btnCls =
  "rounded-md border border-black/10 px-2.5 py-1 text-xs font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10";

export function TelefonoEditable({
  pacienteId,
  telefono,
}: {
  pacienteId: string;
  telefono: string | null;
}) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(telefono ?? "");
  const [pending, startTransition] = useTransition();

  function guardar() {
    startTransition(async () => {
      await actualizarTelefono(pacienteId, valor);
      setEditando(false);
    });
  }

  function cancelar() {
    setValor(telefono ?? "");
    setEditando(false);
  }

  if (!editando) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-zinc-800 dark:text-zinc-200">
          {telefono ?? "—"}
        </span>
        <button
          onClick={() => setEditando(true)}
          className="text-xs text-blue-600 hover:underline dark:text-blue-400"
        >
          {telefono ? "Editar" : "+ Agregar"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        type="tel"
        inputMode="tel"
        placeholder="10 dígitos"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") guardar();
          if (e.key === "Escape") cancelar();
        }}
        className={inputCls}
      />
      <button
        onClick={guardar}
        disabled={pending}
        className="rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {pending ? "Guardando…" : "Guardar"}
      </button>
      <button onClick={cancelar} disabled={pending} className={btnCls}>
        Cancelar
      </button>
    </div>
  );
}
