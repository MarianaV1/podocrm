"use client";

import { Compass } from "lucide-react";
import { useTour } from "./tour-provider";

// Relanza el recorrido. Si el visitante lo saltó, un punto pulsante lo invita
// a verlo después.
export function TourBoton() {
  const tour = useTour();
  if (!tour) return null;

  const pulsar = tour.estado === "omitido";

  return (
    <button
      type="button"
      onClick={tour.iniciar}
      data-tour="tour-boton"
      className="relative inline-flex w-full items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
    >
      <Compass size={15} />
      Recorrido guiado
      {pulsar && (
        <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75 motion-reduce:animate-none" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
        </span>
      )}
    </button>
  );
}
