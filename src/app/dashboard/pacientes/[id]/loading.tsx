import {
  Cargando,
  Skeleton,
  SkeletonTarjeta,
} from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <Cargando que="la ficha del paciente" className="mx-auto w-full max-w-3xl">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-7 w-56" />
      </div>
      <SkeletonTarjeta className="flex items-center gap-4 p-5">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-9 w-40" />
      </SkeletonTarjeta>
      <SkeletonTarjeta className="flex flex-col gap-4 p-5">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </SkeletonTarjeta>
      <SkeletonTarjeta className="flex flex-col gap-3 p-5">
        <Skeleton className="h-3 w-20" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex justify-between">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </SkeletonTarjeta>
    </Cargando>
  );
}
