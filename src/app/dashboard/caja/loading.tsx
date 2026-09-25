import {
  Cargando,
  Skeleton,
  SkeletonEncabezado,
  SkeletonFormulario,
  SkeletonKpis,
  SkeletonTarjeta,
} from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <Cargando que="el corte de caja" className="mx-auto w-full max-w-3xl">
      <SkeletonEncabezado />
      <Skeleton className="h-9 w-72 max-w-full" />
      <SkeletonKpis n={3} rejilla="grid-cols-1 sm:grid-cols-3" />
      <SkeletonTarjeta className="flex flex-col gap-3 p-5">
        <Skeleton className="h-3 w-40" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-5 w-full" />
        ))}
      </SkeletonTarjeta>
      <SkeletonFormulario />
      <SkeletonTarjeta className="flex flex-col gap-3 p-5">
        <Skeleton className="h-3 w-44" />
        <Skeleton className="h-9 w-36" />
      </SkeletonTarjeta>
    </Cargando>
  );
}
