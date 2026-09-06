import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente de Supabase para usar en el SERVIDOR (Server Components,
 * Server Actions, Route Handlers). Lee/escribe la sesión en cookies.
 * En Next 16 `cookies()` es asíncrono, por eso hay que await.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Llamado desde un Server Component: se puede ignorar
            // porque el proxy ya refresca la sesión.
          }
        },
      },
    }
  );
}
