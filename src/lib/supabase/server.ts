import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/** Cliente Supabase para Server Components, Route Handlers e Server Actions. */
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
          // Se o utilizador NÃO escolheu "manter sessão", os cookies de auth
          // ficam de sessão (sem maxAge/expires) → terminam ao fechar o browser.
          const persist = cookieStore.get("ab_remember")?.value !== "0";
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const opts = persist ? options : { ...options, maxAge: undefined, expires: undefined };
              cookieStore.set(name, value, opts);
            });
          } catch {
            // Chamado de um Server Component — ignorável quando há middleware
            // a refrescar a sessão.
          }
        },
      },
    },
  );
}

/**
 * Cliente com service role — APENAS server-side, ignora RLS.
 * Usar só onde estritamente necessário (operações administrativas controladas).
 */
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
