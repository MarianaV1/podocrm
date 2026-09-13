"use server";

import { revalidatePath } from "next/cache";
import { TipoMovimiento } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { rangoDia } from "@/lib/fecha";

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
}

function parseDinero(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").replace(/[^0-9.]/g, "");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Registra una entrada o salida de efectivo. `fecha` = "YYYY-MM-DD" del día del
// corte; el movimiento se guarda al mediodía de ese día (México) para que caiga
// dentro del rango sin importar la hora del servidor.
export async function crearMovimiento(formData: FormData) {
  await requireAuth();
  const concepto = String(formData.get("concepto") ?? "").trim();
  const monto = parseDinero(formData.get("monto"));
  if (!concepto || monto === null) return;

  const tipo =
    String(formData.get("tipo") ?? "") === "ENTRADA"
      ? TipoMovimiento.ENTRADA
      : TipoMovimiento.SALIDA;

  const fechaStr = String(formData.get("fecha") ?? "");
  const { inicio } = rangoDia(fechaStr);
  const fecha = new Date(inicio.getTime() + 12 * 60 * 60 * 1000);

  await prisma.movimientoCaja.create({
    data: { tipo, monto, concepto, fecha },
  });
  revalidatePath("/dashboard/caja");
}

export async function eliminarMovimiento(id: string) {
  await requireAuth();
  await prisma.movimientoCaja.delete({ where: { id } });
  revalidatePath("/dashboard/caja");
}
