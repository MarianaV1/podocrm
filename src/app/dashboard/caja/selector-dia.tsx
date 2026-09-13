"use client";

import { useRouter } from "next/navigation";

const btnCls =
  "rounded-md border border-black/10 px-2.5 py-1.5 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10";

// Suma días a "YYYY-MM-DD" y devuelve otra cadena "YYYY-MM-DD".
function sumarDias(fecha: string, dias: number): string {
  const [y, m, d] = fecha.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + dias);
  return dt.toISOString().slice(0, 10);
}

export function SelectorDia({ fecha, hoy }: { fecha: string; hoy: string }) {
  const router = useRouter();
  const ir = (f: string) => router.push(`/dashboard/caja?fecha=${f}`);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={() => ir(sumarDias(fecha, -1))} className={btnCls}>
        ← Día anterior
      </button>
      <input
        type="date"
        value={fecha}
        onChange={(e) => e.target.value && ir(e.target.value)}
        className="rounded-md border border-black/10 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:bg-zinc-900"
      />
      <button onClick={() => ir(sumarDias(fecha, 1))} className={btnCls}>
        Día siguiente →
      </button>
      {fecha !== hoy && (
        <button onClick={() => ir(hoy)} className={btnCls}>
          Hoy
        </button>
      )}
    </div>
  );
}
