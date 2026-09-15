"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
      <Button variant="outline" onClick={() => ir(sumarDias(fecha, -1))}>
        <ChevronLeft size={16} />
        Anterior
      </Button>
      <Input
        type="date"
        value={fecha}
        onChange={(e) => e.target.value && ir(e.target.value)}
        className="w-auto"
      />
      <Button variant="outline" onClick={() => ir(sumarDias(fecha, 1))}>
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
