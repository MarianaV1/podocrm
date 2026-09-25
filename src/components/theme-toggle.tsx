"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";

type Tema = "light" | "dark";

// El tema vive en <html data-theme>, que fija el script del layout antes del
// primer paint. Este componente solo lo lee y lo cambia.
const oyentes = new Set<() => void>();

function suscribir(cb: () => void) {
  oyentes.add(cb);
  return () => {
    oyentes.delete(cb);
  };
}

const leerTema = (): Tema =>
  document.documentElement.dataset.theme === "dark" ? "dark" : "light";

export function ThemeToggle({ className }: { className?: string }) {
  // En el servidor no se conoce el tema: null hasta hidratar.
  const tema = useSyncExternalStore<Tema | null>(suscribir, leerTema, () => null);

  function toggle() {
    const siguiente: Tema = leerTema() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = siguiente;
    try {
      localStorage.setItem("theme", siguiente);
    } catch {}
    oyentes.forEach((cb) => cb());
  }

  const esOscuro = tema === "dark";

  return (
    <button
      onClick={toggle}
      aria-label="Cambiar tema"
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground",
        className
      )}
    >
      {esOscuro ? <Sun size={15} /> : <Moon size={15} />}
      <span>{esOscuro ? "Claro" : "Oscuro"}</span>
    </button>
  );
}
