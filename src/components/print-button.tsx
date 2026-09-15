"use client";

import { Printer } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";

export function PrintButton({ label = "Imprimir" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className={buttonClasses("primary", "md", "no-print")}
    >
      <Printer size={16} />
      {label}
    </button>
  );
}
