import type { Alignment, Side } from "driver.js";

// Un paso del recorrido guiado. `elementos` son selectores en orden de
// prioridad: se resalta el primero que esté visible; si ninguno lo está, el
// popover sale centrado (p. ej. en móvil, o si otro visitante cambió los datos).
export type PasoTour = {
  ruta: string;
  elementos?: string[];
  titulo: string;
  texto: string;
  lado?: Side;
  alinear?: Alignment;
  // Permite interactuar con el elemento resaltado (p. ej. pasar el cursor).
  interactivo?: boolean;
};

const sel = (nombre: string) => `[data-tour="${nombre}"]`;

export function crearPasos(pacienteEjemploId: string | null): PasoTour[] {
  const pasos: (PasoTour | null)[] = [
    {
      ruta: "/dashboard",
      titulo: "👋 Bienvenido a CRM Podología",
      texto:
        "Este sistema reemplaza el Excel y las hojas clínicas en papel de una clínica de podología. En un minuto te muestro cómo se usa en un día normal.",
    },
    {
      ruta: "/dashboard",
      elementos: [sel("resumen-hoy")],
      titulo: "El día de un vistazo",
      texto:
        "Lo que entró hoy, separado en efectivo y tarjeta, y cuántos pacientes se atendieron. Se actualiza solo con cada cobro.",
    },
    {
      ruta: "/dashboard/citas",
      elementos: [sel("cita")],
      titulo: "La agenda",
      texto:
        "La clínica sigue agendando en su Google Calendar y el CRM importa las citas (solo lectura, nunca modifica el calendario). En esta demo son citas de ejemplo.",
    },
    {
      ruta: "/dashboard/citas",
      elementos: [sel("cita-estado")],
      titulo: "¿Llegó el paciente?",
      texto:
        "Con un clic registras si llegó, llegó tarde o no vino. Con eso se arma solo el reporte para la Secretaría de Salud.",
      alinear: "end",
    },
    {
      ruta: "/dashboard/citas",
      elementos: [sel("cita-pago")],
      titulo: "Cobra en segundos",
      texto:
        "Elige el servicio o producto y si pagó en efectivo o con tarjeta. La comisión de la podóloga se calcula sola y el inventario se descuenta.",
      alinear: "end",
    },
    {
      ruta: "/dashboard/citas",
      elementos: [sel("cita-sugerencia"), sel("cita-paciente")],
      titulo: "Ligado inteligente",
      texto:
        "Cada cita se liga a su paciente automáticamente. Si el nombre en el calendario viene mal escrito, el CRM sugiere al paciente más parecido y lo ligas con un clic.",
    },
    {
      ruta: "/dashboard/pacientes",
      elementos: [sel("salud-alerta")],
      titulo: "Alertas de salud a la vista",
      texto:
        "Los pacientes diabéticos, hipertensos o con alergias se marcan en la lista. Pasa el cursor sobre el ícono para ver el detalle.",
      alinear: "end",
      interactivo: true,
    },
    pacienteEjemploId
      ? {
          ruta: `/dashboard/pacientes/${pacienteEjemploId}`,
          elementos: [sel("hoja-clinica")],
          titulo: "Hoja clínica digital",
          texto:
            "Reemplaza el archivero: folio automático, condiciones de riesgo resaltadas y una versión lista para imprimir.",
        }
      : null,
    {
      ruta: "/dashboard/caja",
      elementos: [sel("caja-totales")],
      titulo: "Corte de caja",
      texto:
        "Todo lo cobrado en el día, separado en efectivo y tarjeta. Debajo está el desglose de servicios, productos y comisiones.",
    },
    {
      ruta: "/dashboard/caja",
      elementos: [sel("caja-esperado")],
      titulo: "¿Cuadra la caja?",
      texto:
        "Registra gastos o entradas de efectivo y el CRM calcula cuánto debería haber en la caja al cerrar el día.",
      lado: "top",
    },
    {
      ruta: "/dashboard/reporte-salud",
      elementos: [sel("reporte")],
      titulo: "Reporte para Salud",
      texto:
        "La lista de pacientes atendidos, con fecha, hora y podóloga, que pide la Secretaría de Salud. Se filtra por fechas y se imprime o guarda en PDF.",
    },
    {
      ruta: "/dashboard/reporte-salud",
      elementos: [sel("tour-boton"), sel("nav")],
      titulo: "Sigue explorando",
      texto:
        "Los datos son ficticios y se reinician cada día: prueba lo que quieras. Puedes repetir este recorrido desde “Recorrido guiado” en el menú.",
      lado: "right",
      alinear: "end",
    },
  ];
  return pasos.filter((p): p is PasoTour => p !== null);
}
