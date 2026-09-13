import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { hoyMX, rangoDia, fechaLegible } from "@/lib/fecha";
import { crearMovimiento, eliminarMovimiento } from "@/app/actions/caja";
import { SelectorDia } from "./selector-dia";

const fmt = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});
const fmtHora = new Intl.DateTimeFormat("es-MX", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Mexico_City",
});

export default async function CajaPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string }>;
}) {
  const { fecha: fechaParam } = await searchParams;
  const hoy = hoyMX();
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(fechaParam ?? "")
    ? (fechaParam as string)
    : hoy;
  const { inicio, fin } = rangoDia(fecha);

  const [pagos, movimientos] = await Promise.all([
    prisma.pago.findMany({
      where: { fecha: { gte: inicio, lt: fin } },
      select: {
        monto: true,
        metodo: true,
        comision: true,
        utilidad: true,
        productoId: true,
      },
    }),
    prisma.movimientoCaja.findMany({
      where: { fecha: { gte: inicio, lt: fin } },
      orderBy: { fecha: "asc" },
    }),
  ]);

  // Acumuladores del día.
  const acc = {
    servEfectivo: 0,
    servTarjeta: 0,
    prodEfectivo: 0,
    prodTarjeta: 0,
    comisiones: 0,
    utilidades: 0,
  };
  for (const p of pagos) {
    const monto = Number(p.monto);
    const esProducto = p.productoId !== null;
    if (p.metodo === "EFECTIVO") {
      if (esProducto) acc.prodEfectivo += monto;
      else acc.servEfectivo += monto;
    } else {
      if (esProducto) acc.prodTarjeta += monto;
      else acc.servTarjeta += monto;
    }
    acc.comisiones += Number(p.comision);
    acc.utilidades += Number(p.utilidad);
  }
  const totalEfectivo = acc.servEfectivo + acc.prodEfectivo;
  const totalTarjeta = acc.servTarjeta + acc.prodTarjeta;
  const totalGeneral = totalEfectivo + totalTarjeta;

  let entradas = 0;
  let salidas = 0;
  for (const m of movimientos) {
    if (m.tipo === "ENTRADA") entradas += Number(m.monto);
    else salidas += Number(m.monto);
  }
  const efectivoEnCaja = totalEfectivo + entradas - salidas;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Corte de caja</h1>
        <p className="text-sm text-zinc-500">{fechaLegible(fecha)}</p>
      </div>

      <SelectorDia fecha={fecha} hoy={hoy} />

      {/* Totales principales */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Tarjeta titulo="Total del día" valor={fmt.format(totalGeneral)} grande />
        <Tarjeta titulo="Efectivo" valor={fmt.format(totalEfectivo)} />
        <Tarjeta titulo="Tarjeta (T.C.)" valor={fmt.format(totalTarjeta)} />
      </div>

      {/* Desglose */}
      <section className="rounded-lg border border-black/10 p-5 dark:border-white/10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Desglose de ingresos
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-zinc-400">
              <th className="pb-2 font-medium">Concepto</th>
              <th className="pb-2 text-right font-medium">Efectivo</th>
              <th className="pb-2 text-right font-medium">Tarjeta</th>
              <th className="pb-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/10">
            <Fila
              concepto="Servicios"
              efectivo={acc.servEfectivo}
              tarjeta={acc.servTarjeta}
            />
            <Fila
              concepto="Productos"
              efectivo={acc.prodEfectivo}
              tarjeta={acc.prodTarjeta}
            />
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-black/10 font-semibold dark:border-white/15">
              <td className="pt-2">Total</td>
              <td className="pt-2 text-right">{fmt.format(totalEfectivo)}</td>
              <td className="pt-2 text-right">{fmt.format(totalTarjeta)}</td>
              <td className="pt-2 text-right">{fmt.format(totalGeneral)}</td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 border-t border-black/5 pt-4 text-sm dark:border-white/10">
          <span className="text-zinc-500">
            Comisiones del día:{" "}
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {fmt.format(acc.comisiones)}
            </span>
          </span>
          <span className="text-zinc-500">
            Utilidad de productos:{" "}
            <span className="font-semibold text-green-700 dark:text-green-400">
              {fmt.format(acc.utilidades)}
            </span>
          </span>
        </div>
      </section>

      {/* Movimientos de efectivo */}
      <section className="rounded-lg border border-black/10 p-5 dark:border-white/10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Movimientos de efectivo
        </h2>

        <form
          action={crearMovimiento}
          className="flex flex-wrap items-end gap-2"
        >
          <input type="hidden" name="fecha" value={fecha} />
          <label className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500">Tipo</span>
            <select
              name="tipo"
              className="rounded-md border border-black/10 bg-white px-2.5 py-2 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:bg-zinc-900"
            >
              <option value="SALIDA">Salida (gasto/retiro)</option>
              <option value="ENTRADA">Entrada (fondo/ingreso)</option>
            </select>
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-xs text-zinc-500">Concepto</span>
            <input
              name="concepto"
              required
              placeholder="Compra de material, retiro, etc."
              className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:bg-zinc-900"
            />
          </label>
          <label className="flex w-28 flex-col gap-1">
            <span className="text-xs text-zinc-500">Monto</span>
            <input
              name="monto"
              required
              inputMode="decimal"
              placeholder="0.00"
              className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:bg-zinc-900"
            />
          </label>
          <button className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">
            Agregar
          </button>
        </form>

        {movimientos.length > 0 && (
          <ul className="mt-4 flex flex-col divide-y divide-black/5 dark:divide-white/10">
            {movimientos.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-2 py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      m.tipo === "ENTRADA"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                        : "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200"
                    }`}
                  >
                    {m.tipo === "ENTRADA" ? "Entrada" : "Salida"}
                  </span>
                  <span>{m.concepto}</span>
                  <span className="text-xs text-zinc-400">
                    {fmtHora.format(m.fecha)}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span
                    className={
                      m.tipo === "ENTRADA"
                        ? "font-medium text-green-700 dark:text-green-400"
                        : "font-medium text-red-700 dark:text-red-400"
                    }
                  >
                    {m.tipo === "ENTRADA" ? "+" : "−"}
                    {fmt.format(Number(m.monto))}
                  </span>
                  <form action={eliminarMovimiento.bind(null, m.id)}>
                    <button className="text-xs text-zinc-400 hover:text-red-600 hover:underline">
                      eliminar
                    </button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Efectivo esperado en caja */}
      <section className="rounded-lg border border-black/10 bg-black/[.02] p-5 dark:border-white/10 dark:bg-white/[.03]">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Efectivo esperado en caja
        </h2>
        <p className="text-3xl font-semibold">{fmt.format(efectivoEnCaja)}</p>
        <p className="mt-2 text-xs text-zinc-500">
          Ventas en efectivo {fmt.format(totalEfectivo)} + entradas{" "}
          {fmt.format(entradas)} − salidas {fmt.format(salidas)}. (Los cobros con
          tarjeta no cuentan como efectivo en caja.)
        </p>
      </section>
    </div>
  );
}

function Tarjeta({
  titulo,
  valor,
  grande = false,
}: {
  titulo: string;
  valor: string;
  grande?: boolean;
}) {
  return (
    <div className="rounded-lg border border-black/10 p-5 dark:border-white/10">
      <p className="text-sm text-zinc-500">{titulo}</p>
      <p className={`mt-1 font-semibold ${grande ? "text-3xl" : "text-2xl"}`}>
        {valor}
      </p>
    </div>
  );
}

function Fila({
  concepto,
  efectivo,
  tarjeta,
}: {
  concepto: ReactNode;
  efectivo: number;
  tarjeta: number;
}) {
  return (
    <tr>
      <td className="py-2">{concepto}</td>
      <td className="py-2 text-right">{fmt.format(efectivo)}</td>
      <td className="py-2 text-right">{fmt.format(tarjeta)}</td>
      <td className="py-2 text-right font-medium">
        {fmt.format(efectivo + tarjeta)}
      </td>
    </tr>
  );
}
