export type PacienteMin = { id: string; nombre: string };

// Normaliza para comparar: minúsculas, sin acentos, sin puntuación.
export function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // quita los acentos
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Extrae el nombre probable del título (lo que va antes del primer separador).
export function extraerNombre(titulo: string): string {
  const antes = titulo.split(/[-–—|:]/)[0].trim();
  return antes.length > 0 ? antes : titulo.trim();
}

// Coincidencia EXACTA y única (para auto-ligar con seguridad).
export function coincidenciaExacta(
  titulo: string,
  pacientes: PacienteMin[]
): PacienteMin | null {
  const objetivo = normalizar(extraerNombre(titulo));
  if (!objetivo) return null;
  const exactos = pacientes.filter((p) => normalizar(p.nombre) === objetivo);
  return exactos.length === 1 ? exactos[0] : null;
}

// Sugerencia por parecido (para confirmar a mano). Excluye el match exacto.
export function sugerenciaCercana(
  titulo: string,
  pacientes: PacienteMin[]
): PacienteMin | null {
  const objetivo = normalizar(extraerNombre(titulo));
  if (objetivo.length < 4) return null;

  let mejor: { p: PacienteMin; d: number } | null = null;
  let segundaMejorD = Infinity;
  for (const p of pacientes) {
    const d = distancia(objetivo, normalizar(p.nombre));
    if (mejor === null || d < mejor.d) {
      segundaMejorD = mejor?.d ?? Infinity;
      mejor = { p, d };
    } else if (d < segundaMejorD) {
      segundaMejorD = d;
    }
  }
  if (!mejor) return null;

  const umbral = objetivo.length <= 6 ? 1 : 2;
  // Solo sugerir si es cercano, no exacto, y claramente mejor que el segundo.
  if (mejor.d > 0 && mejor.d <= umbral && segundaMejorD > mejor.d) {
    return mejor.p;
  }
  return null;
}

// Distancia de Levenshtein (número mínimo de ediciones entre dos cadenas).
function distancia(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const fila = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = fila[0];
    fila[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = fila[j];
      fila[j] =
        a[i - 1] === b[j - 1]
          ? prev
          : Math.min(prev + 1, fila[j] + 1, fila[j - 1] + 1);
      prev = tmp;
    }
  }
  return fila[n];
}
