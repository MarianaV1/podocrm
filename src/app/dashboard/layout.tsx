import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";
import { IS_DEMO } from "@/lib/demo";

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

  return (
    <div className="flex min-h-full flex-col">
      {IS_DEMO && (
        <div className="no-print bg-blue-600 px-6 py-1.5 text-center text-xs font-medium text-white">
          Modo demo · datos ficticios · se reinicia periódicamente
        </div>
      )}
      <header className="no-print flex items-center justify-between border-b border-black/10 px-6 py-3 dark:border-white/10">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-semibold">
            CRM Podología
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/dashboard/pacientes"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Pacientes
            </Link>
            <Link
              href="/dashboard/citas"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Citas
            </Link>
            <Link
              href="/dashboard/podologas"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Podólogas
            </Link>
            <Link
              href="/dashboard/servicios"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Servicios
            </Link>
            <Link
              href="/dashboard/productos"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Productos
            </Link>
            <Link
              href="/dashboard/caja"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Caja
            </Link>
            <Link
              href="/dashboard/reporte-salud"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Reporte
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-zinc-500">{user.email}</span>
          <form action={logout}>
            <button className="rounded-md border border-black/10 px-3 py-1.5 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10">
              Salir
            </button>
          </form>
        </div>
      </header>
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
