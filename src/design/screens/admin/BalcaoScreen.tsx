"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/design/icons";
import { TopBar, Scroll, Card, Button } from "@/design/ui";
import { registarCompra, validarVoucher, estadoCheckin } from "@/lib/balcao-actions";

const READER_ID = "balcao-qr";

export function BalcaoScreen() {
  const [code, setCode] = useState("");
  const [euros, setEuros] = useState("");
  const [checkin, setCheckin] = useState(false);
  const [alreadyToday, setAlreadyToday] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);

  const [codigo, setCodigo] = useState("");
  const [vMsg, setVMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [vBusy, setVBusy] = useState(false);

  async function startCamera() {
    setCamError(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(READER_ID);
      scannerRef.current = scanner as unknown as { stop: () => Promise<void>; clear: () => void };
      setScanning(true);
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 220 },
        (decoded: string) => {
          setCode(decoded.replace(/\D/g, "").slice(0, 6));
          void stopCamera();
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

  // Estado do check-in do código atual (sem o consumir): desativa a checkbox
  // se este cliente já fez check-in hoje.
  useEffect(() => {
    if (!/^[0-9]{4,8}$/.test(code)) {
      setAlreadyToday(false);
      return;
    }
    let alive = true;
    estadoCheckin(code).then((r) => {
      if (!alive) return;
      setAlreadyToday(r.valid && r.already);
      if (r.valid && r.already) setCheckin(false);
    });
    return () => {
      alive = false;
    };
  }, [code]);

  async function submit() {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    const res = await registarCompra(code, Number(euros), checkin);
    setBusy(false);
    if (res.error) {
      setMsg({ ok: false, text: res.error });
      return;
    }
    const ciTxt = res.checkin ? " · check-in +20 ✓" : res.checkinAlready ? " · check-in já feito hoje" : "";
    setMsg({
      ok: true,
      text: `+${res.pontos} pontos${res.carimbo ? " · +1 carimbo" : ""}${res.cartola ? " · cartola completa! 2 raspadinhas 🎉" : ""}${ciTxt}`,
    });
    setCode("");
    setEuros("");
    setCheckin(false);
  }

  async function validate() {
    if (vBusy) return;
    setVBusy(true);
    setVMsg(null);
    const res = await validarVoucher(codigo);
    setVBusy(false);
    setVMsg(res.error ? { ok: false, text: res.error } : { ok: true, text: "Voucher validado ✓" });
    if (!res.error) setCodigo("");
  }

  return (
    <>
      <TopBar title="Balcão" />
      <Scroll>
        <Card style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 16, color: "var(--c-ink)" }}>Registar compra</div>
          <div id={READER_ID} style={{ borderRadius: 16, overflow: "hidden", display: scanning ? "block" : "none" }} />
          {!scanning ? (
            <Button variant="dark" icon="qr" onClick={startCamera}>Ler QR do cliente</Button>
          ) : (
            <Button variant="outline" onClick={stopCamera}>Parar câmara</Button>
          )}
          {camError && <p style={{ color: "var(--c-red)", fontSize: 13, fontFamily: "var(--f-body)" }}>{camError}</p>}

          <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 12.5, color: "var(--c-muted)" }}>Código do cliente</span>
            <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="Lido do QR ou à mão (ex.: 123456)" style={{ ...inputStyle, letterSpacing: 3, fontSize: 18 }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 12.5, color: "var(--c-muted)" }}>Valor gasto (€)</span>
            <input value={euros} onChange={(e) => setEuros(e.target.value)} type="number" min={1} placeholder="15" style={inputStyle} />
          </label>
          <button type="button" onClick={() => !alreadyToday && setCheckin((v) => !v)} disabled={busy || alreadyToday} style={{ display: "flex", alignItems: "center", gap: 10, cursor: busy || alreadyToday ? "default" : "pointer", border: "1px solid var(--c-line)", borderRadius: 12, background: alreadyToday ? "var(--c-surface2)" : "var(--c-surface)", padding: "11px 13px", textAlign: "left", opacity: alreadyToday ? 0.6 : 1 }}>
            <span style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: checkin && !alreadyToday ? "none" : "1.5px solid var(--c-line)", background: checkin && !alreadyToday ? "var(--c-primary)" : "var(--c-surface)", color: "#fff" }}>
              {checkin && !alreadyToday && <Icon name="check" size={14} stroke={3} color="#fff" />}
            </span>
            <span style={{ flex: 1, fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 13.5, color: "var(--c-ink)" }}>
              {alreadyToday ? "Check-in já feito hoje" : <>Fazer check-in do cliente <span style={{ color: "var(--c-muted)", fontWeight: 600 }}>(+20 pts · 1×/dia)</span></>}
            </span>
          </button>
          {msg && (
            <p style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 13.5, color: msg.ok ? "var(--c-green)" : "var(--c-red)" }}>{msg.text}</p>
          )}
          <Button full icon="check" onClick={submit} loading={busy} disabled={!code || !euros}>
            Registar compra
          </Button>
        </Card>

        <Card style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
          <div style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 16, color: "var(--c-ink)" }}>Validar voucher</div>
          <input value={codigo} onChange={(e) => setCodigo(fmtVoucher(e.target.value))} inputMode="text" autoCapitalize="characters" maxLength={7} placeholder="Código (ex.: AB-1A2B)" style={{ ...inputStyle, textTransform: "uppercase", letterSpacing: 1 }} />
          {vMsg && (
            <p style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 13.5, color: vMsg.ok ? "var(--c-green)" : "var(--c-red)" }}>{vMsg.text}</p>
          )}
          <Button variant="dark" icon="check" onClick={validate} loading={vBusy} disabled={!codigo || vBusy}>Marcar como entregue</Button>
        </Card>
      </Scroll>
    </>
  );
}

// Auto-formato do voucher: MAIÚSCULAS, só alfanumérico, traço automático a
// seguir ao prefixo "AB" da raspadinha (ex.: "ab1a2b" → "AB-1A2B"). O resgate
// (6 chars sem prefixo) fica sem traço. O servidor é tolerante na mesma.
function fmtVoucher(raw: string): string {
  const s = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  return s.startsWith("AB") && s.length > 2 ? `AB-${s.slice(2)}` : s;
}

const inputStyle: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid var(--c-line)",
  background: "var(--c-surface)",
  padding: "11px 14px",
  fontFamily: "var(--f-body)",
  fontSize: 15,
  color: "var(--c-ink)",
  outline: "none",
};
