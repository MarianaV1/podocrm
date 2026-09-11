import { prisma } from "@/lib/prisma";
import { crearServicio } from "@/app/actions/servicios";
import { ServicioItem } from "./servicio-item";

export default async function ServiciosPage() {
  const servicios = await prisma.servicio.findMany({
    orderBy: [{ activo: "desc" }, { nombre: "asc" }],
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Servicios</h1>
        <p className="text-sm text-zinc-500">
          Lo que realizan las podólogas (Consulta, uñas, etc.). Generan comisión
          según el % de cada podóloga.
        </p>
      </div>

      <form
        action={crearServicio}
        className="flex flex-wrap items-end gap-2 rounded-lg border border-black/10 p-4 dark:border-white/10"
      >
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-xs text-zinc-500">Nombre</span>
          <input
            name="nombre"
            required
            placeholder="Consulta, uñas, etc."
            className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:bg-zinc-900"
          />
        </label>
        <label className="flex w-28 flex-col gap-1">
          <span className="text-xs text-zinc-500">Precio</span>
          <input
            name="precio"
            required
            inputMode="decimal"
            placeholder="380"
            className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:bg-zinc-900"
          />
        </label>
        <button className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">
          Agregar
        </button>
      </form>

      {servicios.length === 0 ? (
        <p className="rounded-md border border-dashed border-black/15 p-8 text-center text-sm text-zinc-500 dark:border-white/15">
          Aún no hay servicios. Agrega el primero arriba.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-black/5 rounded-lg border border-black/10 dark:divide-white/10 dark:border-white/10">
          {servicios.map((s) => (
            <ServicioItem
              key={s.id}
              servicio={{
                id: s.id,
                nombre: s.nombre,
                precio: Number(s.precio),
                activo: s.activo,
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
