import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { normalizar } from "./matching";
import { POR_PAGINA, type leerFiltros } from "./filtros-pacientes";

// Búsqueda y filtros de la lista de pacientes, resueltos en la base de datos
// (paginada) para que escale a miles de registros.

// Quita acentos en SQL igual que `normalizar` en JS (sin extensiones de Postgres).
const sinAcentos = (col: Prisma.Sql) =>
  Prisma.sql`translate(lower(${col}), 'áéíóúüñ', 'aeiouun')`;

export async function buscarPacientes(f: ReturnType<typeof leerFiltros>) {
  const condiciones: Prisma.Sql[] = [];

  const texto = normalizar(f.q);
  const digitos = f.q.replace(/\D/g, "");
  if (texto || digitos) {
    const opciones: Prisma.Sql[] = [];
    if (texto) opciones.push(Prisma.sql`${sinAcentos(Prisma.sql`p.nombre`)} LIKE ${`%${texto}%`}`);
    if (digitos.length >= 3) {
      opciones.push(
        Prisma.sql`regexp_replace(coalesce(p.telefono, ''), '\\D', '', 'g') LIKE ${`%${digitos}%`}`
      );
    }
    if (opciones.length) condiciones.push(Prisma.sql`(${Prisma.join(opciones, " OR ")})`);
  }

  if (f.salud === "alertas") {
    condiciones.push(Prisma.sql`(h.diabetico OR h.hipertenso
      OR nullif(h."otrasCondiciones", '') IS NOT NULL
      OR nullif(h."comentarioSalud", '') IS NOT NULL
      OR nullif(h.alergias, '') IS NOT NULL)`);
  } else if (f.salud === "diabetico") {
    condiciones.push(Prisma.sql`h.diabetico`);
  } else if (f.salud === "hipertenso") {
    condiciones.push(Prisma.sql`h.hipertenso`);
  } else if (f.salud === "sin-hoja") {
    condiciones.push(Prisma.sql`h.id IS NULL`);
  }

  const where = condiciones.length
    ? Prisma.sql`WHERE ${Prisma.join(condiciones, " AND ")}`
    : Prisma.empty;

  const orden =
    f.orden === "nombre"
      ? Prisma.sql`p.nombre ASC`
      : f.orden === "visita"
        ? Prisma.sql`"ultimaVisita" DESC NULLS LAST, p.nombre ASC`
        : Prisma.sql`p."createdAt" DESC`;

  const [filas, [{ total }], [{ todos }]] = await Promise.all([
    prisma.$queryRaw<{ id: string; ultimaVisita: Date | null }[]>`
      SELECT p.id,
        (SELECT max(c.inicio) FROM "Cita" c
          WHERE c."pacienteId" = p.id AND c.estado IN ('LLEGO', 'LLEGO_TARDE')) AS "ultimaVisita"
      FROM "Paciente" p
      LEFT JOIN "HojaClinica" h ON h."pacienteId" = p.id
      ${where}
      ORDER BY ${orden}
      LIMIT ${POR_PAGINA} OFFSET ${(f.pagina - 1) * POR_PAGINA}`,
    prisma.$queryRaw<{ total: number }[]>`
      SELECT count(*)::int AS total
      FROM "Paciente" p
      LEFT JOIN "HojaClinica" h ON h."pacienteId" = p.id
      ${where}`,
    prisma.$queryRaw<{ todos: number }[]>`SELECT count(*)::int AS todos FROM "Paciente"`,
  ]);

  // Datos completos de la página, en el mismo orden que la consulta.
  const detalles = await prisma.paciente.findMany({
    where: { id: { in: filas.map((r) => r.id) } },
    include: {
      hojaClinica: {
        select: {
          folio: true,
          diabetico: true,
          hipertenso: true,
          otrasCondiciones: true,
          comentarioSalud: true,
          alergias: true,
        },
      },
    },
  });
  const porId = new Map(detalles.map((p) => [p.id, p]));
  const pacientes = filas.flatMap((r) => {
    const p = porId.get(r.id);
    return p ? [{ ...p, ultimaVisita: r.ultimaVisita }] : [];
  });

  return {
    pacientes,
    total,
    todos,
    paginas: Math.max(1, Math.ceil(total / POR_PAGINA)),
  };
}
