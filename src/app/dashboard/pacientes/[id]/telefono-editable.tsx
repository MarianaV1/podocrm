"use client";

import { useState, useTransition } from "react";
import { actualizarTelefono } from "@/app/actions/pacientes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
        <span>{telefono ?? "—"}</span>
        <button
          onClick={() => setEditando(true)}
          className="text-xs font-medium text-primary hover:underline"
        >
          {telefono ? "Editar" : "+ Agregar"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        type="tel"
        inputMode="tel"
        placeholder="10 dígitos"
        maxLength={20}
        autoFocus
        className="w-40!"
        onKeyDown={(e) => {
          if (e.key === "Enter") guardar();
          if (e.key === "Escape") cancelar();
        }}
      />
      <Button size="sm" onClick={guardar} disabled={pending}>
        {pending ? "Guardando…" : "Guardar"}
      </Button>
      <Button variant="outline" size="sm" onClick={cancelar} disabled={pending}>
        Cancelar
      </Button>
    </div>
  );
}
