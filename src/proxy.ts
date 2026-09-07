import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy-session";

// En Next.js 16 el "Middleware" se llama Proxy. Este archivo debe estar
// en src/ junto a app/. Refresca la sesión de Supabase en cada request.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Corre en todas las rutas excepto:
     * - _next/static y _next/image (assets internos de Next)
     * - favicon.ico e imágenes estáticas
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
