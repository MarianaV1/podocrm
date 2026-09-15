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
      className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-foreground outline-none transition-colors focus:border-primary disabled:opacity-60"
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
