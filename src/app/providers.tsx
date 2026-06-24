"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LangProvider } from "@/design/i18n";
import { createClient } from "@/lib/supabase/client";

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Recuperação de password: o link de email pode cair na raiz (consoante o
  // template/URLs configurados no Supabase). Apanhamos o evento em qualquer
  // página e encaminhamos para o ecrã de definir nova password.
  useEffect(() => {
    const supabase = createClient();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" && pathname !== "/recuperar") {
        router.replace("/recuperar?reset=1");
      }
    });
    return () => data.subscription.unsubscribe();
  }, [router, pathname]);

  // Regista o service worker (Web Push + base PWA).
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return <LangProvider>{children}</LangProvider>;
}
