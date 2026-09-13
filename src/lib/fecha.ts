// Utilidades de fecha para el corte de caja y reportes.
// La clínica está en México (America/Mexico_City, UTC-6 sin horario de verano
// desde 2022). Interpretamos las fechas "YYYY-MM-DD" como días de calendario
// en esa zona para que el corte agrupe bien los pagos de cada día local.

const MX_OFFSET = "-06:00";
const TZ = "America/Mexico_City";

// Fecha de hoy en México como "YYYY-MM-DD" (en-CA formatea ISO-like).
export function hoyMX(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

// Primer día del mes actual (en México) como "YYYY-MM-DD".
export function inicioDeMesMX(): string {
  return hoyMX().slice(0, 8) + "01";
}

// Rango [inicio, fin) que cubre el día local indicado (00:00 a 24:00 México).
export function rangoDia(fecha: string): { inicio: Date; fin: Date } {
  const inicio = new Date(`${fecha}T00:00:00${MX_OFFSET}`);
  const fin = new Date(inicio.getTime() + 24 * 60 * 60 * 1000);
  return { inicio, fin };
}

// Rango [inicio, fin) que cubre desde el día `desde` hasta el final de `hasta`.
export function rangoFechas(
  desde: string,
  hasta: string
): { inicio: Date; fin: Date } {
  const inicio = new Date(`${desde}T00:00:00${MX_OFFSET}`);
  const finDia = new Date(`${hasta}T00:00:00${MX_OFFSET}`);
  const fin = new Date(finDia.getTime() + 24 * 60 * 60 * 1000);
  return { inicio, fin };
}

// Formatea "YYYY-MM-DD" de forma legible (ej. "vie 12 sep 2026").
export function fechaLegible(fecha: string): string {
  const { inicio } = rangoDia(fecha);
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TZ,
  }).format(inicio);
}
