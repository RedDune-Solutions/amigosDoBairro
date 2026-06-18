"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { creditarNonce, type CreditState } from "@/lib/staff-actions";
import { QrCode } from "@/components/icons";

const initial: CreditState = {};
const READER_ID = "qr-reader";

export function StaffScanner() {
  const [nonce, setNonce] = useState("");
  const [scanning, setScanning] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);
  const [state, action, pending] = useActionState(creditarNonce, initial);

  async function startCamera() {
    setCamError(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(READER_ID);
      scannerRef.current = scanner as unknown as {
        stop: () => Promise<void>;
        clear: () => void;
      };
      setScanning(true);
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 220 },
        (decoded: string) => {
          setNonce(decoded.trim());
          stopCamera();
        },
        () => {},
      );
    } catch {
      setCamError("Câmara indisponível. Usa a entrada manual.");
      setScanning(false);
    }
  }

  async function stopCamera() {
    const s = scannerRef.current;
    if (s) {
      try {
        await s.stop();
        s.clear();
      } catch {
        /* noop */
      }
      scannerRef.current = null;
    }
    setScanning(false);
  }

  useEffect(() => {
    return () => {
      void stopCamera();
    };
  }, []);

  // limpa o campo após crédito com sucesso (reage ao resultado da server action)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state.pontos) setNonce("");
  }, [state.pontos]);

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white/70 p-5 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-coffee">
        Creditar pontos
      </h2>

      <div
        id={READER_ID}
        className={`overflow-hidden rounded-2xl ${scanning ? "block" : "hidden"}`}
      />

      {!scanning && (
        <button
          onClick={startCamera}
          className="flex items-center justify-center gap-2 rounded-xl bg-coffee px-4 py-2.5 text-sm font-semibold text-cream-soft"
        >
          <QrCode className="h-5 w-5" /> Ler QR do cliente
        </button>
      )}
      {scanning && (
        <button
          onClick={stopCamera}
          className="rounded-xl border border-coffee/15 px-4 py-2 text-sm font-semibold text-coffee-soft"
        >
          Parar câmara
        </button>
      )}
      {camError && <p className="text-sm text-brick">{camError}</p>}

      <form action={action} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-coffee">Código (QR)</span>
          <input
            name="nonce"
            value={nonce}
            onChange={(e) => setNonce(e.target.value)}
            placeholder="Lido do QR ou inserido à mão"
            required
            className="rounded-xl border border-coffee/10 bg-white px-3 py-2.5 font-mono text-sm text-coffee outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-coffee">Pontos a creditar</span>
          <input
            name="pontos"
            type="number"
            min={1}
            max={100}
            defaultValue={1}
            required
            className="rounded-xl border border-coffee/10 bg-white px-3 py-2.5 text-coffee outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
          />
        </label>

        {state.error && <p className="text-sm font-medium text-brick">{state.error}</p>}
        {state.pontos && (
          <p className="rounded-xl bg-leaf/15 px-3 py-2 text-sm font-medium text-leaf">
            +{state.pontos} pontos creditados ao cliente.
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-gradient-to-r from-orange to-orange-deep px-4 py-3 text-sm font-semibold text-white shadow transition active:scale-[0.99] disabled:opacity-60"
        >
          {pending ? "A creditar…" : "Creditar pontos"}
        </button>
      </form>
    </div>
  );
}
