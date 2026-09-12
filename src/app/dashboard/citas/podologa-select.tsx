"use client";

import { useTransition } from "react";
import { asignarPodologa } from "@/app/actions/google";

type Opt = { id: string; nombre: string };

export function PodologaSelect({
  citaId,
  podologaId,
  podologas,
}: {
  citaId: string;
  podologaId: string | null;
  podologas: Opt[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={podologaId ?? ""}
      disabled={pending}
      onChange={(e) =>
        startTransition(() => asignarPodologa(citaId, e.target.value))
      }
      className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs outline-none disabled:opacity-60 dark:border-white/15 dark:bg-zinc-900"
    >
      <option value="">— Podóloga —</option>
      {podologas.map((p) => (
        <option key={p.id} value={p.id}>
          {p.nombre}
        </option>
      ))}
    </select>
  );
}
