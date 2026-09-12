import Link from "next/link";
import type { EstadoCita } from "@prisma/client";
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
import { PodologaSelect } from "./podologa-select";
import { PacientePicker } from "./paciente-picker";
import { PagoBoton } from "./pago-boton";
import { eliminarPago } from "@/app/actions/pagos";

const fmtFechaHora = new Intl.DateTimeFormat("es-MX", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const fmtMoneda = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

const btnCls =
  "rounded-md border border-black/10 px-2.5 py-1 text-xs font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10";

export default async function CitasPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const conexion = user
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

  const [citas, pacientes, podologas, serviciosRaw, productosRaw] =
    await Promise.all([
      prisma.cita.findMany({
        orderBy: { inicio: "asc" },
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
  const servicios = serviciosRaw.map((s) => ({
    id: s.id,
    nombre: s.nombre,
    precio: Number(s.precio),
  }));
  const productos = productosRaw.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    precioVenta: Number(p.precioVenta),
    stock: p.stock,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Citas</h1>
        <p className="text-sm text-zinc-500">
          Sincroniza las citas desde tu Google Calendar.
        </p>
      </div>

      {error && (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
          Hubo un problema al conectar con Google. Intenta de nuevo.
        </p>
      )}

      {!conexion ? (
        <section className="rounded-lg border border-black/10 p-6 dark:border-white/10">
          <h2 className="text-base font-semibold">Conecta tu Google Calendar</h2>
          <p className="mt-1 max-w-prose text-sm text-zinc-600 dark:text-zinc-400">
            El CRM leerá (solo lectura) las citas del calendario que elijas. No
            modifica ni borra nada de tu calendario.
          </p>
          <a
            href="/api/google/connect"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Conectar Google Calendar
          </a>
        </section>
      ) : (
        <section className="flex flex-col gap-4 rounded-lg border border-black/10 p-6 dark:border-white/10">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              ✓ Conectado a Google Calendar
            </p>
            <form action={desconectarGoogle}>
              <button className="text-sm text-zinc-500 hover:text-red-600 hover:underline">
                Desconectar
              </button>
            </form>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">
              Calendario a sincronizar
            </h3>
            {errorCalendarios ? (
              <p className="text-sm text-red-600 dark:text-red-400">
                No se pudieron cargar tus calendarios. Prueba a reconectar.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-black/5 dark:divide-white/10">
                {calendarios.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span>
                      {c.summary}
                      {c.primary && (
                        <span className="ml-2 text-xs text-zinc-400">
                          (principal)
                        </span>
                      )}
                    </span>
                    {conexion.calendarId === c.id ? (
                      <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-300">
                        ✓ Sincronizando
                      </span>
                    ) : (
                      <form action={seleccionarCalendario}>
                        <input type="hidden" name="calendarId" value={c.id} />
                        <input
                          type="hidden"
                          name="calendarNombre"
                          value={c.summary}
                        />
                        <button className={btnCls}>Usar este</button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {conexion.calendarId && (
            <form action={sincronizarCitas}>
              <button className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">
                🔄 Sincronizar citas
              </button>
            </form>
          )}
        </section>
      )}

      {/* Lista de citas */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Citas ({citas.length})
        </h2>

        {citas.length === 0 ? (
          <p className="rounded-md border border-dashed border-black/15 p-8 text-center text-sm text-zinc-500 dark:border-white/15">
            Aún no hay citas. Conecta un calendario y pulsa “Sincronizar citas”.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {citas.map((cita) => {
              const sugerencia = cita.paciente
                ? null
                : sugerenciaCercana(cita.titulo, pacientes);

              return (
                <li
                  key={cita.id}
                  className="rounded-lg border border-black/10 p-3 dark:border-white/10"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{cita.titulo}</p>
                      <p className="text-sm text-zinc-500">
                        {fmtFechaHora.format(cita.inicio)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <EstadoBadge estado={cita.estado} />
                      {cita.estado === "AGENDADA" ? (
                        <>
                          <BotonAccion
                            action={marcarLlegada.bind(null, cita.id)}
                            label="Llegó"
                            variant="ok"
                          />
                          <BotonAccion
                            action={marcarLlegadaTarde.bind(null, cita.id)}
                            label="Llegó tarde"
                            variant="warn"
                          />
                          <BotonAccion
                            action={marcarNoShow.bind(null, cita.id)}
                            label="No vino"
                            variant="danger"
                          />
                        </>
                      ) : (
                        <BotonAccion
                          action={reabrirCita.bind(null, cita.id)}
                          label="Reabrir"
                          variant="plain"
                        />
                      )}
                    </div>
                  </div>

                  {/* Paciente + Podóloga */}
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-black/5 pt-2 text-sm dark:border-white/10">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-zinc-500">Paciente:</span>
                      {cita.paciente ? (
                        <>
                          <Link
                            href={`/dashboard/pacientes/${cita.paciente.id}`}
                            className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {cita.paciente.nombre}
                          </Link>
                          <form action={desligarPaciente.bind(null, cita.id)}>
                            <button className="text-xs text-zinc-400 hover:text-red-600 hover:underline">
                              quitar
                            </button>
                          </form>
                        </>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          {sugerencia && (
                            <form action={ligarPaciente.bind(null, cita.id)}>
                              <input
                                type="hidden"
                                name="pacienteId"
                                value={sugerencia.id}
                              />
                              <button className="rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                                💡 ¿Es {sugerencia.nombre}? Ligar
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
                      <span className="text-zinc-500">Podóloga:</span>
                      <PodologaSelect
                        citaId={cita.id}
                        podologaId={cita.podologaId}
                        podologas={podologas}
                      />
                    </div>
                  </div>

                  {/* Pagos */}
                  <div className="mt-2 flex flex-col gap-2 border-t border-black/5 pt-2 dark:border-white/10">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm text-zinc-500">
                        Pagos ({cita.pagos.length})
                      </span>
                      <PagoBoton
                        citaId={cita.id}
                        podologaId={cita.podologaId}
                        servicios={servicios}
                        productos={productos}
                        podologas={podologas}
                      />
                    </div>
                    {cita.pagos.length > 0 && (
                      <ul className="flex flex-col gap-1">
                        {cita.pagos.map((pago) => (
                          <li
                            key={pago.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-black/[.03] px-2.5 py-1.5 text-xs dark:bg-white/[.04]"
                          >
                            <span className="flex flex-wrap items-center gap-x-2">
                              <span className="font-medium">
                                {fmtMoneda.format(Number(pago.monto))}
                              </span>
                              <span className="text-zinc-500">
                                {pago.metodo === "EFECTIVO"
                                  ? "efectivo"
                                  : "tarjeta"}
                              </span>
                              {pago.servicio && (
                                <span className="text-zinc-500">
                                  · {pago.servicio.nombre}
                                </span>
                              )}
                              {pago.producto && (
                                <span className="text-zinc-500">
                                  · {pago.producto.nombre}
                                  {pago.cantidad > 1 && ` ×${pago.cantidad}`}{" "}
                                  <span className="text-green-700 dark:text-green-400">
                                    (utilidad{" "}
                                    {fmtMoneda.format(Number(pago.utilidad))})
                                  </span>
                                </span>
                              )}
                              {pago.podologa && (
                                <span className="text-zinc-500">
                                  · {pago.podologa.nombre} (comisión{" "}
                                  {fmtMoneda.format(Number(pago.comision))})
                                </span>
                              )}
                            </span>
                            <form action={eliminarPago.bind(null, pago.id)}>
                              <button className="text-zinc-400 hover:text-red-600 hover:underline">
                                eliminar
                              </button>
                            </form>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: EstadoCita }) {
  const map = {
    AGENDADA: {
      label: "Agendada",
      cls: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    },
    LLEGO: {
      label: "Llegó",
      cls: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    },
    LLEGO_TARDE: {
      label: "Llegó tarde",
      cls: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200",
    },
    NO_SHOW: {
      label: "No vino",
      cls: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200",
    },
  } as const;
  const s = map[estado];
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}

function BotonAccion({
  action,
  label,
  variant,
}: {
  action: () => Promise<void>;
  label: string;
  variant: "ok" | "warn" | "danger" | "plain";
}) {
  const cls =
    variant === "ok"
      ? "border-green-300 text-green-700 hover:bg-green-50 dark:border-green-500/40 dark:text-green-300 dark:hover:bg-green-500/10"
      : variant === "warn"
        ? "border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-500/40 dark:text-amber-300 dark:hover:bg-amber-500/10"
        : variant === "danger"
          ? "border-red-300 text-red-700 hover:bg-red-50 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10"
          : "border-black/10 text-zinc-600 hover:bg-black/5 dark:border-white/15 dark:text-zinc-300 dark:hover:bg-white/10";
  return (
    <form action={action}>
      <button
        className={`rounded-md border px-2.5 py-1 text-xs font-medium ${cls}`}
      >
        {label}
      </button>
    </form>
  );
}
