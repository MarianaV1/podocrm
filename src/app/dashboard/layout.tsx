import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { IS_DEMO } from "@/lib/demo";
import { DesktopSidebar, MobileNav } from "@/components/sidebar";
import { TourProvider } from "@/components/tour/tour-provider";

// Paciente con alertas rojas y amarillas para mostrar su ficha en el recorrido.
async function pacienteEjemplo() {
  const conAlertas = await prisma.paciente.findFirst({
    where: { hojaClinica: { is: { diabetico: true, hipertenso: true } } },
    select: { id: true },
  });
  if (conAlertas) return conAlertas.id;
  const conHoja = await prisma.paciente.findFirst({
    where: { hojaClinica: { isNot: null } },
    select: { id: true },
  });
  return conHoja?.id ?? null;
}

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const email = user.email ?? "";
  const ejemploId = IS_DEMO ? await pacienteEjemplo() : null;

  return (
    <TourProvider enabled={IS_DEMO} pacienteEjemploId={ejemploId}>
      <div className="flex min-h-full flex-col">
        {IS_DEMO && (
          <div className="no-print bg-primary px-6 py-1.5 text-center text-xs font-medium text-primary-foreground">
            Modo demo · datos ficticios · se reinicia periódicamente
          </div>
        )}

        <MobileNav email={email} />

        <div className="flex flex-1">
          <DesktopSidebar email={email} />
          <main className="min-w-0 flex-1">
            <div className="mx-auto max-w-6xl p-4 md:p-8">{children}</div>
          </main>
        </div>
      </div>
    </TourProvider>
  );
}
