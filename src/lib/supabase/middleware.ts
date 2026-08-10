import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresca a sessão Supabase em cada pedido e protege rotas privadas.
 * Baseado no padrão oficial @supabase/ssr para Next.js.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Sem env do Supabase → não rebentar o site inteiro (o middleware corre em
  // todas as rotas, incl. a landing estática). Segue sem refrescar sessão.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const path = request.nextUrl.pathname;
  const isPrivate =
    path.startsWith("/app") ||
    path.startsWith("/perfil") ||
    path.startsWith("/recompensas") ||
    path.startsWith("/reservar") ||
    path.startsWith("/staff") ||
    path.startsWith("/admin");

  // Visitante sem cookie de auth do Supabase: não há sessão para refrescar,
  // e getUser() devolveria null de qualquer forma. Saltar o round-trip ao
  // Supabase poupa centenas de ms de TTFB em todas as visitas anónimas
  // (landing incluída). O resultado é idêntico ao caminho normal com
  // user === null: rota privada → login; rota pública → segue.
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));
  if (!hasAuthCookie) {
    if (isPrivate) {
      const url = request.nextUrl.clone();
      url.pathname = "/entrar";
      url.search = `?next=${encodeURIComponent(path)}`;
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Persistente só com login normal + "manter sessão" (ab_remember==="1").
          // Recuperação de password / confirmação de email → cookies de sessão.
          const persist = request.cookies.get("ab_remember")?.value === "1";
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            const opts = persist ? options : { ...options, maxAge: undefined, expires: undefined };
            supabaseResponse.cookies.set(name, value, opts);
          });
        },
      },
    },
  );

  // IMPORTANTE: não inserir lógica entre createServerClient e getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redireciona PRESERVANDO os cookies de sessão refrescados (rotação de refresh
  // token). Sem isto, um redirect deita fora o cookie novo e a sessão quebra —
  // o utilizador era obrigado a fazer login a cada arranque.
  const redirectTo = (pathname: string, search = "") => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = search;
    const res = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  if (!user && isPrivate) {
    return redirectTo("/entrar", `?next=${encodeURIComponent(path)}`);
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
    return redirectTo(role === "admin" || role === "staff" ? "/admin" : "/app");
  }

  return supabaseResponse;
}
