import { redirect } from "next/navigation";
import { Footprints } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { IS_DEMO } from "@/lib/demo";
import { entrarDemo } from "@/app/actions/auth";
import { buttonClasses } from "@/components/ui/button";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const { demo } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Footprints size={24} />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">
            CRM Podología
          </h1>
          <p className="mt-1 text-sm text-muted">Inicia sesión para continuar</p>
        </div>

        {IS_DEMO && (
          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm text-foreground">
              👋 Esta es una <strong>demo</strong> con datos ficticios. Entra con
              un clic, sin registrarte.
            </p>
            <form action={entrarDemo}>
              <button className={buttonClasses("primary", "md", "w-full")}>
                Entrar a la demo →
              </button>
            </form>
            {demo === "error" && (
              <p className="text-xs text-red-600 dark:text-red-400">
                No se pudo entrar a la demo. Revisa las credenciales del
                invitado.
              </p>
            )}
            <p className="text-center text-xs text-muted">
              o inicia sesión manualmente
            </p>
          </div>
        )}

        <div className="rounded-xl border border-border bg-surface p-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
