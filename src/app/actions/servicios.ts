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

export async function crearServicio(formData: FormData) {
  await requireAuth();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const precio = parseDinero(formData.get("precio"));
  if (!nombre || precio === null) return;

  await prisma.servicio.create({ data: { nombre, precio } });
  revalidatePath("/dashboard/servicios");
}

export async function editarServicio(id: string, formData: FormData) {
  await requireAuth();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const precio = parseDinero(formData.get("precio"));
  if (!nombre || precio === null) return;

  await prisma.servicio.update({ where: { id }, data: { nombre, precio } });
  revalidatePath("/dashboard/servicios");
}

export async function toggleActivoServicio(id: string, activo: boolean) {
  await requireAuth();
  await prisma.servicio.update({ where: { id }, data: { activo } });
  revalidatePath("/dashboard/servicios");
}

// Elimina el servicio. Los pagos históricos NO se borran: su servicioId queda
// en null (onDelete: SetNull) y conservan su monto/comisión para reportes.
export async function eliminarServicio(id: string) {
  await requireAuth();
  await prisma.servicio.delete({ where: { id } });
  revalidatePath("/dashboard/servicios");
}
