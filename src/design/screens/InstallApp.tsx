"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/design/icons";
import { useI18n } from "@/design/i18n";
import { Card, IconTile } from "@/design/ui";

// Evento não-padrão do Chrome/Android. Guardado para disparar o prompt mais tarde.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Mode = "hidden" | "installed" | "prompt" | "ios" | "generic";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const iOSDevice = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ finge ser Mac; detetar por touch.
  const iPadOS = navigator.platform === "MacIntel" && (navigator.maxTouchPoints ?? 0) > 1;
  return iOSDevice || iPadOS;
}

export function InstallApp() {
  const { T } = useI18n();
  const [mode, setMode] = useState<Mode>("hidden");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // A deteção (standalone/iOS) só é possível no cliente (window/navigator); a
    // 1ª render tem de coincidir com o SSR ("hidden"), daí atualizar no efeito.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (isStandalone()) {
      setMode("installed");
      return;
    }
    if (isIOS()) {
      setMode("ios");
      return;
    }
    // Android/Chrome: o browser dispara este evento quando a app é instalável.
    // Guardamos para o reutilizar a partir do botão (o mini-banner só aparece uma vez).
    setMode("generic");
    /* eslint-enable react-hooks/set-state-in-effect */
    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setMode("prompt");
    };
    const onInstalled = () => setMode("installed");
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") setMode("installed");
    setDeferred(null);
  }

  if (mode === "hidden") return null;

  if (mode === "installed") {
    return (
      <Card style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 13, padding: "14px 16px" }}>
        <IconTile icon="check" accent="var(--c-green)" size={40} iconSize={19} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 15, color: "var(--c-ink)" }}>{T("install.title") as string}</div>
          <div style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-green)", fontWeight: 700 }}>{T("install.installed") as string}</div>
        </div>
      </Card>
    );
  }

  if (mode === "ios") {
    const s1 = T("install.iosStep1") as string[];
    const s2 = T("install.iosStep2") as string[];
    return (
      <Card style={{ marginTop: 16, padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <IconTile icon="sparkle" accent="var(--c-primary)" size={40} iconSize={19} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 15, color: "var(--c-ink)" }}>{T("install.title") as string}</div>
            <div style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-muted)", lineHeight: 1.4 }}>{T("install.desc") as string}</div>
          </div>
        </div>
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          <IosStep n={1} parts={s1} />
          <IosStep n={2} parts={s2} />
        </div>
      </Card>
    );
  }

  // mode === "prompt" || "generic"
  return (
    <Card style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 13, padding: "14px 16px" }}>
      <IconTile icon="sparkle" accent="var(--c-primary)" size={40} iconSize={19} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 15, color: "var(--c-ink)" }}>{T("install.title") as string}</div>
        <div style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-muted)", lineHeight: 1.4 }}>
          {mode === "prompt" ? (T("install.desc") as string) : (T("install.androidHint") as string)}
        </div>
      </div>
      {mode === "prompt" && (
        <button
          onClick={install}
          style={{
            flexShrink: 0,
            border: "none",
            cursor: "pointer",
            borderRadius: 11,
            padding: "9px 14px",
            fontFamily: "var(--f-display)",
            fontWeight: 800,
            fontSize: 13,
            background: "var(--c-primary)",
            color: "#fff",
          }}
        >
          {T("install.btn") as string}
        </button>
      )}
    </Card>
  );
}

function IosStep({ n, parts }: { n: number; parts: string[] }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ width: 22, height: 22, flexShrink: 0, borderRadius: "50%", background: "color-mix(in srgb, var(--c-primary) 16%, var(--c-surface))", color: "var(--c-primary)", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>{n}</span>
      <span style={{ fontFamily: "var(--f-body)", fontSize: 13, color: "var(--c-ink)", lineHeight: 1.4 }}>
        {parts[0]}
        <strong>{parts[1]}</strong>
        {parts[2]}
        {n === 1 && <Icon name="share" size={14} color="var(--c-primary)" style={{ verticalAlign: "middle", marginLeft: 4 }} />}
      </span>
    </div>
  );
}
