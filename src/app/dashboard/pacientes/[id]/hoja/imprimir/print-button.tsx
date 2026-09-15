"use client";

import { Printer } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className={buttonClasses("primary")}
    >
      <Printer size={16} /> Imprimir / Guardar PDF
    </button>
  );
}
