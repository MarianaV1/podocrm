"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sumarDiasKey } from "@/lib/fecha";

export function SelectorDia({ fecha, hoy }: { fecha: string; hoy: string }) {
  const router = useRouter();
  const ir = (f: string) => router.push(`/dashboard/caja?fecha=${f}`);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" onClick={() => ir(sumarDiasKey(fecha, -1))}>
        <ChevronLeft size={16} />
        Anterior
      </Button>
      {/* El ancho va en el contenedor: el Input ocupa el 100% de su padre. */}
      <div className="w-44">
        <Input
          type="date"
          value={fecha}
          onChange={(e) => e.target.value && ir(e.target.value)}
          aria-label="Elegir día"
        />
      </div>
      <Button variant="outline" onClick={() => ir(sumarDiasKey(fecha, 1))}>
        Siguiente
        <ChevronRight size={16} />
      </Button>
      {fecha !== hoy && (
        <Button variant="ghost" onClick={() => ir(hoy)}>
          Hoy
        </Button>
      )}
    </div>
  );
}
