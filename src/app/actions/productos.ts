"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
}

// Convierte "1,250.50" o "1250.5" a número; null si no es válido.
function parseDinero(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").replace(/[^0-9.]/g, "");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function parseEntero(v: FormDataEntryValue | null): number {
  const s = String(v ?? "").replace(/[^0-9-]/g, "");
  const n = Math.round(Number(s));
  return Number.isFinite(n) ? n : 0;
}

export async function crearProducto(formData: FormData) {
  await requireAuth();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const precioVenta = parseDinero(formData.get("precioVenta"));
  if (!nombre || precioVenta === null) return;

  await prisma.producto.create({
    data: {
      nombre,
      precioVenta,
      costo: parseDinero(formData.get("costo")) ?? 0,
      stock: parseEntero(formData.get("stock")),
    },
  });
  revalidatePath("/dashboard/productos");
}

export async function editarProducto(id: string, formData: FormData) {
  await requireAuth();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const precioVenta = parseDinero(formData.get("precioVenta"));
  if (!nombre || precioVenta === null) return;

  await prisma.producto.update({
    where: { id },
    data: {
      nombre,
      precioVenta,
      costo: parseDinero(formData.get("costo")) ?? 0,
      stock: parseEntero(formData.get("stock")),
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
