"use client";

import { useState, useTransition } from "react";
import { Wallet } from "lucide-react";
import { registrarPago } from "@/app/actions/pagos";
import { Button, buttonClasses } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { cn } from "@/lib/cn";

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
      <button
        onClick={() => setAbierto(true)}
        className={buttonClasses("outline", "sm")}
      >
        <Wallet size={14} /> Registrar pago
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

function Toggle({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
        activo
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border hover:bg-surface-2"
      )}
    >
      {children}
    </button>
  );
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
        className="w-full max-w-sm rounded-xl border border-border bg-surface p-5 text-sm shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold">Registrar pago</h3>

        {/* Tipo: servicio o producto */}
        <div className="mt-3 flex gap-2">
          <Toggle activo={tipo === "servicio"} onClick={() => cambiarTipo("servicio")}>
            Servicio
          </Toggle>
          <Toggle activo={tipo === "producto"} onClick={() => cambiarTipo("producto")}>
            Producto
          </Toggle>
        </div>

        <div className="mt-3 flex flex-col gap-3">
          {tipo === "servicio" ? (
            <label className="flex flex-col gap-1">
              <span className="font-medium">Servicio</span>
              <Select value={servicioId} onChange={(e) => onServicio(e.target.value)}>
                <option value="">— Monto libre —</option>
                {servicios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} ({fmtMoneda.format(s.precio)})
                  </option>
                ))}
              </Select>
            </label>
          ) : (
            <label className="flex flex-col gap-1">
              <span className="font-medium">Producto</span>
              <Select value={productoId} onChange={(e) => onProducto(e.target.value)}>
                <option value="">— Selecciona —</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({fmtMoneda.format(p.precioVenta)}) · {p.stock} en
                    stock
                  </option>
                ))}
              </Select>
            </label>
          )}

          {tipo === "producto" && (
            <label className="flex flex-col gap-1">
              <span className="font-medium">Cantidad</span>
              <Input
                value={cantidad}
                onChange={(e) => onCantidad(e.target.value)}
                inputMode="numeric"
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
              <Input
                value={monto}
                onChange={(e) =>
                  tipo === "servicio"
                    ? onMontoServicio(e.target.value)
                    : setMonto(e.target.value)
                }
                inputMode="decimal"
                placeholder="0.00"
              />
            </label>
            {tipo === "servicio" && (
              <label className="flex flex-1 flex-col gap-1">
                <span className="font-medium">Comisión</span>
                <Input
                  value={comision}
                  onChange={(e) => setComision(e.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                />
              </label>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-medium">Método</span>
            <div className="flex gap-2">
              <Toggle
                activo={metodo === "EFECTIVO"}
                onClick={() => setMetodo("EFECTIVO")}
              >
                Efectivo
              </Toggle>
              <Toggle
                activo={metodo === "TARJETA"}
                onClick={() => setMetodo("TARJETA")}
              >
                Tarjeta
              </Toggle>
            </div>
          </div>

          {tipo === "servicio" ? (
            <label className="flex flex-col gap-1">
              <span className="font-medium">Podóloga (comisión)</span>
              <Select value={podologa} onChange={(e) => onPodologa(e.target.value)}>
                <option value="">— Ninguna —</option>
                {podologas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({p.comisionPct}%)
                  </option>
                ))}
              </Select>
            </label>
          ) : (
            prodSel && (
              <p className="rounded-lg bg-surface-2 px-2.5 py-1.5 text-xs text-muted">
                La venta descuenta {num(cantidad) || 1} del inventario. La
                utilidad (venta − costo) se calcula automáticamente. Sin comisión
                para la podóloga.
              </p>
            )
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={guardar}
            disabled={
              pending ||
              monto.trim() === "" ||
              (tipo === "producto" && !productoId)
            }
          >
            {pending ? "Guardando…" : "Registrar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
