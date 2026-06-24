"use client";

import { useEffect, useState } from "react";
import { LogoBadge } from "@/design/ui";
import { translate } from "@/design/i18n";
import type { Lang } from "@/design/strings";

/**
 * Ecrã de arranque / loading. Logótipo com anel a girar + vapor + legenda.
 * Usado como fallback de carregamento (loading.tsx) ao entrar na app/admin.
 * Se receber `onDone`, auto-avança ao fim de `duration` (modo splash standalone);
 * sem `onDone`, anima em loop até o Next trocar pelo conteúdo pronto.
 */
export function Splash({
  lang = "pt",
  onDone,
  duration = 2300,
}: {
  lang?: Lang;
  onDone?: () => void;
  duration?: number;
}) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!onDone) return;
    const t1 = setTimeout(() => setLeaving(true), duration - 380);
    const t2 = setTimeout(() => onDone(), duration);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone, duration]);

  const dots = ["var(--c-primary)", "var(--c-red)", "var(--c-green)"];

  return (
    <div
      className="om-splash"
      style={{
        flex: 1,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        padding: "0 36px",
        background: "radial-gradient(120% 80% at 50% 22%, color-mix(in srgb, var(--c-primary) 24%, var(--c-bg)), var(--c-bg) 72%)",
        opacity: leaving ? 0 : 1,
        transform: leaving ? "scale(1.04)" : "scale(1)",
        transition: "opacity .38s ease, transform .38s ease",
      }}
    >
      <div style={{ position: "absolute", top: -60, right: -50, width: 200, height: 200, borderRadius: "50%", background: "color-mix(in srgb, var(--c-primary) 14%, transparent)" }} />
      <div style={{ position: "absolute", bottom: 40, left: -60, width: 180, height: 180, borderRadius: "50%", background: "color-mix(in srgb, var(--c-green) 12%, transparent)" }} />

      <div style={{ position: "relative", width: 196, height: 196, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", top: -6, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 13, zIndex: 0 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 7,
                height: 40,
                borderRadius: 100,
                background: "linear-gradient(to top, transparent, color-mix(in srgb, var(--c-primaryInk) 26%, transparent))",
                animation: `splashSteam 2.6s ease-in-out ${i * 0.4}s infinite`,
              }}
            />
          ))}
        </div>

        <svg width="196" height="196" viewBox="0 0 196 196" style={{ position: "absolute", inset: 0, animation: "splashSpin 1.6s linear infinite" }}>
          <defs>
            <linearGradient id="splashRingGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--c-primary)" />
              <stop offset="100%" stopColor="var(--c-red)" />
            </linearGradient>
          </defs>
          <circle cx="98" cy="98" r="90" fill="none" stroke="color-mix(in srgb, var(--c-primary) 16%, transparent)" strokeWidth="5" />
          <circle cx="98" cy="98" r="90" fill="none" stroke="url(#splashRingGrad)" strokeWidth="5" strokeLinecap="round" strokeDasharray="150 420" />
        </svg>

        <div style={{ animation: "splashFloat 3s ease-in-out infinite", zIndex: 1 }}>
          <LogoBadge size={134} />
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 30, animation: "fadeIn .6s ease both" }}>
        <div style={{ fontFamily: "var(--f-body)", fontWeight: 800, fontSize: 11.5, letterSpacing: 2, color: "var(--c-primary)" }}>
          {translate(lang, "splash.tag") as string}
        </div>
        <h1 style={{ margin: "8px 0 0", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 32, lineHeight: 1.04, color: "var(--c-ink)", letterSpacing: -0.6 }}>
          Os Amigos<br />do Bairro
        </h1>
      </div>

      <div style={{ position: "absolute", bottom: 64, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", gap: 10 }}>
          {dots.map((c, i) => (
            <div key={i} style={{ width: 11, height: 11, borderRadius: "50%", background: c, animation: `splashDot 1.1s ease-in-out ${i * 0.16}s infinite` }} />
          ))}
        </div>
        <div style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 13.5, color: "var(--c-muted)", letterSpacing: 0.2 }}>
          {translate(lang, "splash.load") as string}
        </div>
      </div>
    </div>
  );
}
