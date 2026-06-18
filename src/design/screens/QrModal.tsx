"use client";

import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/design/i18n";
import { Button, LogoBadge } from "@/design/ui";

const TTL = 90;

export function QrModal({ onClose }: { onClose: () => void }) {
  const { T } = useI18n();
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(TTL);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("criar_nonce_earn");
    if (error || !data) {
      setError("Não foi possível gerar o código.");
      return;
    }
    try {
      const url = await QRCode.toDataURL(String(data), {
        margin: 1,
        width: 320,
        color: { dark: "#2c2620", light: "#ffffff" },
      });
      setDataUrl(url);
      setSeconds(TTL);
    } catch {
      setError("Erro a desenhar o código.");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!dataUrl) return;
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          refresh();
          return TTL;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [dataUrl, refresh]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "rgba(20,14,6,0.45)",
        backdropFilter: "blur(4px)",
        animation: "fadeIn .2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          background: "var(--c-surface)",
          borderRadius: 26,
          padding: 24,
          textAlign: "center",
          animation: "popIn .25s ease",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center" }}>
          <LogoBadge size={56} />
        </div>
        <h3 style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 19, color: "var(--c-ink)", margin: "12px 0 2px" }}>
          {T("qr.title") as string}
        </h3>
        <p style={{ fontFamily: "var(--f-body)", fontSize: 13, color: "var(--c-muted)", margin: "0 0 16px" }}>
          {T("qr.sub") as string}
        </p>
        <div style={{ display: "inline-block", padding: 16, borderRadius: 20, background: "var(--c-surface2)", border: "1px solid var(--c-line)" }}>
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dataUrl} alt="QR" width={168} height={168} style={{ display: "block" }} />
          ) : (
            <div style={{ width: 168, height: 168 }} />
          )}
        </div>
        <div style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 13, color: "var(--c-muted)", marginTop: 14, letterSpacing: 1 }}>
          {error ? error : `Expira em ${seconds}s`}
        </div>
        <div style={{ marginTop: 16 }}>
          <Button full size="lg" onClick={onClose}>
            {T("common.close") as string}
          </Button>
        </div>
      </div>
    </div>
  );
}
