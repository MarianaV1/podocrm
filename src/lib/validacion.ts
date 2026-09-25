// Lectura de lo que llega en los formularios, con límites. Evita textos
// enormes (p. ej. un "nombre" de miles de caracteres) y números que no caben
// en la base de datos (montos Decimal(10,2), enteros Int), que romperían la
// página con un error.

export const LIMITES = {
  nombre: 80,
  telefono: 20,
  concepto: 120,
  textoLargo: 1000,
} as const;

const DINERO_MAX = 1_000_000;

type Entrada = FormDataEntryValue | string | null | undefined;

// Texto sin espacios de sobra y recortado a `max` caracteres.
export function leerTexto(v: Entrada, max: number): string {
  return String(v ?? "").trim().slice(0, max);
}

// Igual que leerTexto, pero null si queda vacío.
export function leerTextoOpcional(v: Entrada, max: number): string | null {
  return leerTexto(v, max) || null;
}

// "1,250.50" o "1250.5" → número con 2 decimales; null si no es válido,
// es negativo o pasa del máximo.
export function leerDinero(v: Entrada): number | null {
  const s = String(v ?? "").replace(/[^0-9.]/g, "");
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0 || n > DINERO_MAX) return null;
  return Math.round(n * 100) / 100;
}

// Entero dentro de [min, max]; `porDefecto` si no viene un número.
export function leerEntero(v: Entrada, min: number, max: number, porDefecto: number): number {
  const s = String(v ?? "").replace(/[^0-9-]/g, "");
  const n = Math.round(Number(s));
  if (!s || !Number.isFinite(n)) return porDefecto;
  return Math.min(max, Math.max(min, n));
}
