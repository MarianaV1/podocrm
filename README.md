# CRM Podología

Sistema de gestión integral para una clínica de podología: pacientes con hoja
clínica, agenda de citas sincronizada con Google Calendar, cobros con comisiones
por podóloga, inventario de productos, corte de caja diario y reporte para la
Secretaría de Salud.

**[▶ Ver demo en vivo](https://TU-URL.vercel.app)** · Entra con un clic con el
botón **"Entrar a la demo"** (datos ficticios, sin registro).

---

## ✨ Características

- **Pacientes y hoja clínica** — ficha por paciente con una única hoja clínica
  (folio autoincremental), banderas médicas (diabético/hipertenso), alergias y
  condiciones destacadas. Enlace directo a WhatsApp e impresión/PDF de la hoja.
- **Citas** — importadas desde Google Calendar (solo lectura), agrupadas por
  semana y día, con filtro *Próximas / Anteriores*. Se marca la llegada (a tiempo
  o tarde) y se ligan al paciente (con auto-emparejado y buscador escalable).
- **Servicios y productos** — servicios que realizan las podólogas (generan
  comisión) separados de productos de venta (con costo, utilidad e inventario).
- **Pagos y comisiones** — cobro por cita (efectivo/tarjeta); comisión fija por
  podóloga calculada automáticamente; las ventas de producto descuentan stock.
- **Corte de caja** — totales del día por método, desglose servicios/productos,
  movimientos de efectivo (entradas/salidas) y efectivo esperado en caja.
- **Reporte Secretaría de Salud** — listado imprimible de pacientes atendidos por
  rango de fechas (nombre, fecha, hora y podóloga).
- **Tema claro/oscuro** y diseño responsivo (sidebar en escritorio, drawer en
  móvil).

## 🛠️ Stack

| Área | Tecnología |
|------|------------|
| Framework | Next.js 16 (App Router, Server Components y Server Actions) |
| UI | React 19, TypeScript, Tailwind CSS 4, lucide-react |
| Datos | Prisma 6 + PostgreSQL (Supabase) |
| Auth | Supabase Auth (`@supabase/ssr`) |
| Integraciones | Google Calendar API (`google-auth-library`, OAuth read-only) |
| Hosting | Vercel + Supabase |

## 🧭 Decisiones de arquitectura

- **Server Components + Server Actions**: la lógica de datos vive en el servidor;
  el cliente solo carga interactividad puntual (modales, buscadores, toggles).
- **Fuente de verdad = Google Calendar**: el CRM lee las citas (nunca escribe),
  respetando el flujo actual del negocio; el emparejado con pacientes es seguro
  (solo auto-liga coincidencias exactas) con sugerencias por parecido y buscador.
- **Zona horaria fija (America/Mexico_City)** para agrupar citas y cortes de caja
  correctamente sin importar dónde corra el servidor.
- **Modo demo** aislado por variable de entorno (ver abajo): misma base de código,
  base de datos y despliegue separados de la producción del cliente.

## 🚀 Correr localmente

Requisitos: Node 20+, [pnpm](https://pnpm.io), una base de datos PostgreSQL
(Supabase) y credenciales de Google OAuth (opcional, solo para citas reales).

```bash
pnpm install
cp .env.example .env      # rellena con tus valores
pnpm prisma migrate deploy
pnpm dev
```

Variables de entorno: ver [`.env.example`](.env.example).

## 🧪 Modo demo

Con `DEMO=true` la app cambia a un modo pensado para mostrarla sin fricción:
botón de **login de invitado**, **datos ficticios** sembrados, se oculta el
conector de Google (usa citas de ejemplo) y un **reseteo diario** (Vercel Cron)
mantiene la demo limpia.

```bash
pnpm demo:setup   # migra + siembra la base de datos demo (usa .env.demo)
pnpm demo:dev     # corre la app apuntando a la base demo
```

## 📁 Estructura

```
src/
  app/
    dashboard/      # pacientes, citas, servicios, productos, podólogas, caja, reporte
    login/          # autenticación
    api/            # OAuth de Google + reseteo de la demo
    actions/        # Server Actions (pacientes, pagos, caja, google, ...)
  components/        # sidebar, ui/ (button, card, badge, input, ...), etc.
  lib/               # prisma, supabase, fechas, matching, demo, ...
prisma/              # schema + migraciones + seed de la demo
```

---

Proyecto desarrollado para una clínica de podología (2025). Código privado.
