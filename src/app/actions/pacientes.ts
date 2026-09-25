"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LIMITES, leerTexto, leerTextoOpcional } from "@/lib/validacion";
import { createClient } from "@/lib/supabase/server";

type ActionState = { error: string } | undefined;

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
}

// Campo de texto largo de la hoja clínica (null si viene vacío).
const texto = (formData: FormData, key: string) =>
  leerTextoOpcional(formData.get(key), LIMITES.textoLargo);

export async function crearPaciente(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAuth();

  const nombre = leerTexto(formData.get("nombre"), LIMITES.nombre);
  if (!nombre) return { error: "El nombre es obligatorio." };

  const paciente = await prisma.paciente.create({
    data: {
      nombre,
      telefono: leerTextoOpcional(formData.get("telefono"), LIMITES.telefono),
    },
  });

  revalidatePath("/dashboard/pacientes");
  redirect(`/dashboard/pacientes/${paciente.id}`);
}

// Crea o actualiza la hoja clínica del paciente (1 por paciente).
// Se enlaza con .bind(null, pacienteId) desde el formulario.
export async function guardarHoja(
  pacienteId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAuth();

  const data = {
    diabetico: formData.get("diabetico") === "on",
    hipertenso: formData.get("hipertenso") === "on",
    otrasCondiciones: texto(formData, "otrasCondiciones"),
    alergias: texto(formData, "alergias"),
    comentarioSalud: texto(formData, "comentarioSalud"),
    motivoConsulta: texto(formData, "motivoConsulta"),
    antecedentes: texto(formData, "antecedentes"),
    observaciones: texto(formData, "observaciones"),
  };

  const existente = await prisma.hojaClinica.findUnique({
    where: { pacienteId },
    select: { id: true },
  });

  if (existente) {
    await prisma.hojaClinica.update({ where: { pacienteId }, data });
  } else {
    // Folio autoincremental (siguiente al mayor existente).
    const ultima = await prisma.hojaClinica.findFirst({
      orderBy: { folio: "desc" },
      select: { folio: true },
    });
    const folio = (ultima?.folio ?? 0) + 1;
    await prisma.hojaClinica.create({ data: { pacienteId, folio, ...data } });
  }

  revalidatePath(`/dashboard/pacientes/${pacienteId}`);
  redirect(`/dashboard/pacientes/${pacienteId}`);
}

// Actualiza solo el teléfono del paciente (edición inline desde la ficha).
export async function actualizarTelefono(pacienteId: string, telefono: string) {
  await requireAuth();
  await prisma.paciente.update({
    where: { id: pacienteId },
    data: { telefono: leerTextoOpcional(telefono, LIMITES.telefono) },
  });
  revalidatePath(`/dashboard/pacientes/${pacienteId}`);
}
