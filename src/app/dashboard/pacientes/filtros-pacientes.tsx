"use client";

import { useEffect, useEffectEvent, useState, useTransition, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { inputClasses, Select } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { FILTROS_SALUD, ORDENES } from "@/lib/filtros-pacientes";

// Buscador + filtros de pacientes. Guardan su estado en la URL (se puede
// compartir o recargar) y mantienen la lista visible, atenuada, mientras
// llegan los resultados nuevos.
export function FiltrosPacientes({
  q,
  salud,
  orden,
  children,
}: {
  q: string;
  salud: string;
  orden: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pendiente, startTransition] = useTransition();
  const [texto, setTexto] = useState(q);
  // Lo último que pidió el usuario. Los controles lo muestran al instante y las
  // URLs se arman con esto (no con los props, que llegan hasta que carga la
  // página): así dos cambios seguidos no se pisan.
  const [pedido, setPedido] = useState({ q, salud, orden });

  // Si los filtros cambian desde fuera (p. ej. "Limpiar filtros") se
  // sincronizan; mientras hay una búsqueda en curso se espera a que termine.
  const clave = `${q}\u0000${salud}\u0000${orden}`;
  const [clavePrevia, setClavePrevia] = useState(clave);
  if (clave !== clavePrevia && !pendiente) {
    setClavePrevia(clave);
    setPedido({ q, salud, orden });
    if (q !== texto.trim()) setTexto(q);
  }

  function aplicar(cambios: Partial<typeof pedido>) {
    const valores = { ...pedido, ...cambios };
    setPedido(valores);
    const params = new URLSearchParams();
    if (valores.q) params.set("q", valores.q);
    if (valores.salud) params.set("salud", valores.salud);
    if (valores.orden && valores.orden !== "recientes") params.set("orden", valores.orden);
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  // Búsqueda al dejar de escribir (lee siempre los filtros vigentes).
  const buscar = useEffectEvent((limpio: string) => {
    if (limpio !== pedido.q) aplicar({ q: limpio });
  });
  useEffect(() => {
    const t = setTimeout(() => buscar(texto.trim()), 300);
    return () => clearTimeout(t);
  }, [texto]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setTexto("");
            }}
            placeholder="Buscar por nombre o teléfono"
            aria-label="Buscar pacientes por nombre o teléfono"
            className={cn(inputClasses, "pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden")}
          />
          {texto && (
            <button
              type="button"
              onClick={() => setTexto("")}
              aria-label="Borrar búsqueda"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <Select
            value={pedido.salud}
            onChange={(e) => aplicar({ salud: e.target.value })}
            aria-label="Filtrar por salud"
            className="sm:w-52"
          >
            {FILTROS_SALUD.map((f) => (
              <option key={f.valor} value={f.valor}>
                {f.label}
              </option>
            ))}
          </Select>
          <Select
            value={pedido.orden}
            onChange={(e) => aplicar({ orden: e.target.value })}
            aria-label="Ordenar por"
            className="sm:w-44"
          >
            {ORDENES.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div
        aria-busy={pendiente}
        className={cn("transition-opacity", pendiente && "pointer-events-none opacity-60")}
      >
        {children}
      </div>
    </div>
  );
}
