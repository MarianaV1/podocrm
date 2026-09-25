import type { PrismaClient } from "@prisma/client";

// Siembra datos ficticios para la demo del portafolio. Borra primero todo el
// contenido de negocio y lo vuelve a crear, así también sirve de "reseteo".
// SOLO debe correr contra la base de datos de la demo (nunca la del cliente).
export async function sembrarDemo(prisma: PrismaClient) {
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

  // Fechas relativas a "ahora" para que el corte y el panel de HOY tengan datos.
  const ahora = new Date();
  const dia = (diasAtras: number, hora: number, min = 0) => {
    const d = new Date(ahora);
    d.setDate(d.getDate() - diasAtras);
    d.setHours(hora, min, 0, 0);
    return d;
  };
  const redondear = (n: number) => Math.round(n * 100) / 100;

  // 2) Podólogas (comisión fija por podóloga).
  const [amalia, lucero, stephany] = await Promise.all([
    prisma.podologa.create({ data: { nombre: "Amalia Ruiz", comisionPct: 30 } }),
    prisma.podologa.create({ data: { nombre: "Lucero Díaz", comisionPct: 30 } }),
    prisma.podologa.create({
      data: { nombre: "Stephany Gómez", comisionPct: 35 },
    }),
  ]);

  // 3) Servicios (generan comisión).
  const [consulta, unas, reflexo, curacion] = await Promise.all([
    prisma.servicio.create({
      data: { nombre: "Consulta podológica", precio: 380 },
    }),
    prisma.servicio.create({
      data: { nombre: "Tratamiento de uñas", precio: 380 },
    }),
    prisma.servicio.create({ data: { nombre: "Reflexología", precio: 450 } }),
    prisma.servicio.create({
      data: { nombre: "Curación de uña enterrada", precio: 600 },
    }),
  ]);

  // 4) Productos de venta (inventario, sin comisión).
  const [desinfectante, crema, lima] = await Promise.all([
    prisma.producto.create({
      data: { nombre: "Desinfectante", precioVenta: 120, costo: 70, stock: 14 },
    }),
    prisma.producto.create({
      data: {
        nombre: "Crema humectante",
        precioVenta: 180,
        costo: 100,
        stock: 9,
      },
    }),
    prisma.producto.create({
      data: { nombre: "Lima profesional", precioVenta: 90, costo: 45, stock: 20 },
    }),
  ]);

  // 5) Pacientes con hoja clínica (algunos con banderas médicas).
  const pacientesData = [
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
      hoja: {
        hipertenso: true,
        motivoConsulta: "Uña enterrada en el pie izquierdo.",
      },
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
      hoja: {
        otrasCondiciones: "Pie plano.",
        observaciones: "Recomendar plantillas.",
      },
    },
    { nombre: "Miguel Hernández", telefono: "5578901234", hoja: null },
    { nombre: "Sofía Flores", telefono: "5589012345", hoja: null },
  ];

  const pacientes = [];
  let folio = 1;
  for (const p of pacientesData) {
    const paciente = await prisma.paciente.create({
      data: {
        nombre: p.nombre,
        telefono: p.telefono,
        ...(p.hoja
          ? { hojaClinica: { create: { folio: folio++, ...p.hoja } } }
          : {}),
      },
    });
    pacientes.push(paciente);
  }

  // 6) Citas de ejemplo (con estado, paciente y podóloga).
  const podologas = [amalia, lucero, stephany];
  const citasPlan: {
    p: number; // índice de paciente
    pod: number; // índice de podóloga
    dias: number;
    hora: number;
    min: number;
    estado: "LLEGO" | "LLEGO_TARDE" | "AGENDADA" | "NO_SHOW";
  }[] = [
    // Hoy (con cobro → alimenta el corte de caja y el panel).
    { p: 0, pod: 0, dias: 0, hora: 10, min: 0, estado: "LLEGO" },
    { p: 1, pod: 1, dias: 0, hora: 11, min: 30, estado: "LLEGO" },
    { p: 6, pod: 2, dias: 0, hora: 13, min: 0, estado: "AGENDADA" },
    // Próximas (días futuros, aún AGENDADA).
    { p: 2, pod: 0, dias: -1, hora: 11, min: 0, estado: "AGENDADA" },
    { p: 3, pod: 1, dias: -1, hora: 16, min: 30, estado: "AGENDADA" },
    { p: 4, pod: 2, dias: -3, hora: 12, min: 0, estado: "AGENDADA" },
    { p: 5, pod: 0, dias: -6, hora: 10, min: 0, estado: "AGENDADA" },
    // Anteriores (historial atendido).
    { p: 7, pod: 1, dias: 1, hora: 15, min: 0, estado: "LLEGO" },
    { p: 0, pod: 2, dias: 2, hora: 11, min: 0, estado: "LLEGO_TARDE" },
    { p: 1, pod: 0, dias: 3, hora: 18, min: 0, estado: "NO_SHOW" },
  ];

  const citas = [];
  let evt = 1;
  for (const c of citasPlan) {
    const inicio = dia(c.dias, c.hora, c.min);
    const fin = new Date(inicio.getTime() + 45 * 60 * 1000);
    const cita = await prisma.cita.create({
      data: {
        googleEventId: `demo-evt-${evt++}`,
        titulo: pacientes[c.p].nombre,
        inicio,
        fin,
        estado: c.estado,
        pacienteId: pacientes[c.p].id,
        podologaId: podologas[c.pod].id,
      },
    });
    citas.push({ cita, plan: c });
  }

  // Cita con el nombre mal escrito y sin ligar: muestra la sugerencia
  // "¿Es Carlos Sánchez? Ligar" (así llegan a veces desde el calendario).
  const inicioSinLigar = dia(0, 17, 0);
  await prisma.cita.create({
    data: {
      googleEventId: `demo-evt-${evt++}`,
      titulo: "Carlos Sanches - revisión",
      inicio: inicioSinLigar,
      fin: new Date(inicioSinLigar.getTime() + 45 * 60 * 1000),
      estado: "AGENDADA",
      podologaId: lucero.id,
    },
  });

  // 7) Pagos por los servicios de las citas que llegaron.
  const servicios = [consulta, unas, reflexo, curacion];
  let si = 0;
  for (const { cita, plan } of citas) {
    if (plan.estado !== "LLEGO" && plan.estado !== "LLEGO_TARDE") continue;
    const servicio = servicios[si % servicios.length];
    si++;
    const pod = podologas[plan.pod];
    const monto = Number(servicio.precio);
    const comision = redondear((monto * pod.comisionPct) / 100);
    await prisma.pago.create({
      data: {
        monto,
        metodo: si % 2 === 0 ? "TARJETA" : "EFECTIVO",
        comision,
        servicioId: servicio.id,
        podologaId: pod.id,
        citaId: cita.id,
        fecha: cita.inicio,
      },
    });
  }

  // 8) Un par de ventas de producto (sin comisión, con utilidad).
  await prisma.pago.create({
    data: {
      monto: 120,
      metodo: "EFECTIVO",
      utilidad: 50,
      cantidad: 1,
      productoId: desinfectante.id,
      citaId: citas[0].cita.id,
      fecha: dia(0, 10, 30),
    },
  });
  await prisma.pago.create({
    data: {
      monto: 360,
      metodo: "TARJETA",
      utilidad: 160,
      cantidad: 2,
      productoId: crema.id,
      fecha: dia(1, 13, 0),
    },
  });

  // 9) Movimientos de efectivo de hoy.
  await prisma.movimientoCaja.create({
    data: {
      tipo: "ENTRADA",
      monto: 500,
      concepto: "Fondo de caja",
      fecha: dia(0, 9, 0),
    },
  });
  await prisma.movimientoCaja.create({
    data: {
      tipo: "SALIDA",
      monto: 200,
      concepto: "Compra de material",
      fecha: dia(0, 14, 0),
    },
  });

  return {
    podologas: podologas.length,
    servicios: servicios.length,
    productos: 3,
    pacientes: pacientes.length,
    citas: citas.length + 1,
  };
}
