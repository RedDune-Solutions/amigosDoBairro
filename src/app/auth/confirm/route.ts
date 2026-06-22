import { type NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Confirma links de email (confirmação de conta + recuperação de password) no
 * servidor via token_hash. Padrão oficial Supabase para App Router: robusto a
 * PKCE e ao prefetch de links por clientes de email. Estabelece a sessão nos
 * cookies e redireciona para o sítio certo.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next");

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      const dest =
        type === "recovery"
          ? "/recuperar?reset=1"
          : next && next.startsWith("/") && !next.startsWith("//")
            ? next
            : "/app";
      return NextResponse.redirect(new URL(dest, origin));
    }
  }
  // token inválido/expirado → volta ao ecrã de recuperação com aviso
  return NextResponse.redirect(new URL("/recuperar?error=expired", origin));
}
