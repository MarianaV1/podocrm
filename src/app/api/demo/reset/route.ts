import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { IS_DEMO } from "@/lib/demo";
import { sembrarDemo } from "@/lib/seed-demo";

// Reseteo periódico de la demo (lo llama el cron de Vercel).
// Protegido: solo en modo demo y con el secreto CRON_SECRET.
export async function GET(request: Request) {
  if (!IS_DEMO) {
    return NextResponse.json({ error: "No disponible" }, { status: 404 });
  }

  // Sin CRON_SECRET configurado la ruta queda cerrada (nadie puede resetear).
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const resumen = await sembrarDemo(prisma);
  return NextResponse.json({ ok: true, resumen });
}
