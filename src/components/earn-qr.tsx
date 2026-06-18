"use client";

import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/client";
import { QrCode } from "@/components/icons";

const TTL = 90;

export function EarnQr() {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(TTL);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("criar_nonce_earn");
    if (error || !data) {
      setError("Não foi possível gerar o código. Tenta novamente.");
      setLoading(false);
      return;
    }
    try {
      const url = await QRCode.toDataURL(String(data), {
        margin: 1,
        width: 320,
        color: { dark: "#3b2a1d", light: "#ffffff" },
      });
      setDataUrl(url);
      setSeconds(TTL);
    } catch {
      setError("Erro a desenhar o código.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Busca inicial do nonce (sincroniza com sistema externo: Supabase).
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
    <div className="flex flex-col items-center">
      <div className="flex h-64 w-64 items-center justify-center rounded-3xl bg-white p-4 shadow-inner">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt="Código QR para acumular pontos" className="h-full w-full" />
        ) : (
          <QrCode className="h-16 w-16 text-coffee/30" />
        )}
      </div>

      {error ? (
        <p className="mt-3 text-sm font-medium text-brick">{error}</p>
      ) : (
        <p className="mt-3 text-sm text-coffee-soft">
          Mostra este código ao balcão.{" "}
          <span className="font-semibold text-coffee">
            Expira em {seconds}s
          </span>
        </p>
      )}

      <button
        onClick={refresh}
        disabled={loading}
        className="mt-2 rounded-full px-4 py-1.5 text-sm font-semibold text-orange-deep disabled:opacity-50"
      >
        Gerar novo código
      </button>
    </div>
  );
}
