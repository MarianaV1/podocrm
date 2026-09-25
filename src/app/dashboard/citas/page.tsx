import type { Metadata } from "next";
import Link from "next/link";
import type { EstadoCita, Prisma } from "@prisma/client";
import { Check, Clock, X, RotateCcw, RefreshCw, Lightbulb } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import {
  getAuthedClient,
  listarCalendarios,
  type CalendarioGoogle,
} from "@/lib/google";
import { extraerNombre, sugerenciaCercana } from "@/lib/matching";
import {
  seleccionarCalendario,
  desconectarGoogle,
  sincronizarCitas,
  marcarLlegada,
  marcarLlegadaTarde,
  marcarNoShow,
  reabrirCita,
  ligarPaciente,
  desligarPaciente,
} from "@/app/actions/google";
import { eliminarPago } from "@/app/actions/pagos";
import { IS_DEMO } from "@/lib/demo";
import {
  hoyMX,
  rangoDia,
  claveDia,
  lunesDeSemana,
  etiquetaDia,
  etiquetaSemana,
} from "@/lib/fecha";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClasses } from "@/components/ui/button";
import { PodologaSelect } from "./podologa-select";
import { PacientePicker } from "./paciente-picker";
import { PagoBoton } from "./pago-boton";

export const metadata: Metadata = { title: "Citas" };

const fmtFechaHora = new Intl.DateTimeFormat("es-MX", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Mexico_City",
});

const fmtMoneda = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

type CitaConDatos = Prisma.CitaGetPayload<{
  include: {
    paciente: { select: { id: true; nombre: true } };
    pagos: {
      include: {
        servicio: { select: { nombre: true } };
        producto: { select: { nombre: true } };
        podologa: { select: { nombre: true } };
      };
    };
  };
}>;

type Servicio = { id: string; nombre: string; precio: number };
type Producto = { id: string; nombre: string; precioVenta: number; stock: number };
type Podologa = { id: string; nombre: string; comisionPct: number };

export default async function CitasPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ver?: string }>;
}) {
  const { error, ver: verParam } = await searchParams;
  const ver = verParam === "pasadas" ? "pasadas" : "proximas";
  const inicioHoy = rangoDia(hoyMX()).inicio;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // En modo demo no se usa Google: las citas vienen sembradas.
  const conexion =
    user && !IS_DEMO
      ? await prisma.googleConexion.findUnique({ where: { userId: user.id } })
      : null;

  let calendarios: CalendarioGoogle[] = [];
  let errorCalendarios = false;
  if (conexion) {
    try {
      calendarios = await listarCalendarios(getAuthedClient(conexion));
    } catch {
      errorCalendarios = true;
    }
  }

  const [citas, pacientes, podologasRaw, serviciosRaw, productosRaw] =
    await Promise.all([
      prisma.cita.findMany({
        // Solo carga lo relevante: próximas (hoy en adelante) o pasadas.
        where:
          ver === "pasadas"
            ? { inicio: { lt: inicioHoy } }
            : { inicio: { gte: inicioHoy } },
        orderBy: { inicio: ver === "pasadas" ? "desc" : "asc" },
        ...(ver === "pasadas" ? { take: 200 } : {}),
        include: {
          paciente: { select: { id: true, nombre: true } },
          pagos: {
            orderBy: { fecha: "asc" },
            include: {
              servicio: { select: { nombre: true } },
              producto: { select: { nombre: true } },
              podologa: { select: { nombre: true } },
            },
          },
        },
      }),
      // Se usa solo para la sugerencia por parecido (server-side).
      // TODO producción: con miles de pacientes, mover el fuzzy a Postgres pg_trgm.
      prisma.paciente.findMany({
        orderBy: { nombre: "asc" },
        select: { id: true, nombre: true },
      }),
      prisma.podologa.findMany({
        where: { activa: true },
        orderBy: { nombre: "asc" },
        select: { id: true, nombre: true, comisionPct: true },
      }),
      prisma.servicio.findMany({
        where: { activo: true },
        orderBy: { nombre: "asc" },
        select: { id: true, nombre: true, precio: true },
      }),
      prisma.producto.findMany({
        where: { activo: true },
        orderBy: { nombre: "asc" },
        select: { id: true, nombre: true, precioVenta: true, stock: true },
      }),
    ]);

  // Decimal → number para pasarlo a los componentes cliente.
  const podologas: Podologa[] = podologasRaw;
  const servicios: Servicio[] = serviciosRaw.map((s) => ({
    id: s.id,
    nombre: s.nombre,
    precio: Number(s.precio),
  }));
  const productos: Producto[] = productosRaw.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    precioVenta: Number(p.precioVenta),
    stock: p.stock,
  }));

  // Cita que resalta el recorrido guiado: la primera por atender con paciente.
  const destacadaId = (
    citas.find((c) => c.estado === "AGENDADA" && c.paciente) ?? citas[0]
  )?.id;

  // Agrupar por semana → día (para que se lea ordenado con muchas citas).
  const hoyKey = hoyMX();
  type Dia = { key: string; citas: CitaConDatos[] };
  type Semana = { lunes: string; dias: Dia[] };
  const semanas: Semana[] = [];
  for (const cita of citas) {
    const dk = claveDia(cita.inicio);
    const lk = lunesDeSemana(dk);
    let sem = semanas[semanas.length - 1];
    if (!sem || sem.lunes !== lk) {
      sem = { lunes: lk, dias: [] };
      semanas.push(sem);
    }
    let dia = sem.dias[sem.dias.length - 1];
    if (!dia || dia.key !== dk) {
      dia = { key: dk, citas: [] };
      sem.dias.push(dia);
    }
    dia.citas.push(cita);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Citas"
        subtitle={
          IS_DEMO
            ? "Citas de ejemplo. Marca la llegada y registra los cobros."
            : "Sincroniza las citas desde tu Google Calendar."
        }
      />

      {error && !IS_DEMO && (
        <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
          Hubo un problema al conectar con Google. Intenta de nuevo.
        </p>
      )}

      {IS_DEMO ? null : !conexion ? (
        <Card className="p-6">
          <h2 className="text-base font-semibold">Conecta tu Google Calendar</h2>
          <p className="mt-1 max-w-prose text-sm text-muted">
            El CRM leerá (solo lectura) las citas del calendario que elijas. No
            modifica ni borra nada de tu calendario.
          </p>
          <a href="/api/google/connect" className={buttonClasses("primary", "md", "mt-4")}>
            Conectar Google Calendar
          </a>
        </Card>
      ) : (
        <Card className="flex flex-col gap-4 p-6">
          <div className="flex items-center justify-between">
            <p className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              <Check size={16} /> Conectado a Google Calendar
            </p>
            <form action={desconectarGoogle}>
              <button className="text-sm text-muted hover:text-red-600 hover:underline">
                Desconectar
              </button>
            </form>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Calendario a sincronizar</h3>
            {errorCalendarios ? (
              <p className="text-sm text-red-600 dark:text-red-400">
                No se pudieron cargar tus calendarios. Prueba a reconectar.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {calendarios.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span>
                      {c.summary}
                      {c.primary && (
                        <span className="ml-2 text-xs text-muted">(principal)</span>
                      )}
                    </span>
                    {conexion.calendarId === c.id ? (
                      <Badge tone="success">✓ Sincronizando</Badge>
                    ) : (
                      <form action={seleccionarCalendario}>
                        <input type="hidden" name="calendarId" value={c.id} />
                        <input
                          type="hidden"
                          name="calendarNombre"
                          value={c.summary}
                        />
                        <button className={buttonClasses("outline", "sm")}>
                          Usar este
                        </button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {conexion.calendarId && (
            <form action={sincronizarCitas}>
              <button className={buttonClasses("primary")}>
                <RefreshCw size={16} /> Sincronizar citas
              </button>
            </form>
          )}
        </Card>
      )}

      {/* Lista de citas agrupada por semana → día */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Citas ({citas.length})
          </h2>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1 text-sm">
            <FiltroTab ver="proximas" actual={ver} label="Próximas" />
            <FiltroTab ver="pasadas" actual={ver} label="Anteriores" />
          </div>
        </div>

        {citas.length === 0 ? (
          <EmptyState>
            {ver === "pasadas"
              ? "No hay citas anteriores."
              : IS_DEMO
                ? "No hay citas próximas."
                : "No hay citas próximas. Conecta un calendario y pulsa “Sincronizar citas”."}
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-8">
            {semanas.map((sem) => (
              <div key={sem.lunes} className="flex flex-col gap-4">
                <h3 className="text-sm font-semibold tracking-tight">
                  {etiquetaSemana(sem.lunes, hoyKey)}
                </h3>

                {sem.dias.map((dia) => (
                  <div key={dia.key} className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted">
                        {etiquetaDia(dia.key, hoyKey)}
                      </span>
                      <Badge tone="neutral">{dia.citas.length}</Badge>
                      <div className="h-px flex-1 bg-border" />
                    </div>

                    <ul className="flex flex-col gap-3">
                      {dia.citas.map((cita) => (
                        <CitaCard
                          key={cita.id}
                          cita={cita}
                          destacada={cita.id === destacadaId}
                          sugerencia={
                            cita.paciente
                              ? null
                              : sugerenciaCercana(cita.titulo, pacientes)
                          }
                          servicios={servicios}
                          productos={productos}
                          podologas={podologas}
                        />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CitaCard({
  cita,
  destacada,
  sugerencia,
  servicios,
  productos,
  podologas,
}: {
  cita: CitaConDatos;
  destacada: boolean;
  sugerencia: { id: string; nombre: string } | null;
  servicios: Servicio[];
  productos: Producto[];
  podologas: Podologa[];
}) {
  // Anclas del recorrido guiado (solo en la cita destacada).
  const tour = (nombre: string) => (destacada ? nombre : undefined);

  return (
    <Card data-tour={tour("cita")} className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <p className="font-medium">{cita.titulo}</p>
          <p className="text-sm text-muted">{fmtFechaHora.format(cita.inicio)}</p>
        </div>

        <div
          data-tour={tour("cita-estado")}
          className="flex flex-wrap items-center gap-2"
        >
          <EstadoBadge estado={cita.estado} />
          {cita.estado === "AGENDADA" ? (
            <>
              <BotonAccion
                action={marcarLlegada.bind(null, cita.id)}
                label="Llegó"
                variant="ok"
                icon={<Check size={14} />}
              />
              <BotonAccion
                action={marcarLlegadaTarde.bind(null, cita.id)}
                label="Llegó tarde"
                variant="warn"
                icon={<Clock size={14} />}
              />
              <BotonAccion
                action={marcarNoShow.bind(null, cita.id)}
                label="No vino"
                variant="danger"
                icon={<X size={14} />}
              />
            </>
          ) : (
            <BotonAccion
              action={reabrirCita.bind(null, cita.id)}
              label="Reabrir"
              variant="plain"
              icon={<RotateCcw size={14} />}
            />
          )}
        </div>
      </div>

      {/* Paciente + Podóloga */}
      <div
        data-tour={tour("cita-paciente")}
        className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-3 text-sm"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted">Paciente:</span>
          {cita.paciente ? (
            <>
              <Link
                href={`/dashboard/pacientes/${cita.paciente.id}`}
                className="font-medium text-primary hover:underline"
              >
                {cita.paciente.nombre}
              </Link>
              <form action={desligarPaciente.bind(null, cita.id)}>
                <button className="text-xs text-muted hover:text-red-600 hover:underline">
                  quitar
                </button>
              </form>
            </>
          ) : (
            <div
              data-tour={sugerencia ? "cita-sugerencia" : undefined}
              className="flex flex-wrap items-center gap-2"
            >
              {sugerencia && (
                <form action={ligarPaciente.bind(null, cita.id)}>
                  <input type="hidden" name="pacienteId" value={sugerencia.id} />
                  <button className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                    <Lightbulb size={13} /> ¿Es {sugerencia.nombre}? Ligar
                  </button>
                </form>
              )}
              <PacientePicker
                citaId={cita.id}
                nombreSugerido={extraerNombre(cita.titulo)}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted">Podóloga:</span>
          <PodologaSelect
            citaId={cita.id}
            podologaId={cita.podologaId}
            podologas={podologas}
          />
        </div>
      </div>

      {/* Pagos */}
      <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-muted">Pagos ({cita.pagos.length})</span>
          <div data-tour={tour("cita-pago")}>
            <PagoBoton
              citaId={cita.id}
              podologaId={cita.podologaId}
              servicios={servicios}
              productos={productos}
              podologas={podologas}
            />
          </div>
        </div>
        {cita.pagos.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {cita.pagos.map((pago) => (
              <li
                key={pago.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-2 px-3 py-2 text-xs"
              >
                <span className="flex flex-wrap items-center gap-x-2">
                  <span className="font-medium">
                    {fmtMoneda.format(Number(pago.monto))}
                  </span>
                  <span className="text-muted">
                    {pago.metodo === "EFECTIVO" ? "efectivo" : "tarjeta"}
                  </span>
                  {pago.servicio && (
                    <span className="text-muted">· {pago.servicio.nombre}</span>
                  )}
                  {pago.producto && (
                    <span className="text-muted">
                      · {pago.producto.nombre}
                      {pago.cantidad > 1 && ` ×${pago.cantidad}`}{" "}
                      <span className="text-emerald-700 dark:text-emerald-400">
                        (utilidad {fmtMoneda.format(Number(pago.utilidad))})
                      </span>
                    </span>
                  )}
                  {pago.podologa && (
                    <span className="text-muted">
                      · {pago.podologa.nombre} (comisión{" "}
                      {fmtMoneda.format(Number(pago.comision))})
                    </span>
                  )}
                </span>
                <form action={eliminarPago.bind(null, pago.id)}>
                  <button className="text-muted hover:text-red-600 hover:underline">
                    eliminar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

function FiltroTab({
  ver,
  actual,
  label,
}: {
  ver: "proximas" | "pasadas";
  actual: string;
  label: string;
}) {
  const activo = actual === ver;
  return (
    <Link
      href={`/dashboard/citas?ver=${ver}`}
      className={
        activo
          ? "rounded-md bg-primary px-3 py-1 font-medium text-primary-foreground"
          : "rounded-md px-3 py-1 text-muted transition-colors hover:text-foreground"
      }
    >
      {label}
    </Link>
  );
}

function EstadoBadge({ estado }: { estado: EstadoCita }) {
  const map: Record<EstadoCita, { label: string; tone: BadgeTone }> = {
    AGENDADA: { label: "Agendada", tone: "neutral" },
    LLEGO: { label: "Llegó", tone: "success" },
    LLEGO_TARDE: { label: "Llegó tarde", tone: "warning" },
    NO_SHOW: { label: "No vino", tone: "danger" },
  };
  const s = map[estado];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

function BotonAccion({
  action,
  label,
  variant,
  icon,
}: {
  action: () => Promise<void>;
  label: string;
  variant: "ok" | "warn" | "danger" | "plain";
  icon?: React.ReactNode;
}) {
  const cls =
    variant === "ok"
      ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/40 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
      : variant === "warn"
        ? "border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-500/40 dark:text-amber-300 dark:hover:bg-amber-500/10"
        : variant === "danger"
          ? "border-red-300 text-red-700 hover:bg-red-50 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10"
          : "border-border text-muted hover:bg-surface-2 hover:text-foreground";
  return (
    <form action={action}>
      <button
        className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium ${cls}`}
      >
        {icon}
        {label}
      </button>
    </form>
  );
}
