import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { IS_DEMO } from "@/lib/demo";
import { entrarDemo } from "@/app/actions/auth";
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
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            CRM Podología
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Inicia sesión para continuar
          </p>
        </div>

        {IS_DEMO && (
          <div className="mb-6 flex flex-col gap-3 rounded-lg border border-blue-300 bg-blue-50 p-4 dark:border-blue-500/40 dark:bg-blue-500/10">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              👋 Esta es una <strong>demo</strong> con datos ficticios. Entra con
              un clic, sin registrarte.
            </p>
            <form action={entrarDemo}>
              <button className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
                Entrar a la demo →
              </button>
            </form>
            {demo === "error" && (
              <p className="text-xs text-red-600 dark:text-red-400">
                No se pudo entrar a la demo. Revisa las credenciales del
                invitado.
              </p>
            )}
            <p className="text-center text-xs text-zinc-500">
              o inicia sesión manualmente
            </p>
          </div>
        )}

        <LoginForm />
      </div>
    </main>
  );
}
