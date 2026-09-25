"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient as crearClienteAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { IS_DEMO, DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo";

// Nota: en un archivo "use server" solo se pueden exportar funciones async,
// por eso el tipo del estado se define en el formulario, no aquí.
export async function login(
  _prevState: { error: string } | undefined,
  formData: FormData
): Promise<{ error: string } | undefined> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Ingresa tu correo y contraseña." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Correo o contraseña incorrectos." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

// Login del usuario invitado (solo en modo demo). Sin formulario: un clic entra.
export async function entrarDemo() {
  if (!IS_DEMO) redirect("/login");
  if (!DEMO_EMAIL || !DEMO_PASSWORD) redirect("/login?demo=error");

  const supabase = await createClient();
  const credenciales = { email: DEMO_EMAIL, password: DEMO_PASSWORD };
  let { error } = await supabase.auth.signInWithPassword(credenciales);
  // Si alguien le cambió la contraseña al invitado, se restablece y se reintenta.
  if (error && (await restablecerInvitado())) {
    ({ error } = await supabase.auth.signInWithPassword(credenciales));
  }
  if (error) redirect("/login?demo=error");

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

// Devuelve al usuario invitado su correo y contraseña originales. Cualquier
// visitante de la demo tiene una sesión real de Supabase y podría cambiarlos
// para bloquear el botón "Entrar a la demo". Usa la llave secreta (sb_secret_)
// del proyecto de la DEMO (solo servidor); sin ella no hace nada.
async function restablecerInvitado(): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const llave = process.env.SUPABASE_SECRET_KEY;
  if (!IS_DEMO || !url || !llave) return false;

  const admin = crearClienteAdmin(url, llave, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let id = process.env.DEMO_USER_ID;
  if (!id) {
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (error) return false;
    id = data.users.find((u) => u.email === DEMO_EMAIL)?.id;
  }
  if (!id) return false;

  const { error } = await admin.auth.admin.updateUserById(id, {
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
  });
  return !error;
}
