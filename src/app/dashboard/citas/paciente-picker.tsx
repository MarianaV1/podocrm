"use client";

import { useRef, useState, useTransition } from "react";
import { ClipboardList } from "lucide-react";
import {
  buscarPacientes,
  ligarPacientePorId,
  crearPacienteYLigar,
} from "@/app/actions/google";
import { Button, buttonClasses } from "@/components/ui/button";
import { Input, inputClasses } from "@/components/ui/input";
import { cn } from "@/lib/cn";

type Resultado = { id: string; nombre: string };

export function PacientePicker({
  citaId,
  nombreSugerido,
}: {
  citaId: string;
  nombreSugerido: string;
}) {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [modal, setModal] = useState(false);
  const [pending, startTransition] = useTransition();
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onChange(v: string) {
    setQuery(v);
    setAbierto(true);
    if (debounce.current) clearTimeout(debounce.current);
    if (!v.trim()) {
      setResultados([]);
      setBuscando(false);
      return;
    }
    setBuscando(true);
    debounce.current = setTimeout(async () => {
      const r = await buscarPacientes(v);
      setResultados(r);
      setBuscando(false);
    }, 250);
  }

  function ligar(pacienteId: string) {
    startTransition(() => ligarPacientePorId(citaId, pacienteId));
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <input
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => query.trim() && setAbierto(true)}
          onBlur={() => setTimeout(() => setAbierto(false), 150)}
          placeholder="Buscar paciente…"
          className={cn(inputClasses, "w-44 py-1 text-xs")}
        />
        {abierto && query.trim() && (
          <ul className="absolute z-20 mt-1 max-h-56 w-56 overflow-auto rounded-lg border border-border bg-surface text-xs shadow-lg">
            {buscando && <li className="px-3 py-2 text-muted">Buscando…</li>}
            {!buscando && resultados.length === 0 && (
              <li className="px-3 py-2 text-muted">Sin resultados</li>
            )}
            {resultados.map((r) => (
              <li key={r.id}>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => ligar(r.id)}
                  disabled={pending}
                  className="block w-full px-3 py-2 text-left hover:bg-surface-2 disabled:opacity-60"
                >
                  {r.nombre}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button onClick={() => setModal(true)} className={buttonClasses("outline", "sm")}>
        + Crear
      </button>

      {modal && (
        <CrearPacienteModal
          citaId={citaId}
          nombreSugerido={nombreSugerido}
          onClose={() => setModal(false)}
        />
      )}
    </div>
  );
}

function CrearPacienteModal({
  citaId,
  nombreSugerido,
  onClose,
}: {
  citaId: string;
  nombreSugerido: string;
  onClose: () => void;
}) {
  const [nombre, setNombre] = useState(nombreSugerido);
  const [telefono, setTelefono] = useState("");
  const [pending, startTransition] = useTransition();

  function crear() {
    if (!nombre.trim()) return;
    startTransition(async () => {
      await crearPacienteYLigar(citaId, nombre, telefono);
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-border bg-surface p-5 text-sm shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold">Crear paciente</h3>

        <div className="mt-3 flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="font-medium">Nombre</span>
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoFocus
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Teléfono (WhatsApp)</span>
            <Input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              type="tel"
              inputMode="tel"
              placeholder="10 dígitos"
            />
          </label>

          <p className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
            <ClipboardList size={15} className="mt-px shrink-0" />
            <span>
              Recuerda sacarle su <strong>hoja clínica</strong> cuando llegue —
              entra a su ficha desde la cita.
            </span>
          </p>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" onClick={crear} disabled={pending || !nombre.trim()}>
            {pending ? "Creando…" : "Crear y ligar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
