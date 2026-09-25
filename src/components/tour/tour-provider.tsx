"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Driver } from "driver.js";
import "driver.js/dist/driver.css";
import { crearPasos } from "./pasos";

// Recorrido guiado de la demo. Se recuerda por navegador (localStorage) porque
// todos los visitantes comparten el mismo usuario invitado.

type EstadoTour = "completado" | "omitido" | null;

type TourContexto = { estado: EstadoTour; iniciar: () => void };

const Contexto = createContext<TourContexto | null>(null);

// null cuando el recorrido no está habilitado (fuera de la demo).
export function useTour() {
  return useContext(Contexto);
}

const CLAVE = "crm-tour-v1";
const oyentes = new Set<() => void>();

function leerEstado(): EstadoTour {
  try {
    const v = localStorage.getItem(CLAVE);
    return v === "completado" || v === "omitido" ? v : null;
  } catch {
    return null;
  }
}

function guardarEstado(estado: "completado" | "omitido") {
  try {
    localStorage.setItem(CLAVE, estado);
  } catch {}
  oyentes.forEach((cb) => cb());
}

function suscribir(cb: () => void) {
  oyentes.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    oyentes.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

// Primer elemento visible de la lista (el sidebar, p. ej., está oculto en móvil).
function buscarVisible(selectores: string[]): Element | undefined {
  for (const s of selectores) {
    for (const el of document.querySelectorAll(s)) {
      if (el.getClientRects().length > 0) return el;
    }
  }
}

// Espera cuadro a cuadro hasta que se cumpla la condición o pase el límite.
function esperarHasta(condicion: () => boolean, limiteMs: number) {
  return new Promise<void>((resolve) => {
    const inicio = performance.now();
    const revisar = () => {
      if (condicion() || performance.now() - inicio > limiteMs) resolve();
      else requestAnimationFrame(revisar);
    };
    revisar();
  });
}

export function TourProvider({
  enabled,
  pacienteEjemploId,
  children,
}: {
  enabled: boolean;
  pacienteEjemploId: string | null;
  children: ReactNode;
}) {
  if (!enabled) return <>{children}</>;
  return <TourActivo pacienteEjemploId={pacienteEjemploId}>{children}</TourActivo>;
}

function TourActivo({
  pacienteEjemploId,
  children,
}: {
  pacienteEjemploId: string | null;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const estado = useSyncExternalStore(suscribir, leerEstado, () => null);
  const driverRef = useRef<Driver | null>(null);
  const iniciando = useRef(false);

  const pasos = useMemo(() => crearPasos(pacienteEjemploId), [pacienteEjemploId]);

  const iniciar = useCallback(async () => {
    if (iniciando.current || driverRef.current?.isActive()) return;
    iniciando.current = true;
    let driver: typeof import("driver.js").driver;
    try {
      ({ driver } = await import("driver.js"));
    } finally {
      iniciando.current = false;
    }
    for (const ruta of new Set(pasos.map((p) => p.ruta))) router.prefetch(ruta);

    const html = document.documentElement;
    let navegando = false;

    // Lleva al paso i: si vive en otra página, navega y espera a que aparezca.
    async function ir(i: number) {
      if (navegando || i < 0) return;
      if (i >= pasos.length) {
        guardarEstado("completado");
        d.destroy();
        return;
      }
      const paso = pasos[i];
      if (window.location.pathname !== paso.ruta) {
        navegando = true;
        html.classList.add("tour-navegando");
        router.push(paso.ruta);
        await esperarHasta(
          () =>
            window.location.pathname === paso.ruta &&
            (!paso.elementos || buscarVisible(paso.elementos) !== undefined),
          8000
        );
        html.classList.remove("tour-navegando");
        navegando = false;
        if (!d.isActive()) return;
      }
      d.moveTo(i);
    }

    const d = driver({
      steps: pasos.map((p, i) => ({
        element: p.elementos
          ? () => buscarVisible(p.elementos!) as Element
          : undefined,
        disableActiveInteraction: !p.interactivo,
        popover: {
          title: p.titulo,
          description: p.texto,
          side: p.lado,
          align: p.alinear,
          ...(i === 0
            ? { nextBtnText: "Empezar recorrido", showButtons: ["next", "close"] }
            : {}),
        },
      })),
      animate: !matchMedia("(prefers-reduced-motion: reduce)").matches,
      smoothScroll: true,
      overlayOpacity: 0.55,
      stagePadding: 6,
      stageRadius: 12,
      popoverClass: "crm-tour",
      showProgress: true,
      progressText: "{{current}} de {{total}}",
      nextBtnText: "Siguiente",
      prevBtnText: "Atrás",
      doneBtnText: "¡Listo!",
      // Un clic en el fondo no cierra el recorrido (evita perderlo por accidente).
      overlayClickBehavior: () => {},
      onNextClick: () => void ir((d.getActiveIndex() ?? 0) + 1),
      onPrevClick: () => void ir((d.getActiveIndex() ?? 0) - 1),
      onDestroyStarted: () => {
        guardarEstado(d.isLastStep() ? "completado" : "omitido");
        d.destroy();
      },
      onDestroyed: () => html.classList.remove("tour-navegando"),
      onPopoverRender: (popover, { state }) => {
        if (state.activeIndex !== 0) return;
        // Bienvenida: sin contador y con opción de saltar el recorrido.
        popover.progress.style.display = "none";
        const saltar = document.createElement("button");
        saltar.type = "button";
        saltar.textContent = "Ahora no";
        saltar.className = "driver-popover-footer-btn crm-tour-saltar";
        saltar.addEventListener("click", () => {
          guardarEstado("omitido");
          d.destroy();
        });
        popover.footerButtons.prepend(saltar);
      },
    });

    driverRef.current = d;
    d.drive();
  }, [pasos, router]);

  // Primera visita: arranca solo en el panel.
  useEffect(() => {
    if (pathname !== "/dashboard" || leerEstado() !== null) return;
    const t = setTimeout(() => void iniciar(), 600);
    return () => clearTimeout(t);
    // Solo al montar el layout; no se relanza al navegar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si se sale del dashboard (p. ej. cerrar sesión) no debe quedar colgado.
  useEffect(() => () => driverRef.current?.destroy(), []);

  const valor = useMemo(
    () => ({ estado, iniciar: () => void iniciar() }),
    [estado, iniciar]
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
