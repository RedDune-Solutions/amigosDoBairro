"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/design/icons";
import { Card, IconTile, Button, SectionLabel } from "@/design/ui";
import { patchPrize, addPrize, removePrize, updateLoyalty, validateVoucher } from "@/lib/admin-actions";

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
  stock: number;
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

const BADGE_ICONS = ["gift", "coffee", "cake", "sandwich", "plate", "percent", "ticket", "star", "sparkle", "trophy", "heart", "tag"];
const BADGE_ACCENTS = ["primary", "green", "blue", "red"];

function NumStep({ value, onDec, onInc, suffix, w = 58, accent = "var(--c-ink)" }: { value: number; onDec: () => void; onInc: () => void; suffix?: string; w?: number; accent?: string }) {
  const btn = (icon: string, fn: () => void) => (
    <button onClick={fn} style={{ width: 30, height: 30, borderRadius: 9, border: "1px solid var(--c-line)", background: "var(--c-surface)", cursor: "pointer", color: accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon name={icon} size={16} stroke={2.6} />
    </button>
  );
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      {btn("minus", onDec)}
      <div style={{ width: w, textAlign: "center", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 15, color: "var(--c-ink)" }}>{value}{suffix}</div>
      {btn("plus", onInc)}
    </div>
  );
}

function AdminTabBtn({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "9px 0", cursor: "pointer", border: "none", borderRadius: 13, background: active ? "var(--c-ink)" : "transparent", color: active ? "#fff" : "var(--c-muted)" }}>
      <Icon name={icon} size={19} stroke={active ? 2.4 : 2} />
      <span style={{ fontFamily: "var(--f-body)", fontWeight: active ? 800 : 600, fontSize: 11 }}>{label}</span>
    </button>
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

function PrizeRow({ prize, pct, onPatch, onRemove }: { prize: PrizeAdmin; pct: number; onPatch: (p: Partial<PrizeAdmin>) => void; onRemove: () => void }) {
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
        <button onClick={onRemove} style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid var(--c-line)", background: "var(--c-surface)", cursor: "pointer", color: "var(--c-red)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name="trash" size={16} stroke={2} />
        </button>
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 11, color: "var(--c-muted)", marginBottom: 5 }}>
            <Icon name="percent" size={12} /> PROBABILIDADE · <b style={{ color: "var(--c-ink)" }}>{pct}%</b>
          </div>
          <NumStep value={prize.weight} onDec={() => onPatch({ weight: Math.max(1, prize.weight - 1) })} onInc={() => onPatch({ weight: prize.weight + 1 })} w={34} />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 11, color: "var(--c-muted)", marginBottom: 5 }}>
            <Icon name="box" size={12} /> STOCK
          </div>
          <NumStep value={prize.stock} onDec={() => onPatch({ stock: Math.max(0, prize.stock - 1) })} onInc={() => onPatch({ stock: prize.stock + 1 })} w={42} accent={prize.stock <= 8 ? "var(--c-red)" : "var(--c-ink)"} />
        </div>
      </div>
    </div>
  );
}

function AdminPrizes({ prizes, setPrizes }: { prizes: PrizeAdmin[]; setPrizes: (p: PrizeAdmin[]) => void }) {
  const router = useRouter();
  const [pool, setPool] = useState<"comum" | "especial">("especial");
  const list = prizes.filter((p) => p.kind === pool);
  const total = list.reduce((s, p) => s + p.weight, 0) || 1;

  const patch = (id: string, fields: Partial<PrizeAdmin>) => {
    setPrizes(prizes.map((x) => (x.id === id ? { ...x, ...fields } : x)));
    void patchPrize({ id, ...fields } as Parameters<typeof patchPrize>[0]);
  };
  const remove = (id: string) => {
    setPrizes(prizes.filter((x) => x.id !== id));
    void removePrize(id);
  };
  const add = async () => {
    await addPrize(pool);
    router.refresh();
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

      <p style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-muted)", margin: "12px 2px 12px", lineHeight: 1.5 }}>
        Define o nome e a descrição em <b style={{ color: "var(--c-ink)" }}>português e inglês</b>. As probabilidades são relativas e somam <b style={{ color: "var(--c-ink)" }}>{total} pontos de peso</b>.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {list.map((p) => (
          <PrizeRow key={p.id} prize={p} pct={Math.round((p.weight / total) * 100)} onPatch={(x) => patch(p.id, x)} onRemove={() => remove(p.id)} />
        ))}
      </div>

      <button onClick={add} style={{ width: "100%", marginTop: 12, padding: "13px 0", borderRadius: 15, border: "1.5px dashed color-mix(in srgb, var(--c-ink) 25%, var(--c-line))", background: "var(--c-surface)", cursor: "pointer", color: "var(--c-ink)", fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 14.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Icon name="plus" size={18} stroke={2.4} /> Adicionar prémio
      </button>
    </>
  );
}

function AdminRedemptions({ vouchers }: { vouchers: VoucherRow[] }) {
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

function AdminStats({ stats, prizes }: { stats: AdminStatsData; prizes: PrizeAdmin[] }) {
  const especial = prizes.filter((p) => p.kind === "especial");
  const tiles = [
    { v: stats.scratchGiven, l: "Raspadinhas dadas", icon: "sparkle", a: "var(--c-primary)" },
    { v: stats.prizesWon, l: "Prémios ganhos", icon: "trophy", a: "var(--c-green)" },
    { v: stats.redeemed, l: "Resgates validados", icon: "check", a: "var(--c-blue)" },
    { v: stats.activeClients, l: "Clientes ativos", icon: "users", a: "var(--c-red)" },
  ];
  const lowStock = prizes.filter((p) => p.stock <= 8);
  const totalE = especial.reduce((s, p) => s + p.weight, 0) || 1;
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
              <span style={{ color: "var(--c-muted)", flexShrink: 0 }}>{Math.round((p.weight / totalE) * 100)}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 100, background: "var(--c-surface2)", overflow: "hidden" }}>
              <div style={{ width: `${(p.weight / totalE) * 100}%`, height: "100%", borderRadius: 100, background: `var(--c-${p.accent})` }} />
            </div>
          </div>
        ))}
      </Card>

      <div style={{ marginTop: 18 }}><SectionLabel>Stock baixo</SectionLabel></div>
      {lowStock.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 11 }}>
          {lowStock.map((p) => (
            <Card key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 13, borderColor: "color-mix(in srgb, var(--c-red) 30%, var(--c-line))", background: "color-mix(in srgb, var(--c-red) 6%, var(--c-surface))" }}>
              <Icon name="box" size={20} color="var(--c-red)" />
              <span style={{ flex: 1, fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 14, color: "var(--c-ink)" }}>{p.nome_pt}</span>
              <span style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 14, color: "var(--c-red)" }}>{p.stock} restam</span>
            </Card>
          ))}
        </div>
      ) : (
        <Card style={{ marginTop: 11, textAlign: "center", padding: 16, color: "var(--c-muted)", fontFamily: "var(--f-body)", fontSize: 13 }}>Stock saudável em todos os prémios.</Card>
      )}
    </>
  );
}

function AdminSettings({ euroPerStamp, stampGoal }: { euroPerStamp: number; stampGoal: number }) {
  const router = useRouter();
  const [eps, setEps] = useState(euroPerStamp);
  const [sg, setSg] = useState(stampGoal);
  const commit = (e: number, s: number) => { void updateLoyalty(e, s).then(() => router.refresh()); };
  return (
    <>
      <p style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-muted)", margin: "0 2px 14px", lineHeight: 1.5 }}>
        Regras do cartão de carimbos. As alterações aplicam-se a novos carimbos.
      </p>
      <Card style={{ display: "flex", alignItems: "center", gap: 13 }}>
        <IconTile icon="coffee" accent="var(--c-primary)" size={46} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 15, color: "var(--c-ink)" }}>Valor por carimbo</div>
          <div style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-muted)" }}>€ gastos para ganhar 1 carimbo</div>
        </div>
        <NumStep value={eps} suffix="€" accent="var(--c-primary)" onDec={() => { const n = Math.max(1, eps - 1); setEps(n); commit(n, sg); }} onInc={() => { const n = eps + 1; setEps(n); commit(n, sg); }} />
      </Card>
      <Card style={{ marginTop: 11, display: "flex", alignItems: "center", gap: 13 }}>
        <IconTile icon="star" accent="var(--c-green)" size={46} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 15, color: "var(--c-ink)" }}>Carimbos por cartola</div>
          <div style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-muted)" }}>Ao atingir, ganha 2 raspadinhas</div>
        </div>
        <NumStep value={sg} accent="var(--c-green)" w={34} onDec={() => { const n = Math.max(2, sg - 1); setSg(n); commit(eps, n); }} onInc={() => { const n = sg + 1; setSg(n); commit(eps, n); }} />
      </Card>
      <Card style={{ marginTop: 11, display: "flex", alignItems: "center", gap: 12, background: "color-mix(in srgb, var(--c-primary) 8%, var(--c-surface))", borderColor: "color-mix(in srgb, var(--c-primary) 22%, var(--c-line))" }}>
        <Icon name="sparkle" size={20} color="var(--c-primary)" />
        <span style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-ink)", lineHeight: 1.45 }}>
          Regra atual: a cada <b>{eps}€</b> = 1 carimbo · <b>{sg} carimbos</b> = 1 especial + 1 comum.
        </span>
      </Card>
    </>
  );
}

export function AdminPanel({
  prizes: initialPrizes,
  vouchers,
  stats,
  euroPerStamp,
  stampGoal,
}: {
  prizes: PrizeAdmin[];
  vouchers: VoucherRow[];
  stats: AdminStatsData;
  euroPerStamp: number;
  stampGoal: number;
}) {
  const router = useRouter();
  const [sec, setSec] = useState<"prizes" | "redeem" | "stats" | "settings">("prizes");
  const [prizes, setPrizes] = useState(initialPrizes);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--c-bg)" }}>
      <div style={{ padding: "6px 18px 12px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.push("/app")} style={{ width: 40, height: 40, borderRadius: 14, border: "1px solid var(--c-line)", background: "var(--c-surface)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--c-ink)" }}>
            <Icon name="chevronLeft" size={20} stroke={2.4} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Icon name="shield" size={18} color="var(--c-primary)" fill="color-mix(in srgb, var(--c-primary) 18%, transparent)" />
              <h1 style={{ margin: 0, fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 21, color: "var(--c-ink)", letterSpacing: -0.3 }}>Administração</h1>
            </div>
            <div style={{ fontFamily: "var(--f-body)", fontSize: 12, color: "var(--c-muted)" }}>Os Amigos do Bairro · Daniela</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, marginTop: 12, padding: 5, borderRadius: 16, background: "var(--c-surface)", border: "1px solid var(--c-line)" }}>
          <AdminTabBtn icon="gift" label="Prémios" active={sec === "prizes"} onClick={() => setSec("prizes")} />
          <AdminTabBtn icon="ticket" label="Resgates" active={sec === "redeem"} onClick={() => setSec("redeem")} />
          <AdminTabBtn icon="chart" label="Stats" active={sec === "stats"} onClick={() => setSec("stats")} />
          <AdminTabBtn icon="sliders" label="Regras" active={sec === "settings"} onClick={() => setSec("settings")} />
        </div>
      </div>

      <div className="om-scroll" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "4px 18px 22px" }}>
        {sec === "prizes" && <AdminPrizes prizes={prizes} setPrizes={setPrizes} />}
        {sec === "redeem" && <AdminRedemptions vouchers={vouchers} />}
        {sec === "stats" && <AdminStats stats={stats} prizes={prizes} />}
        {sec === "settings" && <AdminSettings euroPerStamp={euroPerStamp} stampGoal={stampGoal} />}
      </div>
    </div>
  );
}
