"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/design/icons";
import { Card, IconTile } from "@/design/ui";
import { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } from "@/lib/push-config";
import { savePushSubscription, removePushSubscription } from "@/lib/push-actions";

type State = "loading" | "unsupported" | "off" | "on" | "denied" | "busy";

export function PushOptIn() {
  const [state, setState] = useState<State>("loading");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        if (alive) setState("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (alive) setState("denied");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (alive) setState(sub ? "on" : "off");
      } catch {
        if (alive) setState("off");
      }
    })();
    return () => { alive = false; };
  }, []);

  async function enable() {
    setMsg(null);
    setState("busy");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
      const res = await savePushSubscription(sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } });
      if (res.error) {
        setMsg(res.error);
        setState("off");
        return;
      }
      setState("on");
    } catch {
      setMsg("Não foi possível ativar neste dispositivo.");
      setState("off");
    }
  }

  async function disable() {
    setState("busy");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
    } catch {
      /* noop */
    }
    setState("off");
  }

  if (state === "loading" || state === "unsupported") return null;

  const on = state === "on";
  const busy = state === "busy";

  return (
    <Card style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 13, padding: "14px 16px" }}>
      <IconTile icon="bell" accent="var(--c-primary)" size={40} iconSize={19} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 15, color: "var(--c-ink)" }}>Notificações no telemóvel</div>
        <div style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-muted)", lineHeight: 1.4 }}>
          {state === "denied"
            ? "Bloqueadas no browser. Ativa nas definições do site."
            : on
              ? "Ativas — recebes novidades e ofertas."
              : "Recebe novidades e ofertas do café."}
        </div>
        {msg && <div style={{ fontFamily: "var(--f-body)", fontSize: 12, fontWeight: 700, color: "var(--c-red)", marginTop: 3 }}>{msg}</div>}
      </div>
      {state !== "denied" && (
        <button
          onClick={on ? disable : enable}
          disabled={busy}
          style={{
            flexShrink: 0,
            border: "none",
            cursor: busy ? "default" : "pointer",
            borderRadius: 11,
            padding: "9px 14px",
            fontFamily: "var(--f-display)",
            fontWeight: 800,
            fontSize: 13,
            background: on ? "var(--c-surface2)" : "var(--c-primary)",
            color: on ? "var(--c-muted)" : "#fff",
          }}
        >
          {busy ? "…" : on ? "Desligar" : "Ativar"}
        </button>
      )}
    </Card>
  );
}
