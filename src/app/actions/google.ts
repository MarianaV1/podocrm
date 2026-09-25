"use server";

import { revalidatePath } from "next/cache";
import { EstadoCita } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sugerirPorNombre } from "@/lib/busqueda-pacientes";
import { LIMITES, leerTexto, leerTextoOpcional } from "@/lib/validacion";
import { createClient } from "@/lib/supabase/server";
import { getAuthedClient, listarEventos } from "@/lib/google";
import { coincidenciaExacta } from "@/lib/matching";

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
  return user.id;
}

// Guarda qué calendario se sincroniza.
export async function seleccionarCalendario(formData: FormData) {
  const userId = await requireUserId();
  const calendarId = String(formData.get("calendarId") ?? "");
  if (!calendarId) return;
  const calendarNombre = String(formData.get("calendarNombre") ?? "") || null;

  await prisma.googleConexion.update({
    where: { userId },
    data: { calendarId, calendarNombre },
  });
  revalidatePath("/dashboard/citas");
}

// Desconecta Google Calendar (borra la conexión guardada).
export async function desconectarGoogle() {
  const userId = await requireUserId();
  await prisma.googleConexion.deleteMany({ where: { userId } });
  revalidatePath("/dashboard/citas");
}

// Trae los eventos del calendario elegido y los guarda/actualiza como Citas.
export async function sincronizarCitas() {
  const userId = await requireUserId();
  const conexion = await prisma.googleConexion.findUnique({ where: { userId } });
  if (!conexion?.calendarId) return;

  const client = getAuthedClient(conexion);
  // Si el access token se refresca, lo persistimos.
  client.on("tokens", (tokens) => {
    void prisma.googleConexion
      .update({
        where: { userId },
        data: {
          accessToken: tokens.access_token ?? conexion.accessToken,
          expiryDate: tokens.expiry_date
            ? new Date(tokens.expiry_date)
            : conexion.expiryDate,
          ...(tokens.refresh_token
            ? { refreshToken: tokens.refresh_token }
            : {}),
        },
      })
      .catch(() => {});
  });

  const eventos = await listarEventos(client, conexion.calendarId);
  const pacientes = await prisma.paciente.findMany({
    select: { id: true, nombre: true },
  });

  for (const ev of eventos) {
    const datos = {
      titulo: ev.summary,
      inicio: new Date(ev.start),
      fin: ev.end ? new Date(ev.end) : null,
    };
    const cita = await prisma.cita.upsert({
      where: { googleEventId: ev.id },
      create: { googleEventId: ev.id, ...datos },
      update: datos, // NO toca estado/pacienteId
      select: { id: true, pacienteId: true },
    });
    // Auto-liga por coincidencia EXACTA y única (seguro; sin adivinar).
    if (!cita.pacienteId) {
      const match = coincidenciaExacta(ev.summary, pacientes);
      if (match) {
        await prisma.cita.update({
          where: { id: cita.id },
          data: { pacienteId: match.id },
        });
      }
    }
  }

  revalidatePath("/dashboard/citas");
}

// ── Estado de la cita ──────────────────────────────────────────────
async function cambiarEstado(citaId: string, estado: EstadoCita) {
  await requireUserId();
  await prisma.cita.update({ where: { id: citaId }, data: { estado } });
  revalidatePath("/dashboard/citas");
}

export async function marcarLlegada(citaId: string) {
  await cambiarEstado(citaId, EstadoCita.LLEGO);
}

export async function marcarLlegadaTarde(citaId: string) {
  await cambiarEstado(citaId, EstadoCita.LLEGO_TARDE);
}

export async function marcarNoShow(citaId: string) {
  await cambiarEstado(citaId, EstadoCita.NO_SHOW);
}

export async function reabrirCita(citaId: string) {
  await cambiarEstado(citaId, EstadoCita.AGENDADA);
}

// ── Ligar / desligar paciente ──────────────────────────────────────
export async function ligarPaciente(citaId: string, formData: FormData) {
  await requireUserId();
  const pacienteId = String(formData.get("pacienteId") ?? "") || null;
  await prisma.cita.update({ where: { id: citaId }, data: { pacienteId } });
  revalidatePath("/dashboard/citas");
}

export async function desligarPaciente(citaId: string) {
  await requireUserId();
  await prisma.cita.update({
    where: { id: citaId },
    data: { pacienteId: null },
  });
  revalidatePath("/dashboard/citas");
}

// Asigna (o quita, con "") la podóloga que atiende la cita.
export async function asignarPodologa(citaId: string, podologaId: string) {
  await requireUserId();
  await prisma.cita.update({
    where: { id: citaId },
    data: { podologaId: podologaId || null },
  });
  revalidatePath("/dashboard/citas");
}

// Busca pacientes por nombre, sin importar acentos (consulta a la BD, máximo 8).
export async function buscarPacientes(
  query: string
): Promise<{ id: string; nombre: string }[]> {
  await requireUserId();
  return sugerirPorNombre(leerTexto(query, LIMITES.nombre));
}

// Liga una cita a un paciente ya existente (por id).
export async function ligarPacientePorId(citaId: string, pacienteId: string) {
  await requireUserId();
  await prisma.cita.update({
    where: { id: citaId },
    data: { pacienteId },
  });
  revalidatePath("/dashboard/citas");
}

// Crea un paciente (nombre + teléfono) y lo liga a la cita.
export async function crearPacienteYLigar(
  citaId: string,
  nombre: string,
  telefono: string
) {
  await requireUserId();
  const n = leerTexto(nombre, LIMITES.nombre);
  if (!n) return;
  const paciente = await prisma.paciente.create({
    data: { nombre: n, telefono: leerTextoOpcional(telefono, LIMITES.telefono) },
  });
  await prisma.cita.update({
    where: { id: citaId },
    data: { pacienteId: paciente.id },
  });
  revalidatePath("/dashboard/citas");
}
