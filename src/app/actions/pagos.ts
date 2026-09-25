"use server";

import { revalidatePath } from "next/cache";
import { MetodoPago } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { LIMITES, leerDinero, leerEntero, leerTextoOpcional } from "@/lib/validacion";
import { createClient } from "@/lib/supabase/server";

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
}

function metodoDe(v: FormDataEntryValue | null): MetodoPago {
  return String(v ?? "") === "TARJETA"
    ? MetodoPago.TARJETA
    : MetodoPago.EFECTIVO;
}

function revalidar() {
  revalidatePath("/dashboard/citas");
  revalidatePath("/dashboard/podologas");
  revalidatePath("/dashboard/productos");
}

// Registra un cobro. `tipo` = "servicio" (comisión de la podóloga) o
// "producto" (venta con utilidad + descuento de inventario, sin comisión).
export async function registrarPago(formData: FormData) {
  await requireAuth();

  const tipo = String(formData.get("tipo") ?? "servicio");
  const monto = leerDinero(formData.get("monto"));
  if (monto === null) return { error: "Monto inválido." };

  const metodo = metodoDe(formData.get("metodo"));
  const citaId = String(formData.get("citaId") ?? "") || null;
  const notas = leerTextoOpcional(formData.get("notas"), LIMITES.textoLargo);

  if (tipo === "producto") {
    const productoId = String(formData.get("productoId") ?? "") || null;
    if (!productoId) return { error: "Selecciona un producto." };
    const cantidad = leerEntero(formData.get("cantidad"), 1, 1000, 1);

    const producto = await prisma.producto.findUnique({
      where: { id: productoId },
      select: { costo: true },
    });
    // Utilidad = ingreso − costo total (snapshot).
    const costoTotal = Number(producto?.costo ?? 0) * cantidad;
    const utilidad = monto - costoTotal;

    await prisma.$transaction([
      prisma.pago.create({
        data: {
          monto,
          metodo,
          comision: 0,
          utilidad,
          cantidad,
          productoId,
          citaId,
          notas,
        },
      }),
      // Descontar del inventario.
      prisma.producto.update({
        where: { id: productoId },
        data: { stock: { decrement: cantidad } },
      }),
    ]);

    revalidar();
    return;
  }

  // tipo === "servicio"
  const servicioId = String(formData.get("servicioId") ?? "") || null;
  const podologaId = String(formData.get("podologaId") ?? "") || null;

  let comision = leerDinero(formData.get("comision"));
  if (comision === null) {
    // Respaldo: calcular con el % FIJO de la podóloga si no se envió comisión.
    if (podologaId) {
      const pod = await prisma.podologa.findUnique({
        where: { id: podologaId },
        select: { comisionPct: true },
      });
      comision = pod ? (monto * pod.comisionPct) / 100 : 0;
    } else {
      comision = 0;
    }
  }

  await prisma.pago.create({
    data: { monto, metodo, comision, servicioId, podologaId, citaId, notas },
  });

  revalidar();
}

export async function eliminarPago(id: string) {
  await requireAuth();
  // Si era venta de producto, devolver el stock al inventario.
  const pago = await prisma.pago.findUnique({
    where: { id },
    select: { productoId: true, cantidad: true },
  });

  if (pago?.productoId) {
    await prisma.$transaction([
      prisma.pago.delete({ where: { id } }),
      prisma.producto.update({
        where: { id: pago.productoId },
        data: { stock: { increment: pago.cantidad } },
      }),
    ]);
  } else {
    await prisma.pago.delete({ where: { id } });
  }

  revalidar();
}
