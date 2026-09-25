import {
  Cargando,
  Skeleton,
  SkeletonEncabezado,
  SkeletonGrafica,
  SkeletonKpis,
  SkeletonTarjeta,
} from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <Cargando que="el panel">
      <div className="flex flex-col gap-8">
        <SkeletonEncabezado />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-3 w-44" />
          <SkeletonKpis />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-52" />
            <Skeleton className="h-9 w-56" />
          </div>
          <SkeletonKpis />
          <SkeletonGrafica />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <SkeletonTarjeta key={i} className="flex flex-col gap-4 p-5">
                <Skeleton className="h-4 w-28" />
                {[0, 1, 2].map((j) => (
                  <div key={j} className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2 w-3/4" />
                  </div>
                ))}
              </SkeletonTarjeta>
            ))}
          </div>
        </div>
      </div>
    </Cargando>
  );
}
