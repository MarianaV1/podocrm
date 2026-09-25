import {
  Cargando,
  Skeleton,
  SkeletonTarjeta,
} from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <Cargando que="el formulario" className="mx-auto w-full max-w-2xl">
      <Skeleton className="h-7 w-48" />
      <SkeletonTarjeta className="flex flex-col gap-5 p-5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
        <Skeleton className="h-9 w-28" />
      </SkeletonTarjeta>
    </Cargando>
  );
}
