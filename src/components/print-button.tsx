"use client";

export function PrintButton({ label = "Imprimir" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="no-print rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      🖨️ {label}
    </button>
  );
}
