import {
  Cargando,
  Skeleton,
  SkeletonEncabezado,
  SkeletonFilas,
  SkeletonFormulario,
} from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <Cargando que="el reporte" className="mx-auto w-full max-w-3xl">
      <SkeletonEncabezado accion />
      <SkeletonFormulario />
      <Skeleton className="h-3 w-36" />
      <SkeletonFilas n={8} />
    </Cargando>
  );
}
