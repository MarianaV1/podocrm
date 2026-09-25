import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

// Estados de carga (loading.tsx). Imitan la forma de cada página para que al
// llegar el contenido no haya saltos de layout.

export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div
      aria-hidden
      style={style}
      className={cn("animate-pulse rounded-md bg-surface-2 motion-reduce:animate-none", className)}
    />
  );
}

// Contenedor: anuncia la carga a lectores de pantalla.
export function Cargando({
  que,
  className,
  children,
}: {
  que: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div role="status" aria-busy="true" className={cn("flex flex-col gap-6", className)}>
      <span className="sr-only">Cargando {que}…</span>
      {children}
    </div>
  );
}

export function SkeletonEncabezado({ accion = false }: { accion?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-64 max-w-[60vw]" />
      </div>
      {accion && <Skeleton className="h-9 w-36" />}
    </div>
  );
}

export function SkeletonTarjeta({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <div aria-hidden className={cn("rounded-xl border border-border bg-surface", className)}>
      {children}
    </div>
  );
}

export function SkeletonKpis({
  n = 4,
  rejilla = "grid-cols-2 lg:grid-cols-4",
}: {
  n?: number;
  rejilla?: string;
}) {
  return (
    <div className={cn("grid gap-4", rejilla)}>
      {Array.from({ length: n }, (_, i) => (
        <SkeletonTarjeta key={i} className="p-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-7 w-28" />
        </SkeletonTarjeta>
      ))}
    </div>
  );
}

export function SkeletonFilas({ n = 6, className }: { n?: number; className?: string }) {
  return (
    <SkeletonTarjeta className={className}>
      <div className="border-b border-border bg-surface-2/50 px-4 py-3">
        <Skeleton className="h-3 w-1/3" />
      </div>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-border/60 px-4 py-3.5 last:border-0">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="ml-auto h-4 w-16" />
        </div>
      ))}
    </SkeletonTarjeta>
  );
}

// Formulario en línea (alta de servicios, podólogas, filtros…).
export function SkeletonFormulario() {
  return (
    <SkeletonTarjeta className="flex flex-wrap items-end gap-3 p-4">
      <div className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-9 w-full" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-9 w-28" />
      </div>
      <Skeleton className="h-9 w-24" />
    </SkeletonTarjeta>
  );
}

// Columnas de gráfica con alturas fijas (no aleatorias: evita diferencias de
// hidratación y se ve igual cada vez).
const ALTURAS = [55, 70, 48, 82, 64, 40, 74, 58, 90, 66, 50, 78, 62, 86];

export function SkeletonGrafica() {
  return (
    <SkeletonTarjeta className="p-5">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-2 h-3 w-64 max-w-full" />
      <div className="mt-6 flex h-[200px] items-end gap-2 pl-12">
        {ALTURAS.map((h, i) => (
          <Skeleton key={i} className="flex-1 rounded-b-none" style={{ height: `${h}%` }} />
        ))}
      </div>
    </SkeletonTarjeta>
  );
}

// Página de catálogo (servicios, productos, podólogas): encabezado, alta y lista.
export function SkeletonCatalogo({ que }: { que: string }) {
  return (
    <Cargando que={que} className="mx-auto w-full max-w-2xl">
      <SkeletonEncabezado />
      <SkeletonFormulario />
      <SkeletonFilas n={5} />
    </Cargando>
  );
}
