"use client";

import { useState, type ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  Calendar,
  Stethoscope,
  Package,
  UserRound,
  Wallet,
  FileText,
  Footprints,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { TourBoton } from "@/components/tour/tour-boton";
import { cn } from "@/lib/cn";

type Item = { href: string; label: string; icon: ComponentType<{ size?: number }> };
type Group = { title: string; items: Item[] };

const groups: Group[] = [
  {
    title: "Operación",
    items: [
      { href: "/dashboard/pacientes", label: "Pacientes", icon: Users },
      { href: "/dashboard/citas", label: "Citas", icon: Calendar },
    ],
  },
  {
    title: "Catálogo",
    items: [
      { href: "/dashboard/servicios", label: "Servicios", icon: Stethoscope },
      { href: "/dashboard/productos", label: "Productos", icon: Package },
      { href: "/dashboard/podologas", label: "Podólogas", icon: UserRound },
    ],
  },
  {
    title: "Finanzas",
    items: [
      { href: "/dashboard/caja", label: "Caja", icon: Wallet },
      { href: "/dashboard/reporte-salud", label: "Reporte", icon: FileText },
    ],
  },
];

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 px-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Footprints size={18} />
      </span>
      <span className="font-semibold tracking-tight">CRM Podología</span>
    </Link>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-5">
      {groups.map((g) => (
        <div key={g.title} className="flex flex-col gap-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
            {g.title}
          </p>
          {g.items.map((it) => {
            const activo =
              pathname === it.href || pathname.startsWith(it.href + "/");
            const Icon = it.icon;
            return (
              <Link
                key={it.href}
                href={it.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  activo
                    ? "bg-primary/10 text-primary"
                    : "text-muted hover:bg-surface-2 hover:text-foreground"
                )}
              >
                <Icon size={18} />
                {it.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function Footer({ email }: { email: string }) {
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4">
      <p className="truncate px-2 text-xs text-muted" title={email}>
        {email}
      </p>
      <TourBoton />
      <div className="flex items-center justify-between gap-2">
        <ThemeToggle />
        <form action={logout}>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground">
            <LogOut size={15} />
            Salir
          </button>
        </form>
      </div>
    </div>
  );
}

export function DesktopSidebar({ email }: { email: string }) {
  return (
    <aside className="no-print hidden w-60 shrink-0 border-r border-border bg-surface md:block">
      <div className="sticky top-0 flex h-screen flex-col gap-6 p-4">
        <Brand />
        <div data-tour="nav" className="flex-1 overflow-y-auto">
          <NavList />
        </div>
        <Footer email={email} />
      </div>
    </aside>
  );
}

export function MobileNav({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="no-print sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface px-4 md:hidden">
        <Brand />
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          data-tour="nav"
          className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-foreground"
        >
          <Menu size={20} />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-72 flex-col gap-6 border-r border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <Brand />
              <button
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavList onNavigate={() => setOpen(false)} />
            </div>
            <Footer email={email} />
          </div>
        </div>
      )}
    </>
  );
}
