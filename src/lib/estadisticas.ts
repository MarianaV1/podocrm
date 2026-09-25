import { prisma } from "./prisma";
import { hoyMX, lunesDeSemana, rangoDia, sumarDiasKey, claveDia } from "./fecha";

// Estadísticas del panel para un periodo (terminando hoy) comparado con el
// periodo anterior de la misma duración. Todo se agrupa por día local de México.

export const PERIODOS = [
  { valor: "7", label: "7 días" },
  { valor: "30", label: "30 días" },
  { valor: "90", label: "3 meses" },
] as const;
export type Periodo = (typeof PERIODOS)[number]["valor"];

export function leerPeriodo(v?: string): Periodo {
  return PERIODOS.some((p) => p.valor === v) ? (v as Periodo) : "30";
}

const TZ = "America/Mexico_City";
const fmtCorto = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: TZ });
const fmtDiaSemana = new Intl.DateTimeFormat("es-MX", { weekday: "short", day: "numeric", timeZone: TZ });
const fmtLargo = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "short", timeZone: TZ });
const fecha = (key: string) => rangoDia(key).inicio;

type Bucket = {
  clave: string;
  etiqueta: string; // eje X
  detalle: string; // tooltip / tabla
  total: number;
  efectivo: number;
  tarjeta: number;
  atendidos: number;
};

// Por podóloga: lo que cobró en servicios y su comisión. Por servicio: cuántas
// veces se cobró y cuánto ingresó.
type PorPodologa = { id: string; nombre: string; ingresos: number; comision: number; servicios: number };
type PorServicio = { id: string; nombre: string; veces: number; ingresos: number };

const cambio = (actual: number, anterior: number) =>
  anterior > 0 ? (actual - anterior) / anterior : null;

export async function obtenerEstadisticas(periodo: Periodo) {
  const hoy = hoyMX();
  const semanal = periodo === "90";
  // Solo periodos completos (hoy va a medias y ya tiene su propia sección):
  // 7 y 30 días terminan ayer; "3 meses" son las 13 semanas completas
  // (lunes a domingo) antes de la actual.
  const ultimo = semanal ? sumarDiasKey(lunesDeSemana(hoy), -1) : sumarDiasKey(hoy, -1);
  const desde = semanal
    ? sumarDiasKey(lunesDeSemana(hoy), -13 * 7)
    : sumarDiasKey(ultimo, -(Number(periodo) - 1));
  const inicio = fecha(desde);
  const fin = rangoDia(ultimo).fin;
  const dias = Math.round((fin.getTime() - inicio.getTime()) / 86400000);
  const inicioPrevio = new Date(inicio.getTime() - dias * 86400000);

  const [pagos, citas, previoPagos, previoCitas, podologas, servicios] = await Promise.all([
    prisma.pago.findMany({
      where: { fecha: { gte: inicio, lt: fin } },
      select: { monto: true, metodo: true, fecha: true, servicioId: true, podologaId: true, comision: true },
    }),
    prisma.cita.findMany({
      where: { inicio: { gte: inicio, lt: fin } },
      select: { inicio: true, estado: true },
    }),
    prisma.pago.aggregate({
      where: { fecha: { gte: inicioPrevio, lt: inicio } },
      _sum: { monto: true },
    }),
    prisma.cita.groupBy({
      by: ["estado"],
      where: { inicio: { gte: inicioPrevio, lt: inicio } },
      _count: { _all: true },
    }),
    prisma.podologa.findMany({ select: { id: true, nombre: true } }),
    prisma.servicio.findMany({ select: { id: true, nombre: true } }),
  ]);

  // ── Buckets (día o semana) ──────────────────────────────────────────
  const buckets: Bucket[] = [];
  const porClave = new Map<string, Bucket>();
  const paso = semanal ? 7 : 1;
  for (let k = desde; k <= ultimo; k = sumarDiasKey(k, paso)) {
    const b: Bucket = {
      clave: k,
      etiqueta: semanal || periodo === "30" ? fmtCorto.format(fecha(k)) : fmtDiaSemana.format(fecha(k)),
      detalle: semanal
        ? `Semana del ${fmtCorto.format(fecha(k))} al ${fmtCorto.format(fecha(sumarDiasKey(k, 6)))}`
        : fmtLargo.format(fecha(k)),
      total: 0,
      efectivo: 0,
      tarjeta: 0,
      atendidos: 0,
    };
    buckets.push(b);
    porClave.set(k, b);
  }
  const bucketDe = (d: Date) => {
    const k = claveDia(d);
    return porClave.get(semanal ? lunesDeSemana(k) : k);
  };

  // ── Ingresos, por podóloga y por servicio ───────────────────────────
  let ingresos = 0;
  const porPodologa = new Map<string, PorPodologa>();
  const porServicio = new Map<string, PorServicio>();
  for (const p of pagos) {
    const monto = Number(p.monto);
    ingresos += monto;
    const b = bucketDe(p.fecha);
    if (b) {
      b.total += monto;
      if (p.metodo === "EFECTIVO") b.efectivo += monto;
      else b.tarjeta += monto;
    }
    if (p.servicioId) {
      if (p.podologaId) {
        const f = porPodologa.get(p.podologaId) ?? { id: p.podologaId, nombre: "", ingresos: 0, comision: 0, servicios: 0 };
        f.ingresos += monto;
        f.comision += Number(p.comision);
        f.servicios += 1;
        porPodologa.set(p.podologaId, f);
      }
      const s = porServicio.get(p.servicioId) ?? { id: p.servicioId, nombre: "", veces: 0, ingresos: 0 };
      s.veces += 1;
      s.ingresos += monto;
      porServicio.set(p.servicioId, s);
    }
  }
  const nombrar = <T extends { id: string; nombre: string }>(
    filas: Map<string, T>,
    catalogo: { id: string; nombre: string }[]
  ) => [...filas.values()].map((f) => ({ ...f, nombre: catalogo.find((c) => c.id === f.id)?.nombre ?? "—" }));

  // ── Asistencia ──────────────────────────────────────────────────────
  const asistencia = { llego: 0, tarde: 0, noVino: 0 };
  for (const c of citas) {
    if (c.estado === "LLEGO") asistencia.llego++;
    else if (c.estado === "LLEGO_TARDE") asistencia.tarde++;
    else if (c.estado === "NO_SHOW") asistencia.noVino++;
    if (c.estado === "LLEGO" || c.estado === "LLEGO_TARDE") {
      const b = bucketDe(c.inicio);
      if (b) b.atendidos++;
    }
  }
  const atendidos = asistencia.llego + asistencia.tarde;
  const resueltas = atendidos + asistencia.noVino;

  const previo = { llego: 0, tarde: 0, noVino: 0 };
  for (const g of previoCitas) {
    if (g.estado === "LLEGO") previo.llego = g._count._all;
    else if (g.estado === "LLEGO_TARDE") previo.tarde = g._count._all;
    else if (g.estado === "NO_SHOW") previo.noVino = g._count._all;
  }
  const atendidosPrevio = previo.llego + previo.tarde;
  const resueltasPrevio = atendidosPrevio + previo.noVino;
  const ingresosPrevio = Number(previoPagos._sum.monto ?? 0);

  const ticket = atendidos > 0 ? ingresos / atendidos : 0;
  const ticketPrevio = atendidosPrevio > 0 ? ingresosPrevio / atendidosPrevio : 0;
  const tasa = resueltas > 0 ? atendidos / resueltas : null;
  const tasaPrevia = resueltasPrevio > 0 ? atendidosPrevio / resueltasPrevio : null;

  return {
    semanal,
    rango: `${fmtCorto.format(inicio)} – ${fmtCorto.format(fecha(ultimo))}`,
    buckets,
    kpis: {
      ingresos: { valor: ingresos, cambio: cambio(ingresos, ingresosPrevio) },
      atendidos: { valor: atendidos, cambio: cambio(atendidos, atendidosPrevio) },
      ticket: { valor: ticket, cambio: cambio(ticket, ticketPrevio) },
      // Asistencia: la diferencia va en puntos porcentuales, no en %.
      asistencia: {
        valor: tasa,
        cambio: tasa !== null && tasaPrevia !== null ? tasa - tasaPrevia : null,
      },
    },
    porPodologa: nombrar(porPodologa, podologas).sort((a, b) => b.ingresos - a.ingresos),
    porServicio: nombrar(porServicio, servicios).sort((a, b) => b.veces - a.veces),
    asistencia,
  };
}
