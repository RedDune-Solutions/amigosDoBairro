"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/design/icons";
import { useI18n, LangToggle } from "@/design/i18n";
import { Scroll, Button, Field, LogoBadge } from "@/design/ui";
import { authenticate, type AuthState } from "@/lib/auth-actions";

const initial: AuthState = {};

export function AuthScreen({
  initialMode = "login",
  next,
}: {
  initialMode?: "login" | "register";
  next?: string;
}) {
  const router = useRouter();
  const { T, lang, setLang } = useI18n();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const isReg = mode === "register";
  const [state, formAction, pending] = useActionState(authenticate, initial);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div
        style={{
          padding: "8px 24px 22px",
          textAlign: "center",
          background:
            "linear-gradient(165deg, color-mix(in srgb, var(--c-primary) 20%, var(--c-bg)), var(--c-bg))",
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={() => router.push("/")}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              border: "1px solid var(--c-line)",
              background: "var(--c-surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--c-ink)",
            }}
          >
            <Icon name="chevronLeft" size={19} />
          </button>
          <LangToggle value={lang} onChange={setLang} flags />
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 2 }}>
          <LogoBadge size={88} />
        </div>
        <h1 style={{ margin: "14px 0 2px", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 26, color: "var(--c-ink)" }}>
          {(isReg ? T("auth.regTitle") : T("auth.loginTitle")) as string}
        </h1>
        <p style={{ margin: 0, fontFamily: "var(--f-body)", fontSize: 14, color: "var(--c-muted)" }}>
          {(isReg ? T("auth.regSub") : T("auth.loginSub")) as string}
        </p>
      </div>

      <Scroll style={{ paddingTop: 18 }}>
        {state.sent && isReg ? (
          <div style={{ textAlign: "center", padding: "18px 8px", animation: "popIn .25s ease" }}>
            <div style={{ width: 72, height: 72, borderRadius: 22, margin: "8px auto 16px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--c-primary)", background: "color-mix(in srgb, var(--c-primary) 14%, var(--c-surface))" }}>
              <Icon name="mail" size={34} stroke={2} />
            </div>
            <h2 style={{ margin: "0 0 8px", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 21, color: "var(--c-ink)" }}>
              {T("auth.checkEmailTitle") as string}
            </h2>
            <p style={{ margin: "0 auto 22px", maxWidth: 320, fontFamily: "var(--f-body)", fontSize: 14, lineHeight: 1.6, color: "var(--c-muted)" }}>
              {T("auth.checkEmailSub") as string}
            </p>
            <Button full size="lg" icon="arrowRight" onClick={() => setMode("login")}>
              {T("auth.backToLogin") as string}
            </Button>
          </div>
        ) : (
        <>
        {/* Toggle login / registo */}
        <div style={{ display: "flex", gap: 6, padding: 5, background: "var(--c-surface2)", borderRadius: 16, border: "1px solid var(--c-line)" }}>
          {([["login", T("auth.tabLogin") as string], ["register", T("auth.tabReg") as string]] as const).map(([m, l]) => (
            <button
              key={m}
              onClick={() => setMode(m as "login" | "register")}
              style={{
                flex: 1,
                padding: "11px 0",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--f-display)",
                fontWeight: 700,
                fontSize: 15,
                background: mode === m ? "var(--c-surface)" : "transparent",
                color: mode === m ? "var(--c-primary)" : "var(--c-muted)",
                boxShadow: mode === m ? "0 2px 8px rgba(40,30,10,0.08)" : "none",
              }}
            >
              {l}
            </button>
          ))}
        </div>

        <form action={formAction}>
          <input type="hidden" name="mode" value={mode} />
          {next ? <input type="hidden" name="next" value={next} /> : null}
          <div style={{ display: "flex", flexDirection: "column", gap: 13, marginTop: 18 }}>
            {isReg && (
              <Field label={T("auth.name") as string} placeholder={T("auth.namePh") as string} icon="user" name="nome" required autoComplete="name" />
            )}
            <Field label={T("auth.email") as string} placeholder="email@exemplo.pt" icon="mail" name="email" type="email" required autoComplete="email" />
            <Field label={T("auth.pass") as string} placeholder="••••••••" icon="lock" name="password" type="password" required autoComplete={isReg ? "new-password" : "current-password"} />
            {isReg && (
              <Field label={T("auth.phone") as string} placeholder="+351 ..." icon="phone" name="telefone" type="tel" autoComplete="tel" />
            )}
          </div>

          {!isReg && (
            <div style={{ textAlign: "right", marginTop: 10 }}>
              <button
                type="button"
                onClick={() => router.push("/recuperar")}
                style={{ border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 13, color: "var(--c-primary)" }}
              >
                {T("auth.forgot") as string}
              </button>
            </div>
          )}

          {state.error && (
            <p role="alert" style={{ marginTop: 12, fontFamily: "var(--f-body)", fontSize: 13.5, fontWeight: 700, color: "var(--c-red)" }}>
              {state.error}
            </p>
          )}

          <div style={{ marginTop: 18 }}>
            <Button full size="lg" type="submit" icon={isReg ? "sparkle" : "arrowRight"} loading={pending}>
              {pending
                ? ((isReg ? T("auth.regLoading") : T("auth.loginLoading")) as string)
                : ((isReg ? T("auth.regBtn") : T("auth.loginBtn")) as string)}
            </Button>
          </div>
        </form>

        {isReg && (
          <p style={{ fontFamily: "var(--f-body)", fontSize: 12, color: "var(--c-muted)", textAlign: "center", marginTop: 16, marginBottom: 4, lineHeight: 1.5 }}>
            {T("auth.terms") as string}
          </p>
        )}
        </>
        )}
      </Scroll>
    </div>
  );
}
