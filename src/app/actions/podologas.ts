"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { LIMITES, leerEntero, leerTexto } from "@/lib/validacion";
import { createClient } from "@/lib/supabase/server";

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
}

export async function crearPodologa(formData: FormData) {
  await requireAuth();
  const nombre = leerTexto(formData.get("nombre"), LIMITES.nombre);
  if (!nombre) return;
  await prisma.podologa.create({
    data: { nombre, comisionPct: leerEntero(formData.get("comisionPct"), 0, 100, 30) },
  });
  revalidatePath("/dashboard/podologas");
}

export async function editarPodologa(id: string, formData: FormData) {
  await requireAuth();
  const nombre = leerTexto(formData.get("nombre"), LIMITES.nombre);
  if (!nombre) return;
  await prisma.podologa.update({
    where: { id },
    data: { nombre, comisionPct: leerEntero(formData.get("comisionPct"), 0, 100, 30) },
  });
  revalidatePath("/dashboard/podologas");
}

export async function toggleActivaPodologa(id: string, activa: boolean) {
  await requireAuth();
  await prisma.podologa.update({ where: { id }, data: { activa } });
  revalidatePath("/dashboard/podologas");
}
