import { randomUUID } from "crypto";
import type { EstadoCita, MetodoPago, PrismaClient } from "@prisma/client";
import { hoyMX, sumarDiasKey } from "./fecha";

// Siembra datos ficticios para la demo del portafolio. Borra primero todo el
// contenido de negocio y lo vuelve a crear, así también sirve de "reseteo".
// SOLO debe correr contra la base de datos de la demo (nunca la del cliente).
//
// Simula ~6 meses de operación de la clínica (con crecimiento gradual) para que
// las gráficas del panel tengan historia. Es determinista: un generador con
// semilla fija produce los mismos datos en cada reseteo (relativos a hoy).

const DIAS_HISTORIA = 182;
const DIAS_FUTURO = 14;

// Generador pseudoaleatorio con semilla (mulberry32).
function crearAzar(semilla: number) {
  let a = semilla;
  const azar = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const entero = (min: number, max: number) =>
    min + Math.floor(azar() * (max - min + 1));
  const elegir = <T>(opciones: T[], pesos: number[]) => {
    const total = pesos.reduce((s, p) => s + p, 0);
    let r = azar() * total;
    for (let i = 0; i < opciones.length; i++) {
      r -= pesos[i];
      if (r <= 0) return opciones[i];
    }
    return opciones[opciones.length - 1];
  };
  return { azar, entero, elegir };
}

// Fecha/hora en la zona de México (UTC-6), sin depender de la zona del servidor.
function enMX(dia: string, hora: number, min = 0) {
  const hh = String(hora).padStart(2, "0");
  const mm = String(min).padStart(2, "0");
  return new Date(`${dia}T${hh}:${mm}:00-06:00`);
}

const esDomingo = (dia: string) => new Date(`${dia}T00:00:00Z`).getUTCDay() === 0;
const esSabado = (dia: string) => new Date(`${dia}T00:00:00Z`).getUTCDay() === 6;
const esViernes = (dia: string) => new Date(`${dia}T00:00:00Z`).getUTCDay() === 5;
const redondear = (n: number) => Math.round(n * 100) / 100;
const minutos = (d: Date, n: number) => new Date(d.getTime() + n * 60 * 1000);

type Hoja = {
  diabetico?: boolean;
  hipertenso?: boolean;
  otrasCondiciones?: string;
  comentarioSalud?: string;
  alergias?: string;
  motivoConsulta?: string;
  antecedentes?: string;
  observaciones?: string;
};

// Pacientes fijos (los usa el recorrido guiado; Laura es la única con
// diabetes + hipertensión, su ficha es la de ejemplo).
const PACIENTES_FIJOS: { nombre: string; telefono: string; hoja: Hoja | null }[] = [
  {
    nombre: "María González",
    telefono: "5512345678",
    hoja: {
      diabetico: true,
      motivoConsulta: "Dolor en el talón derecho.",
      antecedentes: "Diabetes tipo 2 controlada.",
    },
  },
  {
    nombre: "Juan Pérez",
    telefono: "5523456789",
    hoja: { hipertenso: true, motivoConsulta: "Uña enterrada en el pie izquierdo." },
  },
  {
    nombre: "Laura Martínez",
    telefono: "5534567890",
    hoja: {
      diabetico: true,
      hipertenso: true,
      otrasCondiciones: "Neuropatía diabética.",
      comentarioSalud: "Revisar sensibilidad en ambos pies.",
    },
  },
  {
    nombre: "Carlos Sánchez",
    telefono: "5545678901",
    hoja: { alergias: "Penicilina", motivoConsulta: "Callosidades." },
  },
  {
    nombre: "Ana Torres",
    telefono: "5556789012",
    hoja: { motivoConsulta: "Mantenimiento general de uñas." },
  },
  {
    nombre: "Rosa Ramírez",
    telefono: "5567890123",
    hoja: { otrasCondiciones: "Pie plano.", observaciones: "Recomendar plantillas." },
  },
  { nombre: "Miguel Hernández", telefono: "5578901234", hoja: null },
  { nombre: "Sofía Flores", telefono: "5589012345", hoja: null },
];

const OTROS_NOMBRES = [
  "Patricia Morales", "Jorge Castillo", "Guadalupe Reyes", "Fernando Ortiz",
  "Verónica Cruz", "Ricardo Vargas", "Alejandra Mendoza", "Héctor Jiménez",
  "Daniela Ruiz", "Arturo Domínguez", "Claudia Herrera", "Roberto Aguilar",
  "Mónica Medina", "Eduardo Castro", "Adriana Romero", "Francisco Guerrero",
  "Leticia Navarro", "Sergio Ramos", "Gabriela Salazar", "Manuel Delgado",
  "Teresa Rojas", "Alberto Contreras", "Lorena Espinoza", "Raúl Chávez",
  "Silvia Estrada", "Óscar Luna", "Carmen Figueroa", "Javier Ríos",
  "Beatriz Campos", "Enrique Pacheco", "Diana Soto", "Martín Cortés",
  "Irma Vega", "Luis Carrillo",
];

const MOTIVOS = [
  "Mantenimiento general de uñas.",
  "Uña enterrada.",
  "Callosidades en la planta del pie.",
  "Hongos en las uñas.",
  "Dolor al caminar.",
  "Revisión de rutina.",
  "Talón agrietado.",
];

export async function sembrarDemo(prisma: PrismaClient) {
  const { azar, entero, elegir } = crearAzar(20260901);
  // Generador aparte para los teléfonos: no altera la secuencia del resto.
  const telefonos = crearAzar(5512);
  const hoy = hoyMX();

  // 1) Limpiar en orden de dependencias.
  await prisma.pago.deleteMany();
  await prisma.movimientoCaja.deleteMany();
  await prisma.cita.deleteMany();
  await prisma.hojaClinica.deleteMany();
  await prisma.paciente.deleteMany();
  await prisma.servicio.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.podologa.deleteMany();
  await prisma.googleConexion.deleteMany();

  // 2) Podólogas (comisión fija por podóloga).
  const podologas = [
    { id: randomUUID(), nombre: "Amalia Ruiz", comisionPct: 30 },
    { id: randomUUID(), nombre: "Lucero Díaz", comisionPct: 30 },
    { id: randomUUID(), nombre: "Stephany Gómez", comisionPct: 35 },
  ];
  const [amalia, lucero, stephany] = podologas;
  const pesoPodologa = [40, 35, 25];
  await prisma.podologa.createMany({ data: podologas });

  // 3) Servicios (generan comisión). `peso` = qué tan seguido se piden.
  const servicios = [
    { id: randomUUID(), nombre: "Consulta podológica", precio: 380, peso: 34 },
    { id: randomUUID(), nombre: "Tratamiento de uñas", precio: 380, peso: 26 },
    { id: randomUUID(), nombre: "Pedicure clínico", precio: 350, peso: 18 },
    { id: randomUUID(), nombre: "Reflexología", precio: 450, peso: 12 },
    { id: randomUUID(), nombre: "Curación de uña enterrada", precio: 600, peso: 10 },
  ];
  const [consulta, unas] = servicios;
  await prisma.servicio.createMany({
    data: servicios.map(({ id, nombre, precio }) => ({ id, nombre, precio })),
  });

  // 4) Productos de venta (inventario, sin comisión). Stock final ya descontado;
  //    un par quedan bajos para que se vea la alerta de inventario.
  const productos = [
    { id: randomUUID(), nombre: "Desinfectante", precioVenta: 120, costo: 70, stock: 14, peso: 40 },
    { id: randomUUID(), nombre: "Crema humectante", precioVenta: 180, costo: 100, stock: 4, peso: 30 },
    { id: randomUUID(), nombre: "Lima profesional", precioVenta: 90, costo: 45, stock: 20, peso: 18 },
    { id: randomUUID(), nombre: "Talco antimicótico", precioVenta: 95, costo: 50, stock: 2, peso: 12 },
  ];
  const [desinfectante] = productos;
  await prisma.producto.createMany({
    data: productos.map(({ id, nombre, precioVenta, costo, stock }) => ({
      id,
      nombre,
      precioVenta,
      costo,
      stock,
    })),
  });

  // 5) Pacientes. Cada uno se da de alta en un día del pasado (la clínica va
  //    sumando pacientes) y tiene una "frecuencia" con la que vuelve.
  type PacienteSeed = {
    id: string;
    nombre: string;
    telefono: string;
    hoja: Hoja | null;
    altaHaceDias: number;
    frecuencia: number;
  };
  const pacientes: PacienteSeed[] = [
    ...PACIENTES_FIJOS.map((p) => ({
      ...p,
      id: randomUUID(),
      altaHaceDias: entero(120, DIAS_HISTORIA),
      frecuencia: 1.5 + azar(),
    })),
    ...OTROS_NOMBRES.map((nombre) => {
      const r = azar();
      const hoja: Hoja | null =
        r < 0.7
          ? {
              // Nunca diabético + hipertenso a la vez (eso es solo de Laura).
              diabetico: r < 0.1,
              hipertenso: r >= 0.1 && r < 0.18,
              alergias: azar() < 0.1 ? elegir(["Látex", "Yodo", "Ibuprofeno"], [1, 1, 1]) : undefined,
              otrasCondiciones: azar() < 0.08 ? "Mala circulación." : undefined,
              motivoConsulta: elegir(MOTIVOS, MOTIVOS.map(() => 1)),
            }
          : null;
      // Altas repartidas: unas pocas al inicio y más conforme crece la clínica.
      const altaHaceDias = Math.round(DIAS_HISTORIA * Math.pow(azar(), 0.6));
      return {
        id: randomUUID(),
        nombre,
        telefono: `55${telefonos.entero(10000000, 99999999)}`,
        hoja,
        altaHaceDias,
        frecuencia: 0.4 + azar() * 1.6,
      };
    }),
  ];

  await prisma.paciente.createMany({
    data: pacientes.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      telefono: p.telefono,
      createdAt: enMX(sumarDiasKey(hoy, -p.altaHaceDias), 9),
    })),
  });
  let folio = 1;
  await prisma.hojaClinica.createMany({
    data: pacientes
      .filter((p) => p.hoja)
      .map((p) => ({ pacienteId: p.id, folio: folio++, ...p.hoja })),
  });

  // 6) Citas, pagos y movimientos de caja, día por día.
  type CitaSeed = {
    id: string;
    googleEventId: string;
    titulo: string;
    inicio: Date;
    fin: Date;
    estado: EstadoCita;
    pacienteId: string | null;
    podologaId: string;
  };
  type PagoSeed = {
    monto: number;
    metodo: MetodoPago;
    comision: number;
    utilidad: number;
    cantidad: number;
    fecha: Date;
    servicioId?: string;
    productoId?: string;
    podologaId?: string;
    citaId?: string;
  };
  type MovimientoSeed = {
    tipo: "ENTRADA" | "SALIDA";
    monto: number;
    concepto: string;
    fecha: Date;
  };
  const citas: CitaSeed[] = [];
  const pagos: PagoSeed[] = [];
  const movimientos: MovimientoSeed[] = [];
  let evt = 1;

  const nuevaCita = (
    dia: string,
    hora: number,
    min: number,
    paciente: PacienteSeed | null,
    podologa: { id: string },
    estado: EstadoCita,
    titulo?: string
  ) => {
    const inicio = enMX(dia, hora, min);
    const cita: CitaSeed = {
      id: randomUUID(),
      googleEventId: `demo-evt-${evt++}`,
      titulo: titulo ?? paciente!.nombre,
      inicio,
      fin: minutos(inicio, 45),
      estado,
      pacienteId: paciente?.id ?? null,
      podologaId: podologa.id,
    };
    citas.push(cita);
    return cita;
  };

  const cobrarServicio = (
    cita: CitaSeed,
    servicio: (typeof servicios)[number],
    metodo: MetodoPago
  ) => {
    const pod = podologas.find((p) => p.id === cita.podologaId)!;
    pagos.push({
      monto: servicio.precio,
      metodo,
      comision: redondear((servicio.precio * pod.comisionPct) / 100),
      utilidad: 0,
      cantidad: 1,
      fecha: minutos(cita.inicio, 50),
      servicioId: servicio.id,
      podologaId: pod.id,
      citaId: cita.id,
    });
  };

  const venderProducto = (
    cita: CitaSeed,
    producto: (typeof productos)[number],
    cantidad: number,
    metodo: MetodoPago
  ) => {
    pagos.push({
      monto: producto.precioVenta * cantidad,
      metodo,
      comision: 0,
      utilidad: (producto.precioVenta - producto.costo) * cantidad,
      cantidad,
      fecha: minutos(cita.inicio, 55),
      productoId: producto.id,
      citaId: cita.id,
    });
  };

  // Horarios posibles: de 9:00 a 18:45, cada 45 minutos.
  const HORARIOS = Array.from({ length: 14 }, (_, i) => {
    const total = 9 * 60 + i * 45;
    return { hora: Math.floor(total / 60), min: total % 60 };
  });

  for (let offset = -DIAS_HISTORIA; offset <= DIAS_FUTURO; offset++) {
    const dia = sumarDiasKey(hoy, offset);
    if (esDomingo(dia) || offset === 0) continue; // Domingo cerrado; hoy va aparte.

    // Crecimiento: de ~5-6 citas diarias hace 6 meses a ~8 hoy; sábados más llenos.
    const progreso = (offset + DIAS_HISTORIA) / DIAS_HISTORIA;
    const base = 5.5 + 2.5 * Math.min(progreso, 1) + (esSabado(dia) ? 2 : 0);
    const cuantas = Math.max(2, Math.min(HORARIOS.length, Math.round(base + (azar() - 0.5) * 3)));

    const disponibles = pacientes.filter((p) => p.altaHaceDias >= -offset);
    const usados = new Set<string>();
    // Barajar (Fisher-Yates) y quedarse con los primeros, en orden de hora.
    const barajados = [...HORARIOS];
    for (let i = barajados.length - 1; i > 0; i--) {
      const j = Math.floor(azar() * (i + 1));
      [barajados[i], barajados[j]] = [barajados[j], barajados[i]];
    }
    const horarios = barajados
      .slice(0, cuantas)
      .sort((a, b) => a.hora * 60 + a.min - (b.hora * 60 + b.min));

    for (const h of horarios) {
      const libres = disponibles.filter((p) => !usados.has(p.id));
      if (libres.length === 0) break;
      const paciente = elegir(libres, libres.map((p) => p.frecuencia));
      usados.add(paciente.id);
      const podologa = elegir(podologas, pesoPodologa);

      if (offset > 0) {
        nuevaCita(dia, h.hora, h.min, paciente, podologa, "AGENDADA");
        continue;
      }
      const estado = elegir<EstadoCita>(["LLEGO", "LLEGO_TARDE", "NO_SHOW"], [80, 11, 9]);
      const cita = nuevaCita(dia, h.hora, h.min, paciente, podologa, estado);
      if (estado === "NO_SHOW") continue;

      const metodo = elegir<MetodoPago>(["EFECTIVO", "TARJETA"], [55, 45]);
      cobrarServicio(cita, elegir(servicios, servicios.map((s) => s.peso)), metodo);
      if (azar() < 0.2) {
        venderProducto(
          cita,
          elegir(productos, productos.map((p) => p.peso)),
          azar() < 0.15 ? 2 : 1,
          metodo
        );
      }
    }

    // Movimientos de efectivo de los días ya trabajados.
    if (offset < 0) {
      movimientos.push({ tipo: "ENTRADA", monto: 500, concepto: "Fondo de caja", fecha: enMX(dia, 8, 50) });
      if (esViernes(dia)) {
        movimientos.push({ tipo: "SALIDA", monto: 350, concepto: "Pago de limpieza", fecha: enMX(dia, 18, 30) });
      }
      if (azar() < 0.25) {
        movimientos.push({
          tipo: "SALIDA",
          monto: entero(12, 45) * 10,
          concepto: "Compra de material",
          fecha: enMX(dia, entero(11, 17), 0),
        });
      }
    }
  }

  // 7) Hoy: fijo, para que el panel y el recorrido guiado siempre se vean igual.
  const [maria, juan, , , ana, , miguel] = pacientes;
  const citaMaria = nuevaCita(hoy, 10, 0, maria, amalia, "LLEGO");
  cobrarServicio(citaMaria, consulta, "EFECTIVO");
  venderProducto(citaMaria, desinfectante, 1, "EFECTIVO");
  const citaJuan = nuevaCita(hoy, 11, 30, juan, lucero, "LLEGO");
  cobrarServicio(citaJuan, unas, "TARJETA");
  nuevaCita(hoy, 13, 0, miguel, stephany, "AGENDADA");
  nuevaCita(hoy, 15, 45, ana, amalia, "AGENDADA");
  // Nombre mal escrito y sin ligar: muestra la sugerencia "¿Es Carlos Sánchez?"
  // (así llegan a veces desde el calendario).
  nuevaCita(hoy, 17, 0, null, lucero, "AGENDADA", "Carlos Sanches - revisión");
  movimientos.push(
    { tipo: "ENTRADA", monto: 500, concepto: "Fondo de caja", fecha: enMX(hoy, 8, 50) },
    { tipo: "SALIDA", monto: 200, concepto: "Compra de material", fecha: enMX(hoy, 14, 0) }
  );

  await prisma.cita.createMany({ data: citas });
  await prisma.pago.createMany({ data: pagos });
  await prisma.movimientoCaja.createMany({ data: movimientos });

  return {
    podologas: podologas.length,
    servicios: servicios.length,
    productos: productos.length,
    pacientes: pacientes.length,
    citas: citas.length,
    pagos: pagos.length,
    movimientos: movimientos.length,
  };
}
