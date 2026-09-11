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

// % de comisión entre 0 y 100 (default 30 si no viene un valor válido).
function parsePct(v: FormDataEntryValue | null, fallback = 30): number {
  const s = String(v ?? "").replace(/[^0-9]/g, "");
  if (!s) return fallback;
  const n = Math.round(Number(s));
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n > 100 ? 100 : n;
}

export async function crearPodologa(formData: FormData) {
  await requireAuth();
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return;
  await prisma.podologa.create({
    data: { nombre, comisionPct: parsePct(formData.get("comisionPct")) },
  });
  revalidatePath("/dashboard/podologas");
}

export async function editarPodologa(id: string, formData: FormData) {
  await requireAuth();
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return;
  await prisma.podologa.update({
    where: { id },
    data: { nombre, comisionPct: parsePct(formData.get("comisionPct")) },
  });
  revalidatePath("/dashboard/podologas");
}

export async function toggleActivaPodologa(id: string, activa: boolean) {
  await requireAuth();
  await prisma.podologa.update({ where: { id }, data: { activa } });
  revalidatePath("/dashboard/podologas");
}
