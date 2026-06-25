"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/design/icons";
import { useI18n } from "@/design/i18n";
import { TopBar, Scroll, Card, IconTile, Button, SectionLabel } from "@/design/ui";
import { reservationSlots, type NextReservation } from "@/design/data";
import { createReservation } from "@/lib/app-actions";

/** Estado da reserva → etiqueta localizada + cor (para o card "próxima reserva"). */
function statusInfo(estado: string, T: (k: string) => string | string[]): { label: string; color: string } {
  if (estado === "confirmada") return { label: T("res.statusConfirmed") as string, color: "var(--c-green)" };
  if (estado === "cancelada") return { label: T("res.statusUnavailable") as string, color: "var(--c-red)" };
  return { label: T("res.statusPendingShort") as string, color: "var(--c-primary)" };
}

const WD_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MON_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

type Day = { key: number; wd: string; day: number; mon: string; full: string; iso: string };

export function Reservations({
  next,
  onBooked,
}: {
  next: NextReservation;
  onBooked: () => void;
}) {
  const { T } = useI18n();
  const days = useMemo<Day[]>(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    const out: Day[] = [];
    for (let i = 0; i < 10; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      out.push({
        key: i,
        wd: i === 0 ? (T("res.today") as string) : i === 1 ? (T("res.tomorrow") as string) : WD_PT[d.getDay()],
        day: d.getDate(),
        mon: MON_PT[d.getMonth()],
        full: `${WD_PT[d.getDay()]}, ${d.getDate()} ${MON_PT[d.getMonth()]}`,
        iso: d.toISOString().slice(0, 10),
      });
    }
    return out;
  }, [T]);

  const [dayKey, setDayKey] = useState(0);
  const [time, setTime] = useState<string | null>(null);
  const [people, setPeople] = useState(2);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const day = days.find((d) => d.key === dayKey)!;
  const slots = useMemo(
    () => reservationSlots(new Date(day.iso + "T00:00:00"), new Date()),
    [day.iso],
  );
  const ready = time != null && slots.includes(time) && !busy;

  function selectDay(key: number) {
    setDayKey(key);
    setTime(null); // horários mudam conforme o dia
    setError(null);
  }

  async function confirm() {
    if (!time) return;
    setBusy(true);
    setError(null);
    const res = await createReservation({ data: day.iso, hora: time, n_pessoas: people });
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setDone(true);
    onBooked();
  }

  if (done) {
    return (
      <>
        <TopBar title={T("res.titleShort") as string} />
        <Scroll>
          <div style={{ textAlign: "center", padding: "30px 10px" }}>
            <div style={{ width: 88, height: 88, borderRadius: "50%", margin: "0 auto", background: "color-mix(in srgb, var(--c-primary) 16%, var(--c-surface))", color: "var(--c-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="clock" size={44} stroke={2.4} />
            </div>
            <h2 style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 24, color: "var(--c-ink)", margin: "18px 0 6px" }}>{T("res.requested") as string}</h2>
            <p style={{ fontFamily: "var(--f-body)", fontSize: 14.5, color: "var(--c-muted)", margin: "0 auto", maxWidth: 320, lineHeight: 1.5 }}>{T("res.requestedSub") as string}</p>
          </div>
          <Card style={{ background: "color-mix(in srgb, var(--c-primary) 8%, var(--c-surface))", borderColor: "color-mix(in srgb, var(--c-primary) 22%, var(--c-line))" }}>
            <ResRow icon="calendar" label={T("res.day") as string} value={day.full} />
            <ResRow icon="clock" label={T("res.hour") as string} value={time as string} />
            <ResRow icon="users" label={T("res.people") as string} value={`${people} ${people > 1 ? (T("res.personN") as string) : (T("res.person1") as string)}`} />
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0" }}>
              <Icon name="bell" size={19} color="var(--c-primary)" />
              <span style={{ flex: 1, fontFamily: "var(--f-body)", fontSize: 14, color: "var(--c-muted)" }}>{T("res.status") as string}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 13, color: "var(--c-primary)", background: "color-mix(in srgb, var(--c-primary) 14%, var(--c-surface))", padding: "5px 11px", borderRadius: 100 }}>
                {T("res.statusPending") as string}
              </span>
            </div>
          </Card>
          <div style={{ marginTop: 16 }}>
            <Button full size="lg" variant="outline" onClick={() => { setDone(false); setTime(null); }}>
              {T("res.newRes") as string}
            </Button>
          </div>
        </Scroll>
      </>
    );
  }

  return (
    <>
      <TopBar title={T("res.title") as string} />
      <Scroll>
        {next && (() => {
          const st = statusInfo(next.estado, T);
          return (
            <Card style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 14, background: `color-mix(in srgb, ${st.color} 9%, var(--c-surface))`, borderColor: `color-mix(in srgb, ${st.color} 22%, var(--c-line))` }}>
              <IconTile icon="calendar" accent={st.color} size={48} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--f-body)", fontWeight: 800, fontSize: 11.5, letterSpacing: 0.5, color: st.color, textTransform: "uppercase" }}>{T("res.next") as string}</div>
                <div style={{ fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 15.5, color: "var(--c-ink)" }}>
                  {new Date(next.data + "T00:00:00").toLocaleDateString("pt-PT", { weekday: "short", day: "numeric", month: "short" })} · {next.hora.slice(0, 5)}
                </div>
                <div style={{ fontFamily: "var(--f-body)", fontSize: 13, color: "var(--c-muted)" }}>
                  {next.n_pessoas} {T("res.personN") as string} · <span style={{ color: st.color, fontWeight: 700 }}>{st.label}</span>
                </div>
              </div>
            </Card>
          );
        })()}

        <SectionLabel>{T("res.chooseDay") as string}</SectionLabel>
        <div style={{ display: "flex", gap: 9, overflowX: "auto", padding: "12px 0 4px" }} className="om-scroll">
          {days.map((d) => {
            const on = d.key === dayKey;
            return (
              <button key={d.key} onClick={() => selectDay(d.key)} style={{ flexShrink: 0, width: 62, padding: "11px 0", borderRadius: 16, cursor: "pointer", textAlign: "center", border: on ? "1px solid transparent" : "1px solid var(--c-line)", background: on ? "var(--c-green)" : "var(--c-surface)", color: on ? "#fff" : "var(--c-ink)" }}>
                <div style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 11.5, opacity: on ? 0.9 : 0.6 }}>{d.wd}</div>
                <div style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 19, lineHeight: 1.2 }}>{d.day}</div>
                <div style={{ fontFamily: "var(--f-body)", fontWeight: 600, fontSize: 10.5, opacity: on ? 0.9 : 0.5 }}>{d.mon}</div>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 18, display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
          <SectionLabel>{T("res.chooseTime") as string}</SectionLabel>
          <span style={{ fontFamily: "var(--f-body)", fontSize: 11, color: "var(--c-muted)" }}>{T("res.hoursNote") as string}</span>
        </div>
        {slots.length === 0 ? (
          <Card style={{ marginTop: 12, textAlign: "center", padding: "18px 14px", color: "var(--c-muted)", fontFamily: "var(--f-body)", fontSize: 13.5 }}>
            {T("res.noSlots") as string}
          </Card>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 9, marginTop: 12 }}>
            {slots.map((t) => {
              const on = t === time;
              return (
                <button key={t} onClick={() => setTime(t)} style={{ padding: "12px 0", borderRadius: 14, cursor: "pointer", fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 15, border: on ? "1px solid transparent" : "1px solid var(--c-line)", background: on ? "var(--c-green)" : "var(--c-surface)", color: on ? "#fff" : "var(--c-ink)" }}>
                  {t}
                </button>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 18 }}>
          <SectionLabel>{T("res.chooseHowMany") as string}</SectionLabel>
        </div>
        <Card style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <IconTile icon="users" accent="var(--c-green)" size={44} />
            <div>
              <div style={{ fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 16, color: "var(--c-ink)" }}>{people} {people > 1 ? (T("res.personN") as string) : (T("res.person1") as string)}</div>
              <div style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-muted)" }}>{T("res.upTo12") as string}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Stepper dir="minus" onClick={() => setPeople((p) => Math.max(1, p - 1))} disabled={people <= 1} />
            <Stepper dir="plus" onClick={() => setPeople((p) => Math.min(12, p + 1))} disabled={people >= 12} />
          </div>
        </Card>

        {error && <p style={{ marginTop: 14, fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 13.5, color: "var(--c-red)", textAlign: "center" }}>{error}</p>}

        <div style={{ marginTop: 20 }}>
          <Button full size="lg" accent="var(--c-green)" onClick={confirm} icon="bell" style={{ opacity: ready ? 1 : 0.5, pointerEvents: ready ? "auto" : "none", boxShadow: "0 8px 20px -8px color-mix(in srgb, var(--c-green) 60%, transparent)" }}>
            {time ? (T("res.request", day.wd, time) as string) : (T("res.pickHour") as string)}
          </Button>
        </div>
      </Scroll>
    </>
  );
}

function Stepper({ dir, onClick, disabled }: { dir: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: 42, height: 42, borderRadius: 13, cursor: disabled ? "default" : "pointer", border: "1px solid var(--c-line)", background: "var(--c-surface)", display: "flex", alignItems: "center", justifyContent: "center", color: disabled ? "var(--c-line)" : "var(--c-green)" }}>
      <Icon name={dir} size={20} stroke={2.6} />
    </button>
  );
}

function ResRow({ icon, label, value, last }: { icon: string; label: string; value: string; last?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: last ? "none" : "1px solid color-mix(in srgb, var(--c-green) 16%, var(--c-line))" }}>
      <Icon name={icon} size={19} color="var(--c-green)" />
      <span style={{ flex: 1, fontFamily: "var(--f-body)", fontSize: 14, color: "var(--c-muted)" }}>{label}</span>
      <span style={{ fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 15, color: "var(--c-ink)" }}>{value}</span>
    </div>
  );
}
