"use server";

import { revalidatePath } from "next/cache";
import { TipoMovimiento } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { rangoDia } from "@/lib/fecha";
import { LIMITES, leerDinero, leerTexto } from "@/lib/validacion";

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
}

// Registra una entrada o salida de efectivo. `fecha` = "YYYY-MM-DD" del día del
// corte; el movimiento se guarda al mediodía de ese día (México) para que caiga
// dentro del rango sin importar la hora del servidor.
export async function crearMovimiento(formData: FormData) {
  await requireAuth();
  const concepto = leerTexto(formData.get("concepto"), LIMITES.concepto);
  const monto = leerDinero(formData.get("monto"));
  if (!concepto || monto === null || monto === 0) return;

  const tipo =
    String(formData.get("tipo") ?? "") === "ENTRADA"
      ? TipoMovimiento.ENTRADA
      : TipoMovimiento.SALIDA;

  const fechaStr = String(formData.get("fecha") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) return;
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
