import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { crearProducto } from "@/app/actions/productos";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductoItem } from "./producto-item";

export const metadata: Metadata = { title: "Productos" };

export default async function ProductosPage() {
  const productos = await prisma.producto.findMany({
    orderBy: [{ activo: "desc" }, { nombre: "asc" }],
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader
        title="Productos"
        subtitle="Productos de venta (desinfectantes, cremas, etc.). No generan comisión; se registra costo, utilidad e inventario."
      />

      <form
        action={crearProducto}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4"
      >
        <Field label="Nombre" className="flex-1">
          <Input name="nombre" required placeholder="Desinfectante, crema…" />
        </Field>
        <Field label="Precio venta" className="w-24">
          <Input name="precioVenta" required inputMode="decimal" placeholder="120" />
        </Field>
        <Field label="Costo" className="w-24">
          <Input name="costo" inputMode="decimal" placeholder="70" />
        </Field>
        <Field label="Stock" className="w-20">
          <Input name="stock" inputMode="numeric" placeholder="0" />
        </Field>
        <Button type="submit">Agregar</Button>
      </form>

      {productos.length === 0 ? (
        <EmptyState>Aún no hay productos. Agrega el primero arriba.</EmptyState>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface">
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
