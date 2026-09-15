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

// ─── Agrupación por día / semana (para ordenar listas de citas) ──────

// Clave de día "YYYY-MM-DD" (en México) para una fecha cualquiera.
export function claveDia(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
}

// Suma días a una clave "YYYY-MM-DD" (aritmética estable en UTC).
export function sumarDiasKey(key: string, n: number): string {
  const dt = new Date(`${key}T00:00:00Z`);
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

// Lunes de la semana que contiene la clave de día dada.
export function lunesDeSemana(key: string): string {
  const dow = new Date(`${key}T00:00:00Z`).getUTCDay(); // 0=Dom … 6=Sáb
  return sumarDiasKey(key, -((dow + 6) % 7));
}

// Etiqueta de día: "Hoy" / "Mañana" / "Ayer" / "viernes 12 sep".
export function etiquetaDia(key: string, hoy: string): string {
  if (key === hoy) return "Hoy";
  if (key === sumarDiasKey(hoy, 1)) return "Mañana";
  if (key === sumarDiasKey(hoy, -1)) return "Ayer";
  const { inicio } = rangoDia(key);
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: TZ,
  }).format(inicio);
}

// Etiqueta de semana relativa + rango (ej. "Esta semana · 8 – 14 sep").
export function etiquetaSemana(lunes: string, hoy: string): string {
  const lunesHoy = lunesDeSemana(hoy);
  const fmtDia = (k: string) =>
    new Intl.DateTimeFormat("es-MX", {
      day: "numeric",
      month: "short",
      timeZone: TZ,
    }).format(rangoDia(k).inicio);
  const rango = `${fmtDia(lunes)} – ${fmtDia(sumarDiasKey(lunes, 6))}`;
  if (lunes === lunesHoy) return `Esta semana · ${rango}`;
  if (lunes === sumarDiasKey(lunesHoy, 7)) return `Próxima semana · ${rango}`;
  if (lunes === sumarDiasKey(lunesHoy, -7)) return `Semana pasada · ${rango}`;
  return `Semana del ${rango}`;
}
