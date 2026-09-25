import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { IS_DEMO } from "@/lib/demo";

// Imagen que aparece al compartir el enlace (WhatsApp, LinkedIn, X, Slack…).
// Se genera una vez en el build con los colores del tema oscuro de la app.

export const alt =
  "CRM Podología: pacientes, citas, cobros y comisiones de una clínica en un solo lugar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const C = {
  fondo: "#0a0b0d",
  superficie: "#16181d",
  borde: "rgba(255,255,255,0.1)",
  texto: "#e8e8ea",
  tenue: "#9aa1ab",
  primario: "#2dd4bf",
  barra: "#12ab9b",
};

// Ingresos por semana (forma ilustrativa: crecimiento con altibajos).
const BARRAS = [48, 55, 50, 58, 62, 57, 66, 70, 64, 74, 78, 72, 84];

function Huellas({ tam }: { tam: number }) {
  return (
    <svg
      width={tam}
      height={tam}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#042a24"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z" />
      <path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z" />
      <path d="M16 17h4" />
      <path d="M4 13h4" />
    </svg>
  );
}

function Chip({ children }: { children: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexShrink: 0,
        whiteSpace: "nowrap",
        padding: "8px 16px",
        borderRadius: 999,
        border: `1px solid ${C.borde}`,
        color: C.tenue,
        fontSize: 20,
      }}
    >
      {children}
    </div>
  );
}

function Kpi({ label, valor, cambio }: { label: string; valor: string; cambio: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        padding: "18px 20px",
        borderRadius: 14,
        border: `1px solid ${C.borde}`,
        background: "#1c1f25",
      }}
    >
      <div style={{ display: "flex", fontSize: 15, color: C.tenue, letterSpacing: 1 }}>{label}</div>
      <div style={{ display: "flex", fontSize: 34, fontWeight: 600, color: C.texto, marginTop: 6 }}>
        {valor}
      </div>
      <div style={{ display: "flex", fontSize: 16, color: "#34d399", marginTop: 4 }}>{cambio}</div>
    </div>
  );
}

export default async function Image() {
  const dir = join(process.cwd(), "src/app/_og");
  const [regular, semibold] = await Promise.all([
    readFile(join(dir, "Geist-Regular.ttf")),
    readFile(join(dir, "Geist-SemiBold.ttf")),
  ]);
  const max = Math.max(...BARRAS);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: C.fondo,
          padding: 64,
          gap: 56,
          fontFamily: "Geist",
          color: C.texto,
        }}
      >
        {/* Mensaje */}
        <div style={{ display: "flex", flexDirection: "column", width: 520 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 60,
                height: 60,
                borderRadius: 16,
                background: C.primario,
              }}
            >
              <Huellas tam={34} />
            </div>
            <div style={{ display: "flex", fontSize: 30, fontWeight: 600 }}>CRM Podología</div>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 54,
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: -1.5,
              marginTop: 48,
            }}
          >
            Pacientes, citas, cobros y comisiones en un solo lugar
          </div>
          <div style={{ display: "flex", fontSize: 24, color: C.tenue, marginTop: 20, lineHeight: 1.4 }}>
            Hecho a la medida para una clínica que llevaba todo en Excel y papel.
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: "auto" }}>
            {IS_DEMO && (
              <div
                style={{
                  display: "flex",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  padding: "8px 16px",
                  borderRadius: 999,
                  background: C.primario,
                  color: "#042a24",
                  fontSize: 20,
                  fontWeight: 600,
                }}
              >
                Demo en vivo
              </div>
            )}
            <Chip>Next.js</Chip>
            <Chip>Supabase</Chip>
            <Chip>Prisma</Chip>
          </div>
        </div>

        {/* Mini panel */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: 28,
            borderRadius: 24,
            border: `1px solid ${C.borde}`,
            background: C.superficie,
          }}
        >
          <div style={{ display: "flex", gap: 16 }}>
            <Kpi label="INGRESOS · 3 MESES" valor="$235,780" cambio="+39%" />
            <Kpi label="ASISTENCIA" valor="90%" cambio="+2 pts" />
          </div>

          <div style={{ display: "flex", fontSize: 18, fontWeight: 600, marginTop: 28 }}>
            Ingresos por semana
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 10,
              flex: 1,
              marginTop: 16,
              borderBottom: `1px solid ${C.borde}`,
            }}
          >
            {BARRAS.map((b, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flex: 1,
                  height: `${(b / max) * 100}%`,
                  background: C.barra,
                  borderTopLeftRadius: 4,
                  borderTopRightRadius: 4,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Geist", data: regular, weight: 400, style: "normal" },
        { name: "Geist", data: semibold, weight: 600, style: "normal" },
      ],
    }
  );
}
