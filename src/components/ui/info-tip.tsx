import { Info } from "lucide-react";
import { cn } from "@/lib/cn";

const alineaciones = {
  start: "left-0",
  center: "left-1/2 -translate-x-1/2",
  end: "right-0",
};

// Ayuda contextual: ícono (i) con un tooltip que aparece al pasar el cursor o
// al enfocarlo (teclado, o toque en móvil). Solo CSS: sirve en server components.
// No usar dentro de <label>: un elemento enfocable ahí le roba el foco al input.
export function InfoTip({
  texto,
  align = "center",
  className,
}: {
  texto: string;
  align?: keyof typeof alineaciones;
  className?: string;
}) {
  return (
    <span
      tabIndex={0}
      role="note"
      aria-label={texto}
      className={cn(
        "group relative inline-flex cursor-help align-middle text-muted outline-none transition-colors hover:text-foreground focus-visible:text-primary",
        className
      )}
    >
      <Info size={14} aria-hidden />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute bottom-full z-20 mb-1.5 hidden w-52 rounded-md bg-zinc-900 px-2.5 py-1.5 text-left text-xs font-normal normal-case leading-snug tracking-normal text-white shadow-lg group-hover:block group-focus:block sm:w-60 dark:bg-zinc-700",
          alineaciones[align]
        )}
      >
        {texto}
      </span>
    </span>
  );
}
