// Opciones de filtro de la lista de pacientes. Sin dependencias de servidor:
// las usa tanto la consulta (servidor) como los controles (cliente).

export const FILTROS_SALUD = [
  { valor: "", label: "Todos" },
  { valor: "alertas", label: "Con alertas de salud" },
  { valor: "diabetico", label: "Diabéticos" },
  { valor: "hipertenso", label: "Hipertensos" },
  { valor: "sin-hoja", label: "Sin hoja clínica" },
] as const;

export const ORDENES = [
  { valor: "recientes", label: "Alta más reciente" },
  { valor: "nombre", label: "Nombre (A–Z)" },
  { valor: "visita", label: "Última visita" },
] as const;

export type FiltroSalud = (typeof FILTROS_SALUD)[number]["valor"];
export type Orden = (typeof ORDENES)[number]["valor"];

export const POR_PAGINA = 20;

export function leerFiltros(sp: { q?: string; salud?: string; orden?: string; pagina?: string }) {
  const salud = FILTROS_SALUD.some((f) => f.valor === sp.salud) ? (sp.salud as FiltroSalud) : "";
  const orden = ORDENES.some((o) => o.valor === sp.orden) ? (sp.orden as Orden) : "recientes";
  const pagina = Math.max(1, Math.floor(Number(sp.pagina)) || 1);
  return { q: (sp.q ?? "").trim().slice(0, 80), salud, orden, pagina };
}
