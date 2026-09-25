"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { LIMITES, leerDinero, leerTexto } from "@/lib/validacion";
import { createClient } from "@/lib/supabase/server";

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
}

export async function crearServicio(formData: FormData) {
  await requireAuth();
  const nombre = leerTexto(formData.get("nombre"), LIMITES.nombre);
  const precio = leerDinero(formData.get("precio"));
  if (!nombre || precio === null) return;

  await prisma.servicio.create({ data: { nombre, precio } });
  revalidatePath("/dashboard/servicios");
}

export async function editarServicio(id: string, formData: FormData) {
  await requireAuth();
  const nombre = leerTexto(formData.get("nombre"), LIMITES.nombre);
  const precio = leerDinero(formData.get("precio"));
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
