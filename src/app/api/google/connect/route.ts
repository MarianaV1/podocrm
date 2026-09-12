import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOAuthClient, GOOGLE_SCOPES } from "@/lib/google";

// Inicia el flujo OAuth: redirige a la pantalla de permiso de Google.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const oauth = getOAuthClient();
  const url = oauth.generateAuthUrl({
    access_type: "offline", // para obtener refresh token
    prompt: "consent",
    scope: GOOGLE_SCOPES,
  });

  return NextResponse.redirect(url);
}
