"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/design/i18n";
import { Card, IconTile, Spinner } from "@/design/ui";
import { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } from "@/lib/push-config";
import { savePushSubscription, removePushSubscription, pushBoasVindas } from "@/lib/push-actions";

type State = "loading" | "unsupported" | "off" | "on" | "denied" | "busy";
type PushSubJSON = { endpoint: string; keys: { p256dh: string; auth: string } };

/**
 * Subscreve no PushManager. Se já existir uma subscrição com OUTRA chave VAPID
 * (de um deploy anterior), o subscribe rebenta com "different applicationServerKey"
 * → cancela a antiga e tenta de novo. Sem isto o botão ficava preso em "Ativar".
 */
async function subscribePush(reg: ServiceWorkerRegistration): Promise<PushSubscription> {
  const opts: PushSubscriptionOptionsInit = {
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
  };
  try {
    return await reg.pushManager.subscribe(opts);
  } catch (e) {
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      await existing.unsubscribe();
      return await reg.pushManager.subscribe(opts);
    }
    throw e;
  }
}

export function PushOptIn() {
  const { T, lang } = useI18n();
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
        if (!alive) return;
        if (sub) {
          // O browser tem subscrição mas a BD pode tê-la perdido → re-guardar
          // (idempotente). "on" só se o servidor confirmar que tem o registo —
          // senão não receberia push (ex.: sessão expirada) → mostrar "off".
          const res = await savePushSubscription(sub.toJSON() as PushSubJSON);
          if (!alive) return;
          setState(res.error ? "off" : "on");
        } else {
          setState("off");
        }
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
      const sub = await subscribePush(reg);
      const res = await savePushSubscription(sub.toJSON() as PushSubJSON);
      if (res.error) {
        setMsg(res.error);
        setState("off");
        return;
      }
      setState("on");
      void pushBoasVindas(lang); // push imediato a confirmar que ligou
    } catch (e) {
      console.error("[push] ativar falhou:", e);
      setMsg(T("push.err") as string);
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
        <div style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 15, color: "var(--c-ink)" }}>{T("push.title") as string}</div>
        <div style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-muted)", lineHeight: 1.4 }}>
          {state === "denied"
            ? (T("push.descDenied") as string)
            : on
              ? (T("push.descOn") as string)
              : (T("push.descOff") as string)}
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
          {busy ? <Spinner size={14} /> : on ? (T("push.disable") as string) : (T("push.enable") as string)}
        </button>
      )}
    </Card>
  );
}
