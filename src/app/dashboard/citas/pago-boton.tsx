"use client";

import { useState, useTransition } from "react";
import { registrarPago } from "@/app/actions/pagos";

type Servicio = { id: string; nombre: string; precio: number };
type Producto = {
  id: string;
  nombre: string;
  precioVenta: number;
  stock: number;
};
type Podologa = { id: string; nombre: string; comisionPct: number };

const fmtMoneda = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

const inputCls =
  "rounded-md border border-black/10 bg-white px-2 py-1 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:bg-zinc-900";
const btnCls =
  "rounded-md border border-black/10 px-2.5 py-1 text-xs font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10";

export function PagoBoton(props: {
  citaId: string;
  podologaId: string | null;
  servicios: Servicio[];
  productos: Producto[];
  podologas: Podologa[];
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button onClick={() => setAbierto(true)} className={btnCls}>
        💵 Registrar pago
      </button>
      {abierto && <PagoModal {...props} onClose={() => setAbierto(false)} />}
    </>
  );
}

function redondear(n: number): number {
  return Math.round(n * 100) / 100;
}

function num(s: string): number {
  const n = Number(s.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function PagoModal({
  citaId,
  podologaId,
  servicios,
  productos,
  podologas,
  onClose,
}: {
  citaId: string;
  podologaId: string | null;
  servicios: Servicio[];
  productos: Producto[];
  podologas: Podologa[];
  onClose: () => void;
}) {
  const [tipo, setTipo] = useState<"servicio" | "producto">("servicio");
  const [metodo, setMetodo] = useState<"EFECTIVO" | "TARJETA">("EFECTIVO");
  const [monto, setMonto] = useState("");
  const [pending, startTransition] = useTransition();

  // Servicio
  const [servicioId, setServicioId] = useState("");
  const [comision, setComision] = useState("");
  const [podologa, setPodologa] = useState(podologaId ?? "");

  // Producto
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState("1");

  const prodSel = productos.find((p) => p.id === productoId);

  // Comisión = monto × % FIJO de la podóloga seleccionada.
  function comisionDe(montoStr: string, podologaSel: string): string {
    const pod = podologas.find((x) => x.id === podologaSel);
    if (!pod) return "";
    return String(redondear((num(montoStr) * pod.comisionPct) / 100));
  }

  function onServicio(id: string) {
    setServicioId(id);
    const s = servicios.find((x) => x.id === id);
    if (s) {
      const m = String(s.precio);
      setMonto(m);
      setComision(comisionDe(m, podologa));
    }
  }

  function onMontoServicio(v: string) {
    setMonto(v);
    setComision(comisionDe(v, podologa));
  }

  function onPodologa(id: string) {
    setPodologa(id);
    setComision(comisionDe(monto, id));
  }

  function onProducto(id: string) {
    setProductoId(id);
    const p = productos.find((x) => x.id === id);
    if (p) setMonto(String(redondear(p.precioVenta * (num(cantidad) || 1))));
  }

  function onCantidad(v: string) {
    setCantidad(v);
    if (prodSel) setMonto(String(redondear(prodSel.precioVenta * (num(v) || 1))));
  }

  function cambiarTipo(t: "servicio" | "producto") {
    setTipo(t);
    setMonto("");
    setComision("");
    setServicioId("");
    setProductoId("");
    setCantidad("1");
  }

  const utilidadPreview =
    tipo === "producto" && prodSel ? num(monto) : null; // se calcula real en el server

  function guardar() {
    if (monto.trim() === "" || num(monto) < 0) return;
    if (tipo === "producto" && !productoId) return;

    const fd = new FormData();
    fd.set("tipo", tipo);
    fd.set("citaId", citaId);
    fd.set("monto", monto);
    fd.set("metodo", metodo);
    if (tipo === "servicio") {
      fd.set("servicioId", servicioId);
      fd.set("comision", comision);
      fd.set("podologaId", podologa);
    } else {
      fd.set("productoId", productoId);
      fd.set("cantidad", cantidad);
    }
    startTransition(async () => {
      await registrarPago(fd);
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg border border-black/10 bg-white p-5 text-sm shadow-xl dark:border-white/15 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold">Registrar pago</h3>

        {/* Tipo: servicio o producto */}
        <div className="mt-3 flex gap-2">
          {(["servicio", "producto"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => cambiarTipo(t)}
              className={`flex-1 rounded-md border px-3 py-1.5 text-xs font-medium ${
                tipo === t
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                  : "border-black/10 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
              }`}
            >
              {t === "servicio" ? "Servicio" : "Producto"}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-col gap-3">
          {tipo === "servicio" ? (
            <label className="flex flex-col gap-1">
              <span className="font-medium">Servicio</span>
              <select
                value={servicioId}
                onChange={(e) => onServicio(e.target.value)}
                className={inputCls}
              >
                <option value="">— Monto libre —</option>
                {servicios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} ({fmtMoneda.format(s.precio)})
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="flex flex-col gap-1">
              <span className="font-medium">Producto</span>
              <select
                value={productoId}
                onChange={(e) => onProducto(e.target.value)}
                className={inputCls}
              >
                <option value="">— Selecciona —</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({fmtMoneda.format(p.precioVenta)}) · {p.stock} en
                    stock
                  </option>
                ))}
              </select>
            </label>
          )}

          {tipo === "producto" && (
            <label className="flex flex-col gap-1">
              <span className="font-medium">Cantidad</span>
              <input
                value={cantidad}
                onChange={(e) => onCantidad(e.target.value)}
                inputMode="numeric"
                className={inputCls}
              />
              {prodSel && num(cantidad) > prodSel.stock && (
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  ⚠️ Solo hay {prodSel.stock} en inventario (el stock quedará
                  negativo).
                </span>
              )}
            </label>
          )}

          <div className="flex gap-2">
            <label className="flex flex-1 flex-col gap-1">
              <span className="font-medium">Monto</span>
              <input
                value={monto}
                onChange={(e) =>
                  tipo === "servicio"
                    ? onMontoServicio(e.target.value)
                    : setMonto(e.target.value)
                }
                inputMode="decimal"
                placeholder="0.00"
                className={inputCls}
              />
            </label>
            {tipo === "servicio" && (
              <label className="flex flex-1 flex-col gap-1">
                <span className="font-medium">Comisión</span>
                <input
                  value={comision}
                  onChange={(e) => setComision(e.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  className={inputCls}
                />
              </label>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-medium">Método</span>
            <div className="flex gap-2">
              {(["EFECTIVO", "TARJETA"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMetodo(m)}
                  className={`flex-1 rounded-md border px-3 py-1.5 text-xs font-medium ${
                    metodo === m
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                      : "border-black/10 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                  }`}
                >
                  {m === "EFECTIVO" ? "Efectivo" : "Tarjeta"}
                </button>
              ))}
            </div>
          </div>

          {tipo === "servicio" ? (
            <label className="flex flex-col gap-1">
              <span className="font-medium">Podóloga (comisión)</span>
              <select
                value={podologa}
                onChange={(e) => onPodologa(e.target.value)}
                className={inputCls}
              >
                <option value="">— Ninguna —</option>
                {podologas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({p.comisionPct}%)
                  </option>
                ))}
              </select>
            </label>
          ) : (
            utilidadPreview !== null && (
              <p className="rounded-md bg-black/[.03] px-2.5 py-1.5 text-xs text-zinc-500 dark:bg-white/[.04]">
                La venta descuenta {num(cantidad) || 1} del inventario. La
                utilidad (venta − costo) se calcula automáticamente. Sin comisión
                para la podóloga.
              </p>
            )
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className={btnCls}>
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={
              pending ||
              monto.trim() === "" ||
              (tipo === "producto" && !productoId)
            }
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {pending ? "Guardando…" : "Registrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
