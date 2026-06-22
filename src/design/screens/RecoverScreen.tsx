"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/design/icons";
import { useI18n } from "@/design/i18n";
import { Scroll, Button, Field, LogoBadge } from "@/design/ui";
import { createClient } from "@/lib/supabase/client";
import { requestPasswordReset, updatePassword, type AuthState } from "@/lib/auth-actions";

const initial: AuthState = {};

export function RecoverScreen() {
  const router = useRouter();
  const { T } = useI18n();
  const [mode, setMode] = useState<"request" | "reset">("request");
  const [origin, setOrigin] = useState("");
  const [linkError, setLinkError] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
    const params = new URLSearchParams(window.location.search);
    // fluxo novo: /auth/confirm verifica o token no servidor e redireciona p/ ?reset=1
    if (params.get("reset") === "1") setMode("reset");
    if (params.get("error")) setLinkError(true);
    const supabase = createClient();
    // fallback p/ o fluxo antigo por hash (#...type=recovery)
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("reset");
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const [reqState, reqAction, reqPending] = useActionState(requestPasswordReset, initial as AuthState & { sent?: boolean });
  const [setState, setAction, setPending] = useActionState(updatePassword, initial as AuthState & { ok?: boolean });

  useEffect(() => {
    if ((setState as { ok?: boolean }).ok) {
      const t = setTimeout(() => router.push("/app"), 900);
      return () => clearTimeout(t);
    }
  }, [setState, router]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div
        style={{
          padding: "8px 24px 22px",
          textAlign: "center",
          background: "linear-gradient(165deg, color-mix(in srgb, var(--c-primary) 20%, var(--c-bg)), var(--c-bg))",
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
        }}
      >
        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <button onClick={() => router.push("/entrar")} style={{ width: 38, height: 38, borderRadius: 12, border: "1px solid var(--c-line)", background: "var(--c-surface)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--c-ink)" }}>
            <Icon name="chevronLeft" size={19} />
          </button>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 2 }}>
          <LogoBadge size={88} />
        </div>
        <h1 style={{ margin: "14px 0 2px", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 24, color: "var(--c-ink)" }}>
          {mode === "reset" ? "Nova palavra-passe" : "Recuperar acesso"}
        </h1>
        <p style={{ margin: 0, fontFamily: "var(--f-body)", fontSize: 14, color: "var(--c-muted)" }}>
          {mode === "reset" ? "Define a tua nova palavra-passe." : "Enviamos-te um link para repor a palavra-passe."}
        </p>
      </div>

      <Scroll style={{ paddingTop: 18 }}>
        {mode === "reset" ? (
          <form action={setAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Nova palavra-passe" placeholder="••••••••" icon="lock" name="password" type="password" required autoComplete="new-password" />
            {(setState as { error?: string }).error && (
              <p style={{ fontFamily: "var(--f-body)", fontSize: 13.5, fontWeight: 700, color: "var(--c-red)" }}>{(setState as { error?: string }).error}</p>
            )}
            {(setState as { ok?: boolean }).ok && (
              <p style={{ fontFamily: "var(--f-body)", fontSize: 13.5, fontWeight: 700, color: "var(--c-green)" }}>Palavra-passe atualizada ✓</p>
            )}
            <Button full size="lg" type="submit" icon="check" disabled={setPending}>
              {setPending ? "…" : "Guardar"}
            </Button>
          </form>
        ) : (
          <form action={reqAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <input type="hidden" name="origin" value={origin} />
            {linkError && (
              <p style={{ margin: 0, fontFamily: "var(--f-body)", fontSize: 13.5, fontWeight: 700, color: "var(--c-red)" }}>
                O link expirou ou já foi usado. Pede um novo aqui.
              </p>
            )}
            <Field label={T("auth.email") as string} placeholder="email@exemplo.pt" icon="mail" name="email" type="email" required autoComplete="email" />
            {(reqState as { error?: string }).error && (
              <p style={{ fontFamily: "var(--f-body)", fontSize: 13.5, fontWeight: 700, color: "var(--c-red)" }}>{(reqState as { error?: string }).error}</p>
            )}
            {(reqState as { sent?: boolean }).sent && (
              <p style={{ fontFamily: "var(--f-body)", fontSize: 13.5, fontWeight: 700, color: "var(--c-green)" }}>
                Se o email existir, enviámos um link para repor a palavra-passe.
              </p>
            )}
            <Button full size="lg" type="submit" icon="mail" disabled={reqPending}>
              {reqPending ? "…" : "Enviar link"}
            </Button>
          </form>
        )}
      </Scroll>
    </div>
  );
}
