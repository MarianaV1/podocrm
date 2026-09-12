"use client";

import { useRef, useState, useTransition } from "react";
import {
  buscarPacientes,
  ligarPacientePorId,
  crearPacienteYLigar,
} from "@/app/actions/google";

type Resultado = { id: string; nombre: string };

const inputCls =
  "rounded-md border border-black/10 bg-white px-2 py-1 text-xs outline-none focus:border-black/40 dark:border-white/15 dark:bg-zinc-900";
const btnCls =
  "rounded-md border border-black/10 px-2.5 py-1 text-xs font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10";

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
          className={`w-44 ${inputCls}`}
        />
        {abierto && query.trim() && (
          <ul className="absolute z-20 mt-1 max-h-56 w-56 overflow-auto rounded-md border border-black/10 bg-white text-xs shadow-lg dark:border-white/15 dark:bg-zinc-900">
            {buscando && (
              <li className="px-3 py-2 text-zinc-400">Buscando…</li>
            )}
            {!buscando && resultados.length === 0 && (
              <li className="px-3 py-2 text-zinc-400">Sin resultados</li>
            )}
            {resultados.map((r) => (
              <li key={r.id}>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => ligar(r.id)}
                  disabled={pending}
                  className="block w-full px-3 py-2 text-left hover:bg-black/5 disabled:opacity-60 dark:hover:bg-white/10"
                >
                  {r.nombre}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button onClick={() => setModal(true)} className={btnCls}>
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
        className="w-full max-w-sm rounded-lg border border-black/10 bg-white p-5 text-sm shadow-xl dark:border-white/15 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold">Crear paciente</h3>

        <div className="mt-3 flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="font-medium">Nombre</span>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoFocus
              className={inputCls}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Teléfono (WhatsApp)</span>
            <input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              type="tel"
              inputMode="tel"
              placeholder="10 dígitos"
              className={inputCls}
            />
          </label>

          <p className="rounded-md border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
            📋 Recuerda sacarle su <strong>hoja clínica</strong> cuando llegue —
            entra a su ficha desde la cita.
          </p>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className={btnCls}>
            Cancelar
          </button>
          <button
            onClick={crear}
            disabled={pending || !nombre.trim()}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {pending ? "Creando…" : "Crear y ligar"}
          </button>
        </div>
      </div>
    </div>
  );
}
