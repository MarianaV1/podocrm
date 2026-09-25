import {
  Cargando,
  Skeleton,
  SkeletonEncabezado,
  SkeletonTarjeta,
} from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <Cargando que="las citas">
      <SkeletonEncabezado />
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-48" />
      </div>
      <Skeleton className="h-4 w-56" />
      {[0, 1, 2].map((i) => (
        <SkeletonTarjeta key={i} className="flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-7 w-64 max-w-full" />
          </div>
          <div className="flex gap-6 border-t border-border pt-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-44" />
          </div>
          <div className="flex justify-between border-t border-border pt-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-7 w-32" />
          </div>
        </SkeletonTarjeta>
      ))}
    </Cargando>
  );
}
