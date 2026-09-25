import {
  Cargando,
  Skeleton,
  SkeletonEncabezado,
  SkeletonFilas,
} from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <Cargando que="los pacientes">
      <SkeletonEncabezado accion />
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Skeleton className="h-9 flex-1" />
          <div className="flex gap-3">
            <Skeleton className="h-9 w-full sm:w-52" />
            <Skeleton className="h-9 w-full sm:w-44" />
          </div>
        </div>
        <SkeletonFilas n={8} />
      </div>
    </Cargando>
  );
}
