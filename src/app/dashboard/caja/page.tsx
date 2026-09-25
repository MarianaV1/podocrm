import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Wallet, Banknote, CreditCard } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { hoyMX, rangoDia, fechaLegible } from "@/lib/fecha";
import { crearMovimiento, eliminarMovimiento } from "@/app/actions/caja";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { InfoTip } from "@/components/ui/info-tip";
import { SelectorDia } from "./selector-dia";

export const metadata: Metadata = { title: "Corte de caja" };

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
      <PageHeader title="Corte de caja" subtitle={fechaLegible(fecha)} />

      <SelectorDia fecha={fecha} hoy={hoy} />

      {/* Totales principales */}
      <div
        data-tour="caja-totales"
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <StatCard
          label="Total del día"
          value={fmt.format(totalGeneral)}
          icon={<Wallet size={18} />}
        />
        <StatCard
          label="Efectivo"
          value={fmt.format(totalEfectivo)}
          icon={<Banknote size={18} />}
        />
        <StatCard
          label="Tarjeta (T.C.)"
          value={fmt.format(totalTarjeta)}
          icon={<CreditCard size={18} />}
        />
      </div>

      {/* Desglose */}
      <Card className="p-5">
        <CardTitle className="mb-3">Desglose de ingresos</CardTitle>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted">
              <th className="pb-2 font-medium">Concepto</th>
              <th className="pb-2 text-right font-medium">Efectivo</th>
              <th className="pb-2 text-right font-medium">Tarjeta</th>
              <th className="pb-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
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
            <tr className="border-t-2 border-border font-semibold">
              <td className="pt-2">Total</td>
              <td className="pt-2 text-right">{fmt.format(totalEfectivo)}</td>
              <td className="pt-2 text-right">{fmt.format(totalTarjeta)}</td>
              <td className="pt-2 text-right">{fmt.format(totalGeneral)}</td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 border-t border-border pt-4 text-sm text-muted">
          <span className="inline-flex flex-wrap items-center gap-1.5">
            Comisiones del día:
            <span className="font-semibold text-foreground">
              {fmt.format(acc.comisiones)}
            </span>
            <InfoTip
              texto="Lo que ganan las podólogas: su % fijo sobre cada servicio cobrado. Los productos no generan comisión."
              align="end"
            />
          </span>
          <span className="inline-flex flex-wrap items-center gap-1.5">
            Utilidad de productos:
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              {fmt.format(acc.utilidades)}
            </span>
            <InfoTip
              texto="Precio de venta menos costo de cada producto vendido."
              align="end"
            />
          </span>
        </div>
      </Card>

      {/* Movimientos de efectivo */}
      <Card className="p-5">
        <CardTitle className="mb-3 flex items-center gap-1.5">
          Movimientos de efectivo
          <InfoTip
            texto="Dinero que entra o sale de la caja sin ser una venta: fondo inicial, compra de material, retiros."
            align="center"
          />
        </CardTitle>

        <form action={crearMovimiento} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="fecha" value={fecha} />
          <Field label="Tipo">
            <Select name="tipo">
              <option value="SALIDA">Salida (gasto/retiro)</option>
              <option value="ENTRADA">Entrada (fondo/ingreso)</option>
            </Select>
          </Field>
          <Field label="Concepto" className="flex-1">
            <Input
              name="concepto"
              maxLength={120}
              required
              placeholder="Compra de material, retiro, etc."
            />
          </Field>
          <Field label="Monto" className="w-28">
            <Input name="monto" required inputMode="decimal" placeholder="0.00" />
          </Field>
          <Button type="submit">Agregar</Button>
        </form>

        {movimientos.length > 0 && (
          <ul className="mt-4 flex flex-col divide-y divide-border">
            {movimientos.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-2 py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <Badge tone={m.tipo === "ENTRADA" ? "success" : "danger"}>
                    {m.tipo === "ENTRADA" ? "Entrada" : "Salida"}
                  </Badge>
                  <span>{m.concepto}</span>
                  <span className="text-xs text-muted">
                    {fmtHora.format(m.fecha)}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span
                    className={
                      m.tipo === "ENTRADA"
                        ? "font-medium text-emerald-700 dark:text-emerald-400"
                        : "font-medium text-red-700 dark:text-red-400"
                    }
                  >
                    {m.tipo === "ENTRADA" ? "+" : "−"}
                    {fmt.format(Number(m.monto))}
                  </span>
                  <form action={eliminarMovimiento.bind(null, m.id)}>
                    <button className="text-xs text-muted hover:text-red-600 hover:underline">
                      eliminar
                    </button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Efectivo esperado en caja */}
      <Card data-tour="caja-esperado" className="bg-surface-2 p-5">
        <CardTitle className="mb-2 flex items-center gap-1.5">
          Efectivo esperado en caja
          <InfoTip
            texto="Lo que debería haber físicamente en la caja. Si al contar no cuadra, revisa cobros o movimientos sin registrar."
            align="center"
          />
        </CardTitle>
        <p className="text-3xl font-semibold tracking-tight">
          {fmt.format(efectivoEnCaja)}
        </p>
        <p className="mt-2 text-xs text-muted">
          Ventas en efectivo {fmt.format(totalEfectivo)} + entradas{" "}
          {fmt.format(entradas)} − salidas {fmt.format(salidas)}. (Los cobros con
          tarjeta no cuentan como efectivo en caja.)
        </p>
      </Card>
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
