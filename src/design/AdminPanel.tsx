"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/design/icons";
import { Card, IconTile, Button, SectionLabel, Spinner } from "@/design/ui";
import { patchPrize, addPrize, removePrize, validateVoucher, patchReward, addReward, removeReward } from "@/lib/admin-actions";

export type RewardAdmin = {
  id: string;
  titulo: string;
  nome_en: string | null;
  descricao: string | null;
  desc_en: string | null;
  custo_pontos: number;
  icon: string | null;
  accent: string | null;
  ativo: boolean;
};

export type PrizeAdmin = {
  id: string;
  kind: "comum" | "especial";
  nome_pt: string;
  nome_en: string | null;
  desc_pt: string | null;
  desc_en: string | null;
  icon: string;
  accent: string;
  weight: number;
};

export type VoucherRow = {
  id: string;
  client: string;
  name: string;
  kind: string;
  code: string;
  when: string;
};

export type AdminStatsData = {
  scratchGiven: number;
  prizesWon: number;
  redeemed: number;
  activeClients: number;
};

export type LogRow = {
  quando: string;
  tipo: string;
  staff: string;
  cliente: string;
  detalhe: string;
  pontos: number;
};

const BADGE_ICONS = ["gift", "coffee", "cake", "sandwich", "plate", "percent", "ticket", "star", "sparkle", "trophy", "heart", "tag"];
const BADGE_ACCENTS = ["primary", "green", "blue", "red"];

function NumStepField({ value, onSet, min = 0, max, suffix, w }: { value: number; onSet: (n: number) => void; min?: number; max?: number; suffix?: string; w: number }) {
  // Remontado via key={value} no NumStep → text sincroniza com o valor externo.
  const [text, setText] = useState(String(value));
  const commit = () => {
    let n = parseInt(text.replace(/\D/g, ""), 10);
    if (isNaN(n)) { setText(String(value)); return; }
    n = Math.max(min, max !== undefined ? Math.min(max, n) : n);
    setText(String(n));
    if (n !== value) onSet(n);
  };
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", width: w }}>
      <input
        value={text}
        inputMode="numeric"
        onChange={(e) => setText(e.target.value.replace(/\D/g, ""))}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        style={{ width: suffix ? w - 22 : w, textAlign: "center", border: "none", background: "transparent", outline: "none", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 15, color: "var(--c-ink)" }}
      />
      {suffix && <span style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 13, color: "var(--c-muted)" }}>{suffix.trim()}</span>}
    </div>
  );
}

function NumStep({ value, onDec, onInc, onSet, min, max, suffix, w = 58, accent = "var(--c-ink)" }: { value: number; onDec: () => void; onInc: () => void; onSet?: (n: number) => void; min?: number; max?: number; suffix?: string; w?: number; accent?: string }) {
  const btn = (icon: string, fn: () => void) => (
    <button onClick={fn} style={{ width: 30, height: 30, borderRadius: 9, border: "1px solid var(--c-line)", background: "var(--c-surface)", cursor: "pointer", color: accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon name={icon} size={16} stroke={2.6} />
    </button>
  );
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      {btn("minus", onDec)}
      {onSet ? (
        <NumStepField key={value} value={value} onSet={onSet} min={min} max={max} suffix={suffix} w={w} />
      ) : (
        <div style={{ width: w, textAlign: "center", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 15, color: "var(--c-ink)" }}>{value}{suffix}</div>
      )}
      {btn("plus", onInc)}
    </div>
  );
}

function LangInput({ flag, value, onCommit }: { flag: string; value: string; onCommit: (v: string) => void }) {
  const [v, setV] = useState(value);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 9px", borderRadius: 10, background: "var(--c-surface2)", border: "1px solid var(--c-line)" }}>
      <span style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 10, letterSpacing: 0.4, color: "var(--c-muted)", flexShrink: 0, width: 20 }}>{flag}</span>
      <input value={v} onChange={(e) => setV(e.target.value)} onBlur={() => v !== value && onCommit(v)} style={{ flex: 1, minWidth: 0, fontFamily: "var(--f-body)", fontWeight: 600, fontSize: 13.5, color: "var(--c-ink)", border: "none", background: "transparent", outline: "none" }} />
    </div>
  );
}

/** Botão de apagar com confirmação (2 toques) — evita apagar sem se perceber. */
function TrashConfirm({ onConfirm }: { onConfirm: () => void }) {
  const [armed, setArmed] = useState(false);
  if (armed) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <button onClick={() => { setArmed(false); onConfirm(); }} style={{ height: 34, padding: "0 12px", borderRadius: 10, border: "none", background: "var(--c-red)", color: "#fff", cursor: "pointer", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 12.5 }}>
          Apagar
        </button>
        <button onClick={() => setArmed(false)} style={{ height: 34, padding: "0 11px", borderRadius: 10, border: "1px solid var(--c-line)", background: "var(--c-surface)", color: "var(--c-muted)", cursor: "pointer", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 12.5 }}>
          Não
        </button>
      </div>
    );
  }
  return (
    <button onClick={() => setArmed(true)} aria-label="Apagar" style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid var(--c-line)", background: "var(--c-surface)", cursor: "pointer", color: "var(--c-red)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon name="trash" size={16} stroke={2} />
    </button>
  );
}

function PrizeRow({ prize, poolTotal, onPatch, onRemove }: { prize: PrizeAdmin; poolTotal: number; onPatch: (p: Partial<PrizeAdmin>) => void; onRemove: () => void }) {
  const canInc = poolTotal < 100;
  const [badgeOpen, setBadgeOpen] = useState(false);
  return (
    <div style={{ padding: 13, borderRadius: 16, border: "1px solid var(--c-line)", background: "var(--c-surface)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
        <button onClick={() => setBadgeOpen((o) => !o)} style={{ position: "relative", padding: 0, border: "none", background: "transparent", cursor: "pointer", flexShrink: 0, lineHeight: 0 }}>
          <IconTile icon={prize.icon} accent={`var(--c-${prize.accent})`} size={42} iconSize={20} />
          <span style={{ position: "absolute", bottom: -3, right: -3, width: 18, height: 18, borderRadius: "50%", background: "var(--c-ink)", border: "2px solid var(--c-surface)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            <Icon name="edit" size={9} stroke={2.6} />
          </span>
        </button>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          <LangInput flag="PT" value={prize.nome_pt} onCommit={(v) => onPatch({ nome_pt: v })} />
          <LangInput flag="EN" value={prize.nome_en || ""} onCommit={(v) => onPatch({ nome_en: v })} />
        </div>
        <TrashConfirm onConfirm={onRemove} />
      </div>

      {badgeOpen && (
        <div style={{ marginTop: 11, padding: 12, borderRadius: 14, background: "var(--c-surface2)", border: "1px solid var(--c-line)" }}>
          <div style={{ fontFamily: "var(--f-body)", fontWeight: 800, fontSize: 10.5, letterSpacing: 0.4, textTransform: "uppercase", color: "var(--c-muted)", marginBottom: 8 }}>Ícone</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 7 }}>
            {BADGE_ICONS.map((ic) => {
              const on = prize.icon === ic;
              return (
                <button key={ic} onClick={() => onPatch({ icon: ic })} style={{ aspectRatio: "1", borderRadius: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", border: on ? `2px solid var(--c-${prize.accent})` : "1px solid var(--c-line)", background: on ? `color-mix(in srgb, var(--c-${prize.accent}) 14%, var(--c-surface))` : "var(--c-surface)", color: on ? `var(--c-${prize.accent})` : "var(--c-ink)" }}>
                  <Icon name={ic} size={19} stroke={2.1} />
                </button>
              );
            })}
          </div>
          <div style={{ fontFamily: "var(--f-body)", fontWeight: 800, fontSize: 10.5, letterSpacing: 0.4, textTransform: "uppercase", color: "var(--c-muted)", margin: "13px 0 8px" }}>Cor</div>
          <div style={{ display: "flex", gap: 9 }}>
            {BADGE_ACCENTS.map((ac) => {
              const on = prize.accent === ac;
              return (
                <button key={ac} onClick={() => onPatch({ accent: ac })} aria-label={ac} style={{ width: 32, height: 32, borderRadius: "50%", cursor: "pointer", flexShrink: 0, background: `var(--c-${ac})`, border: on ? "3px solid var(--c-ink)" : "2px solid var(--c-surface)", boxShadow: on ? "none" : "0 0 0 1px var(--c-line)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                  {on && <Icon name="check" size={15} stroke={3} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 9 }}>
        <LangInput flag="PT" value={prize.desc_pt || ""} onCommit={(v) => onPatch({ desc_pt: v })} />
        <LangInput flag="EN" value={prize.desc_en || ""} onCommit={(v) => onPatch({ desc_en: v })} />
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 11, color: "var(--c-muted)" }}>
            <Icon name="percent" size={12} /> PROBABILIDADE · <b style={{ color: "var(--c-ink)" }}>{prize.weight}%</b>
          </div>
          <NumStep value={prize.weight} suffix="%" w={50} min={1} max={100} onSet={(n) => onPatch({ weight: Math.max(1, Math.min(100, n)) })} onDec={() => onPatch({ weight: Math.max(1, prize.weight - 1) })} onInc={() => canInc && onPatch({ weight: Math.min(100, prize.weight + 1) })} />
        </div>
        <div style={{ height: 8, borderRadius: 100, background: "var(--c-surface2)", overflow: "hidden", marginTop: 8 }}>
          <div style={{ width: `${Math.min(100, prize.weight)}%`, height: "100%", borderRadius: 100, background: `var(--c-${prize.accent})` }} />
        </div>
      </div>
    </div>
  );
}

export function AdminPrizes({ prizes, setPrizes }: { prizes: PrizeAdmin[]; setPrizes: (p: PrizeAdmin[]) => void }) {
  const [pool, setPool] = useState<"comum" | "especial">("especial");
  const [adding, setAdding] = useState(false);
  const list = prizes.filter((p) => p.kind === pool);
  const total = list.reduce((s, p) => s + p.weight, 0);

  const patch = (id: string, fields: Partial<PrizeAdmin>) => {
    setPrizes(prizes.map((x) => (x.id === id ? { ...x, ...fields } : x)));
    void patchPrize({ id, ...fields } as Parameters<typeof patchPrize>[0]);
  };
  const remove = (id: string) => {
    setPrizes(prizes.filter((x) => x.id !== id));
    void removePrize(id);
  };
  const add = async () => {
    if (adding) return;
    setAdding(true);
    const res = await addPrize(pool);
    if (res?.id) {
      const weight = Math.max(1, Math.min(10, 100 - total));
      setPrizes([...prizes, { id: res.id, kind: pool, nome_pt: "Novo prémio", nome_en: "New prize", desc_pt: null, desc_en: null, icon: "gift", accent: pool === "especial" ? "primary" : "green", weight }]);
    }
    setAdding(false);
  };

  return (
    <>
      <div style={{ display: "flex", gap: 8, padding: 5, borderRadius: 15, background: "var(--c-surface2)", border: "1px solid var(--c-line)" }}>
        {([["especial", "Especial", "Prémios grandes"], ["comum", "Comum", "Mimos do dia-a-dia"]] as const).map(([k, lab, sub]) => {
          const on = pool === k;
          return (
            <button key={k} onClick={() => setPool(k)} style={{ flex: 1, padding: "10px 8px", borderRadius: 11, cursor: "pointer", border: "none", textAlign: "center", background: on ? (k === "especial" ? "linear-gradient(135deg,#F8DE7E,#C78A1E)" : "var(--c-ink)") : "transparent", color: on ? (k === "especial" ? "#7A560E" : "#fff") : "var(--c-muted)" }}>
              <div style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 14 }}>{lab}</div>
              <div style={{ fontFamily: "var(--f-body)", fontWeight: 600, fontSize: 10.5, opacity: 0.85 }}>{sub}</div>
            </button>
          );
        })}
      </div>

      <p style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-muted)", margin: "12px 2px 10px", lineHeight: 1.5 }}>
        Define o nome e a descrição em <b style={{ color: "var(--c-ink)" }}>português e inglês</b>. Cada prémio tem uma <b style={{ color: "var(--c-ink)" }}>percentagem absoluta</b> — a soma da pool não pode passar de 100%.
      </p>

      <Card pad={14} style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "var(--f-body)", fontWeight: 800, fontSize: 12.5, color: "var(--c-ink)" }}>
          <span>Total usado</span>
          <span style={{ color: total > 100 ? "var(--c-red)" : total === 100 ? "var(--c-green)" : "var(--c-muted)" }}>{total}% / 100%</span>
        </div>
        <div style={{ height: 10, borderRadius: 100, background: "var(--c-surface2)", overflow: "hidden", marginTop: 8, display: "flex" }}>
          <div style={{ width: `${Math.min(100, total)}%`, height: "100%", background: total > 100 ? "var(--c-red)" : "linear-gradient(90deg,#ef9a2e,#e2503c)" }} />
        </div>
        <div style={{ fontFamily: "var(--f-body)", fontSize: 11.5, color: "var(--c-muted)", marginTop: 7 }}>
          {total >= 100 ? "Sai sempre um prémio." : <>Sem prémio: <b style={{ color: "var(--c-ink)" }}>{100 - total}%</b> das raspadinhas.</>}
        </div>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {list.map((p) => (
          <PrizeRow key={p.id} prize={p} poolTotal={total} onPatch={(x) => patch(p.id, x)} onRemove={() => remove(p.id)} />
        ))}
      </div>

      <button onClick={add} disabled={adding} style={{ width: "100%", marginTop: 12, padding: "13px 0", borderRadius: 15, border: "1.5px dashed color-mix(in srgb, var(--c-ink) 25%, var(--c-line))", background: "var(--c-surface)", cursor: adding ? "default" : "pointer", opacity: adding ? 0.6 : 1, color: "var(--c-ink)", fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 14.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        {adding ? <Spinner size={16} /> : <><Icon name="plus" size={18} stroke={2.4} /> Adicionar prémio</>}
      </button>
    </>
  );
}

function RewardRow({ reward, onPatch, onRemove }: { reward: RewardAdmin; onPatch: (p: Partial<RewardAdmin>) => void; onRemove: () => void }) {
  const [badgeOpen, setBadgeOpen] = useState(false);
  const accent = reward.accent || "primary";
  return (
    <div style={{ padding: 13, borderRadius: 16, border: "1px solid var(--c-line)", background: "var(--c-surface)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
        <button onClick={() => setBadgeOpen((o) => !o)} style={{ position: "relative", padding: 0, border: "none", background: "transparent", cursor: "pointer", flexShrink: 0, lineHeight: 0 }}>
          <IconTile icon={reward.icon || "gift"} accent={`var(--c-${accent})`} size={42} iconSize={20} />
          <span style={{ position: "absolute", bottom: -3, right: -3, width: 18, height: 18, borderRadius: "50%", background: "var(--c-ink)", border: "2px solid var(--c-surface)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            <Icon name="edit" size={9} stroke={2.6} />
          </span>
        </button>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          <LangInput flag="PT" value={reward.titulo} onCommit={(v) => onPatch({ titulo: v })} />
          <LangInput flag="EN" value={reward.nome_en || ""} onCommit={(v) => onPatch({ nome_en: v })} />
        </div>
        <TrashConfirm onConfirm={onRemove} />
      </div>

      {badgeOpen && (
        <div style={{ marginTop: 11, padding: 12, borderRadius: 14, background: "var(--c-surface2)", border: "1px solid var(--c-line)" }}>
          <div style={{ fontFamily: "var(--f-body)", fontWeight: 800, fontSize: 10.5, letterSpacing: 0.4, textTransform: "uppercase", color: "var(--c-muted)", marginBottom: 8 }}>Ícone</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 7 }}>
            {BADGE_ICONS.map((ic) => {
              const on = (reward.icon || "gift") === ic;
              return (
                <button key={ic} onClick={() => onPatch({ icon: ic })} style={{ aspectRatio: "1", borderRadius: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", border: on ? `2px solid var(--c-${accent})` : "1px solid var(--c-line)", background: on ? `color-mix(in srgb, var(--c-${accent}) 14%, var(--c-surface))` : "var(--c-surface)", color: on ? `var(--c-${accent})` : "var(--c-ink)" }}>
                  <Icon name={ic} size={19} stroke={2.1} />
                </button>
              );
            })}
          </div>
          <div style={{ fontFamily: "var(--f-body)", fontWeight: 800, fontSize: 10.5, letterSpacing: 0.4, textTransform: "uppercase", color: "var(--c-muted)", margin: "13px 0 8px" }}>Cor</div>
          <div style={{ display: "flex", gap: 9 }}>
            {BADGE_ACCENTS.map((ac) => {
              const on = accent === ac;
              return (
                <button key={ac} onClick={() => onPatch({ accent: ac })} aria-label={ac} style={{ width: 32, height: 32, borderRadius: "50%", cursor: "pointer", flexShrink: 0, background: `var(--c-${ac})`, border: on ? "3px solid var(--c-ink)" : "2px solid var(--c-surface)", boxShadow: on ? "none" : "0 0 0 1px var(--c-line)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                  {on && <Icon name="check" size={15} stroke={3} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 9 }}>
        <LangInput flag="PT" value={reward.descricao || ""} onCommit={(v) => onPatch({ descricao: v })} />
        <LangInput flag="EN" value={reward.desc_en || ""} onCommit={(v) => onPatch({ desc_en: v })} />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 11, color: "var(--c-muted)" }}>
          <Icon name="star" size={12} fill="currentColor" /> CUSTO EM PONTOS
        </div>
        <NumStep value={reward.custo_pontos} suffix=" pts" accent="var(--c-primary)" w={78} min={1} onSet={(n) => onPatch({ custo_pontos: Math.max(1, n) })} onDec={() => onPatch({ custo_pontos: Math.max(1, reward.custo_pontos - 10) })} onInc={() => onPatch({ custo_pontos: reward.custo_pontos + 10 })} />
      </div>
    </div>
  );
}

export function AdminRewards({ rewards, setRewards }: { rewards: RewardAdmin[]; setRewards: (r: RewardAdmin[]) => void }) {
  const [adding, setAdding] = useState(false);
  const patch = (id: string, fields: Partial<RewardAdmin>) => {
    setRewards(rewards.map((x) => (x.id === id ? { ...x, ...fields } : x)));
    void patchReward({ id, ...fields } as Parameters<typeof patchReward>[0]);
  };
  const remove = (id: string) => {
    setRewards(rewards.filter((x) => x.id !== id));
    void removeReward(id);
  };
  const add = async () => {
    if (adding) return;
    setAdding(true);
    const res = await addReward();
    if (res?.id) {
      setRewards([...rewards, { id: res.id, titulo: "Nova recompensa", nome_en: "New reward", descricao: null, desc_en: null, custo_pontos: 100, icon: "gift", accent: "primary", ativo: true }]);
    }
    setAdding(false);
  };
  return (
    <>
      <p style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-muted)", margin: "12px 2px 12px", lineHeight: 1.5 }}>
        O catálogo que os clientes trocam por <b style={{ color: "var(--c-ink)" }}>pontos</b>. Define nome, descrição, ícone e o <b style={{ color: "var(--c-ink)" }}>custo em pontos</b>.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rewards.map((r) => (
          <RewardRow key={r.id} reward={r} onPatch={(x) => patch(r.id, x)} onRemove={() => remove(r.id)} />
        ))}
      </div>
      <button onClick={add} disabled={adding} style={{ width: "100%", marginTop: 12, padding: "13px 0", borderRadius: 15, border: "1.5px dashed color-mix(in srgb, var(--c-ink) 25%, var(--c-line))", background: "var(--c-surface)", cursor: adding ? "default" : "pointer", opacity: adding ? 0.6 : 1, color: "var(--c-ink)", fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 14.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        {adding ? <Spinner size={16} /> : <><Icon name="plus" size={18} stroke={2.4} /> Adicionar recompensa</>}
      </button>
    </>
  );
}

export function AdminRedemptions({ vouchers }: { vouchers: VoucherRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = q ? vouchers.filter((r) => r.client.toLowerCase().includes(q) || r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q)) : vouchers;

  async function confirm(code: string) {
    await validateVoucher(code);
    router.refresh();
  }

  if (!vouchers.length) {
    return (
      <Card style={{ textAlign: "center", padding: "30px 18px" }}>
        <div style={{ width: 58, height: 58, borderRadius: 18, margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--c-green)", background: "color-mix(in srgb, var(--c-green) 14%, var(--c-surface))" }}>
          <Icon name="check" size={30} stroke={2.6} />
        </div>
        <div style={{ fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 16, color: "var(--c-ink)" }}>Tudo validado!</div>
        <div style={{ fontFamily: "var(--f-body)", fontSize: 13, color: "var(--c-muted)", marginTop: 3 }}>Sem resgates pendentes no balcão.</div>
      </Card>
    );
  }

  return (
    <>
      <p style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-muted)", margin: "0 2px 12px", lineHeight: 1.5 }}>
        Procura pelo cliente e confirma o código que ele mostra para entregar o prémio.
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 13px", borderRadius: 14, background: "var(--c-surface)", border: "1px solid var(--c-line)", marginBottom: 12 }}>
        <Icon name="search" size={18} color="var(--c-muted)" stroke={2.2} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Procurar cliente, código ou prémio…" style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontFamily: "var(--f-body)", fontWeight: 600, fontSize: 13.5, color: "var(--c-ink)" }} />
      </div>
      {!filtered.length ? (
        <Card style={{ textAlign: "center", padding: "26px 18px", color: "var(--c-muted)", fontFamily: "var(--f-body)", fontSize: 13 }}>Sem vouchers para “{query}”.</Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((r) => {
            const esp = r.kind === "especial";
            return (
              <Card key={r.id} style={{ display: "flex", alignItems: "center", gap: 13 }}>
                <div style={{ width: 46, height: 46, borderRadius: 13, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: esp ? "#7A560E" : "var(--c-ink)", background: esp ? "linear-gradient(135deg,#F8DE7E,#C78A1E)" : "color-mix(in srgb, var(--c-ink) 8%, var(--c-surface))" }}>
                  <Icon name="ticket" size={22} stroke={2} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 14.5, color: "var(--c-ink)" }}>{r.name}</div>
                  <div style={{ fontFamily: "var(--f-body)", fontSize: 12, color: "var(--c-muted)" }}>{r.client} · {r.when}</div>
                  <div style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 12.5, letterSpacing: 1, color: esp ? "#B07D17" : "var(--c-primary)", marginTop: 2 }}>{r.code}</div>
                </div>
                <Button size="sm" accent="var(--c-green)" icon="check" onClick={() => confirm(r.code)}>Validar</Button>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

export function AdminStats({ stats, prizes }: { stats: AdminStatsData; prizes: PrizeAdmin[] }) {
  const especial = prizes.filter((p) => p.kind === "especial");
  const tiles = [
    { v: stats.scratchGiven, l: "Raspadinhas dadas", icon: "sparkle", a: "var(--c-primary)" },
    { v: stats.prizesWon, l: "Prémios ganhos", icon: "trophy", a: "var(--c-green)" },
    { v: stats.redeemed, l: "Resgates validados", icon: "check", a: "var(--c-blue)" },
    { v: stats.activeClients, l: "Clientes ativos", icon: "users", a: "var(--c-red)" },
  ];
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
        {tiles.map((t) => (
          <Card key={t.l} pad={15}>
            <div style={{ width: 38, height: 38, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: t.a, background: `color-mix(in srgb, ${t.a} 15%, var(--c-surface))` }}>
              <Icon name={t.icon} size={20} stroke={2.2} />
            </div>
            <div style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 28, color: "var(--c-ink)", marginTop: 9, lineHeight: 1 }}>{t.v}</div>
            <div style={{ fontFamily: "var(--f-body)", fontWeight: 600, fontSize: 12, color: "var(--c-muted)", marginTop: 2 }}>{t.l}</div>
          </Card>
        ))}
      </div>

      <div style={{ marginTop: 18 }}><SectionLabel>Distribuição da raspadinha especial</SectionLabel></div>
      <Card style={{ marginTop: 11 }}>
        {especial.map((p, i) => (
          <div key={p.id} style={{ marginTop: i ? 13 : 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 12.5, color: "var(--c-ink)", marginBottom: 6 }}>
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.nome_pt}</span>
              <span style={{ color: "var(--c-muted)", flexShrink: 0 }}>{p.weight}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 100, background: "var(--c-surface2)", overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, p.weight)}%`, height: "100%", borderRadius: 100, background: `var(--c-${p.accent})` }} />
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}

export function AdminLog({ log }: { log: LogRow[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = q
    ? log.filter((r) => r.staff.toLowerCase().includes(q) || r.cliente.toLowerCase().includes(q) || r.detalhe.toLowerCase().includes(q) || r.tipo.toLowerCase().includes(q))
    : log;

  function fmt(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <>
      <p style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-muted)", margin: "0 2px 12px", lineHeight: 1.5 }}>
        Quem da equipa deu pontos, fez ajustes ou entregou prémios. Movimentos mais recentes primeiro.
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 13px", borderRadius: 14, background: "var(--c-surface)", border: "1px solid var(--c-line)", marginBottom: 12 }}>
        <Icon name="search" size={18} color="var(--c-muted)" stroke={2.2} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Procurar funcionário, cliente ou prémio…" style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontFamily: "var(--f-body)", fontWeight: 600, fontSize: 13.5, color: "var(--c-ink)" }} />
      </div>
      {!filtered.length ? (
        <Card style={{ textAlign: "center", padding: "26px 18px", color: "var(--c-muted)", fontFamily: "var(--f-body)", fontSize: 13 }}>
          {log.length ? `Sem resultados para “${query}”.` : "Ainda sem ações registadas."}
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {filtered.map((r, i) => {
            const pos = r.pontos > 0;
            const neg = r.pontos < 0;
            return (
              <Card key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 13.5, color: "var(--c-ink)" }}>{r.tipo}</span>
                    <span style={{ fontFamily: "var(--f-body)", fontSize: 11.5, color: "var(--c-muted)" }}>{fmt(r.quando)}</span>
                  </div>
                  <div style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-ink)", marginTop: 2 }}>
                    <b>{r.staff}</b> → {r.cliente}
                  </div>
                  {r.detalhe && <div style={{ fontFamily: "var(--f-body)", fontSize: 12, color: "var(--c-muted)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.detalhe}</div>}
                </div>
                {r.pontos !== 0 && (
                  <span style={{ flexShrink: 0, fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 14, color: pos ? "var(--c-green)" : neg ? "var(--c-red)" : "var(--c-muted)" }}>
                    {pos ? "+" : ""}{r.pontos}
                  </span>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

