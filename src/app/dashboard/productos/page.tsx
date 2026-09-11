import { prisma } from "@/lib/prisma";
import { crearProducto } from "@/app/actions/productos";
import { ProductoItem } from "./producto-item";

export default async function ProductosPage() {
  const productos = await prisma.producto.findMany({
    orderBy: [{ activo: "desc" }, { nombre: "asc" }],
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Productos</h1>
        <p className="text-sm text-zinc-500">
          Productos de venta (desinfectantes, cremas, etc.). No generan comisión;
          se registra costo, utilidad e inventario.
        </p>
      </div>

      <form
        action={crearProducto}
        className="flex flex-wrap items-end gap-2 rounded-lg border border-black/10 p-4 dark:border-white/10"
      >
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-xs text-zinc-500">Nombre</span>
          <input
            name="nombre"
            required
            placeholder="Desinfectante, crema, etc."
            className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:bg-zinc-900"
          />
        </label>
        <label className="flex w-24 flex-col gap-1">
          <span className="text-xs text-zinc-500">Precio venta</span>
          <input
            name="precioVenta"
            required
            inputMode="decimal"
            placeholder="120"
            className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:bg-zinc-900"
          />
        </label>
        <label className="flex w-24 flex-col gap-1">
          <span className="text-xs text-zinc-500">Costo</span>
          <input
            name="costo"
            inputMode="decimal"
            placeholder="70"
            className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:bg-zinc-900"
          />
        </label>
        <label className="flex w-20 flex-col gap-1">
          <span className="text-xs text-zinc-500">Stock</span>
          <input
            name="stock"
            inputMode="numeric"
            placeholder="0"
            className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:bg-zinc-900"
          />
        </label>
        <button className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">
          Agregar
        </button>
      </form>

      {productos.length === 0 ? (
        <p className="rounded-md border border-dashed border-black/15 p-8 text-center text-sm text-zinc-500 dark:border-white/15">
          Aún no hay productos. Agrega el primero arriba.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-black/5 rounded-lg border border-black/10 dark:divide-white/10 dark:border-white/10">
          {productos.map((p) => (
            <ProductoItem
              key={p.id}
              producto={{
                id: p.id,
                nombre: p.nombre,
                precioVenta: Number(p.precioVenta),
                costo: Number(p.costo),
                stock: p.stock,
                activo: p.activo,
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
