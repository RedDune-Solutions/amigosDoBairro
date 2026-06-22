import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresca a sessão Supabase em cada pedido e protege rotas privadas.
 * Baseado no padrão oficial @supabase/ssr para Next.js.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANTE: não inserir lógica entre createServerClient e getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPrivate =
    path.startsWith("/app") ||
    path.startsWith("/perfil") ||
    path.startsWith("/recompensas") ||
    path.startsWith("/reservar") ||
    path.startsWith("/staff") ||
    path.startsWith("/admin");

  if (!user && isPrivate) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // Manter logado: quem já tem sessão não volta a ver a landing/login —
  // é encaminhado direto para a app (staff/admin → painel).
  const isEntry = path === "/" || path === "/entrar" || path === "/registo";
  if (user && isEntry) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const role = (profile?.role as string) ?? "customer";
    const url = request.nextUrl.clone();
    url.search = "";
    url.pathname = role === "admin" || role === "staff" ? "/admin" : "/app";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
