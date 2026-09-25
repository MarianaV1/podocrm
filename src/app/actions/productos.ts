"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { LIMITES, leerDinero, leerEntero, leerTexto } from "@/lib/validacion";
import { createClient } from "@/lib/supabase/server";

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
}

export async function crearProducto(formData: FormData) {
  await requireAuth();
  const nombre = leerTexto(formData.get("nombre"), LIMITES.nombre);
  const precioVenta = leerDinero(formData.get("precioVenta"));
  if (!nombre || precioVenta === null) return;

  await prisma.producto.create({
    data: {
      nombre,
      precioVenta,
      costo: leerDinero(formData.get("costo")) ?? 0,
      stock: leerEntero(formData.get("stock"), 0, 100_000, 0),
    },
  });
  revalidatePath("/dashboard/productos");
}

export async function editarProducto(id: string, formData: FormData) {
  await requireAuth();
  const nombre = leerTexto(formData.get("nombre"), LIMITES.nombre);
  const precioVenta = leerDinero(formData.get("precioVenta"));
  if (!nombre || precioVenta === null) return;

  await prisma.producto.update({
    where: { id },
    data: {
      nombre,
      precioVenta,
      costo: leerDinero(formData.get("costo")) ?? 0,
      stock: leerEntero(formData.get("stock"), 0, 100_000, 0),
    },
  });
  revalidatePath("/dashboard/productos");
}

export async function toggleActivoProducto(id: string, activo: boolean) {
  await requireAuth();
  await prisma.producto.update({ where: { id }, data: { activo } });
  revalidatePath("/dashboard/productos");
}

// Elimina el producto. Las ventas históricas conservan su monto/utilidad
// (productoId queda en null por onDelete: SetNull).
export async function eliminarProducto(id: string) {
  await requireAuth();
  await prisma.producto.delete({ where: { id } });
  revalidatePath("/dashboard/productos");
}
