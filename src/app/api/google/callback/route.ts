import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getOAuthClient } from "@/lib/google";

// Google regresa aquí con un `code`; lo canjeamos por tokens y los guardamos.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(
      new URL("/dashboard/citas?error=sin_codigo", request.url)
    );
  }

  try {
    const oauth = getOAuthClient();
    const { tokens } = await oauth.getToken(code);

    const data = {
      accessToken: tokens.access_token ?? "",
      refreshToken: tokens.refresh_token ?? null,
      expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    };

    await prisma.googleConexion.upsert({
      where: { userId: user.id },
      update: data,
      create: { userId: user.id, ...data },
    });

    return NextResponse.redirect(new URL("/dashboard/citas", request.url));
  } catch {
    return NextResponse.redirect(
      new URL("/dashboard/citas?error=oauth", request.url)
    );
  }
}
