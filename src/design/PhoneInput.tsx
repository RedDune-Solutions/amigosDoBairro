"use client";

// Input de telemóvel com seletor de indicativo internacional por país.
// Predefinição: Portugal (+351) — o utilizador-tipo do café é português.
// Bandeiras REAIS via country-flag-icons (mesma lib do LangToggle), nunca
// desenhadas à mão. Funciona em dois modos:
//   • controlado: passar `value` + `onChange` (ex.: edição de perfil)
//   • formulário: passar `name` (gera input hidden com o valor combinado)
// Valor combinado guardado como "+351 912345678" (compatível com a validação
// do telefone: /^[0-9 +]{6,20}$/).

import { useState } from "react";
import { IconTile, BottomSheet } from "@/design/ui";
import { Icon } from "@/design/icons";
import { useI18n } from "@/design/i18n";

import PT from "country-flag-icons/react/3x2/PT";
import ES from "country-flag-icons/react/3x2/ES";
import FR from "country-flag-icons/react/3x2/FR";
import GB from "country-flag-icons/react/3x2/GB";
import IE from "country-flag-icons/react/3x2/IE";
import DE from "country-flag-icons/react/3x2/DE";
import NL from "country-flag-icons/react/3x2/NL";
import BE from "country-flag-icons/react/3x2/BE";
import LU from "country-flag-icons/react/3x2/LU";
import CH from "country-flag-icons/react/3x2/CH";
import IT from "country-flag-icons/react/3x2/IT";
import AT from "country-flag-icons/react/3x2/AT";
import DK from "country-flag-icons/react/3x2/DK";
import SE from "country-flag-icons/react/3x2/SE";
import NO from "country-flag-icons/react/3x2/NO";
import FI from "country-flag-icons/react/3x2/FI";
import PL from "country-flag-icons/react/3x2/PL";
import GR from "country-flag-icons/react/3x2/GR";
import BR from "country-flag-icons/react/3x2/BR";
import AO from "country-flag-icons/react/3x2/AO";
import MZ from "country-flag-icons/react/3x2/MZ";
import CV from "country-flag-icons/react/3x2/CV";
import US from "country-flag-icons/react/3x2/US";
import CA from "country-flag-icons/react/3x2/CA";
import MX from "country-flag-icons/react/3x2/MX";
import MA from "country-flag-icons/react/3x2/MA";
import DZ from "country-flag-icons/react/3x2/DZ";
import TN from "country-flag-icons/react/3x2/TN";
import ZA from "country-flag-icons/react/3x2/ZA";
import AE from "country-flag-icons/react/3x2/AE";
import CN from "country-flag-icons/react/3x2/CN";
import IN from "country-flag-icons/react/3x2/IN";
import JP from "country-flag-icons/react/3x2/JP";
import AU from "country-flag-icons/react/3x2/AU";
import TR from "country-flag-icons/react/3x2/TR";
import UA from "country-flag-icons/react/3x2/UA";
import RU from "country-flag-icons/react/3x2/RU";

type Flag = typeof PT; // FlagComponent do country-flag-icons (todas iguais)
type Country = { iso: string; dial: string; pt: string; en: string; flag: Flag };

// Lista curada: lusófonos + Europa/vizinhos + origens turísticas comuns.
// Para acrescentar um país: importar a bandeira acima e adicionar uma linha.
const COUNTRIES: Country[] = [
  { iso: "PT", dial: "+351", pt: "Portugal", en: "Portugal", flag: PT },
  { iso: "ES", dial: "+34", pt: "Espanha", en: "Spain", flag: ES },
  { iso: "FR", dial: "+33", pt: "França", en: "France", flag: FR },
  { iso: "GB", dial: "+44", pt: "Reino Unido", en: "United Kingdom", flag: GB },
  { iso: "IE", dial: "+353", pt: "Irlanda", en: "Ireland", flag: IE },
  { iso: "DE", dial: "+49", pt: "Alemanha", en: "Germany", flag: DE },
  { iso: "NL", dial: "+31", pt: "Países Baixos", en: "Netherlands", flag: NL },
  { iso: "BE", dial: "+32", pt: "Bélgica", en: "Belgium", flag: BE },
  { iso: "LU", dial: "+352", pt: "Luxemburgo", en: "Luxembourg", flag: LU },
  { iso: "CH", dial: "+41", pt: "Suíça", en: "Switzerland", flag: CH },
  { iso: "IT", dial: "+39", pt: "Itália", en: "Italy", flag: IT },
  { iso: "AT", dial: "+43", pt: "Áustria", en: "Austria", flag: AT },
  { iso: "DK", dial: "+45", pt: "Dinamarca", en: "Denmark", flag: DK },
  { iso: "SE", dial: "+46", pt: "Suécia", en: "Sweden", flag: SE },
  { iso: "NO", dial: "+47", pt: "Noruega", en: "Norway", flag: NO },
  { iso: "FI", dial: "+358", pt: "Finlândia", en: "Finland", flag: FI },
  { iso: "PL", dial: "+48", pt: "Polónia", en: "Poland", flag: PL },
  { iso: "GR", dial: "+30", pt: "Grécia", en: "Greece", flag: GR },
  { iso: "BR", dial: "+55", pt: "Brasil", en: "Brazil", flag: BR },
  { iso: "AO", dial: "+244", pt: "Angola", en: "Angola", flag: AO },
  { iso: "MZ", dial: "+258", pt: "Moçambique", en: "Mozambique", flag: MZ },
  { iso: "CV", dial: "+238", pt: "Cabo Verde", en: "Cape Verde", flag: CV },
  { iso: "US", dial: "+1", pt: "Estados Unidos", en: "United States", flag: US },
  { iso: "CA", dial: "+1", pt: "Canadá", en: "Canada", flag: CA },
  { iso: "MX", dial: "+52", pt: "México", en: "Mexico", flag: MX },
  { iso: "MA", dial: "+212", pt: "Marrocos", en: "Morocco", flag: MA },
  { iso: "DZ", dial: "+213", pt: "Argélia", en: "Algeria", flag: DZ },
  { iso: "TN", dial: "+216", pt: "Tunísia", en: "Tunisia", flag: TN },
  { iso: "ZA", dial: "+27", pt: "África do Sul", en: "South Africa", flag: ZA },
  { iso: "AE", dial: "+971", pt: "Emirados Árabes Unidos", en: "UAE", flag: AE },
  { iso: "CN", dial: "+86", pt: "China", en: "China", flag: CN },
  { iso: "IN", dial: "+91", pt: "Índia", en: "India", flag: IN },
  { iso: "JP", dial: "+81", pt: "Japão", en: "Japan", flag: JP },
  { iso: "AU", dial: "+61", pt: "Austrália", en: "Australia", flag: AU },
  { iso: "TR", dial: "+90", pt: "Turquia", en: "Turkey", flag: TR },
  { iso: "UA", dial: "+380", pt: "Ucrânia", en: "Ukraine", flag: UA },
  { iso: "RU", dial: "+7", pt: "Rússia", en: "Russia", flag: RU },
];

const DEFAULT_ISO = "PT";
const BY_ISO: Record<string, Country> = Object.fromEntries(COUNTRIES.map((c) => [c.iso, c]));
// Indicativos do mais longo para o mais curto → match de prefixo correto.
const DIALS_BY_LEN = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);

const sanitize = (v: string) => v.replace(/[^\d ]/g, "");

function parse(raw: string): { iso: string; national: string } {
  const s = (raw ?? "").trim();
  if (s.startsWith("+")) {
    const match = DIALS_BY_LEN.find((c) => s.startsWith(c.dial));
    if (match) return { iso: match.iso, national: sanitize(s.slice(match.dial.length).trim()) };
  }
  return { iso: DEFAULT_ISO, national: sanitize(s.replace(/^\+/, "").trim()) };
}

function combine(iso: string, national: string): string {
  const dial = BY_ISO[iso]?.dial ?? BY_ISO[DEFAULT_ISO].dial;
  const nat = sanitize(national).trim();
  return nat ? `${dial} ${nat}` : ""; // sem número → vazio (telefone é opcional)
}

export function PhoneInput({
  name,
  value,
  onChange,
  defaultValue,
  label,
  icon = "phone",
  accent = "var(--c-green)",
  variant = "field",
  last,
}: {
  name?: string;
  value?: string;
  onChange?: (v: string) => void;
  defaultValue?: string;
  label?: string;
  icon?: string;
  accent?: string;
  variant?: "field" | "row";
  last?: boolean;
}) {
  const { lang } = useI18n();
  const controlled = onChange != null;
  const [internal, setInternal] = useState(() => parse(value ?? defaultValue ?? ""));
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const current = controlled ? parse(value ?? "") : internal;
  const country = BY_ISO[current.iso] ?? BY_ISO[DEFAULT_ISO];
  const SelFlag = country.flag;
  const combined = combine(current.iso, current.national);

  function update(next: { iso: string; national: string }) {
    if (controlled) onChange?.(combine(next.iso, next.national));
    else setInternal(next);
  }
  const pickCountry = (iso: string) => {
    update({ iso, national: current.national });
    setOpen(false);
    setQuery("");
  };
  const onNational = (v: string) => update({ iso: current.iso, national: sanitize(v) });

  const filtered = COUNTRIES.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      c.pt.toLowerCase().includes(q) ||
      c.en.toLowerCase().includes(q) ||
      c.dial.includes(q) ||
      c.iso.toLowerCase().includes(q)
    );
  });

  // Botão do seletor de país (bandeira + indicativo) — partilhado pelos variantes.
  const countryButton = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={lang === "en" ? "Country code" : "Indicativo do país"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 8px",
        borderRadius: 10,
        border: "1px solid var(--c-line)",
        background: "var(--c-surface2)",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      <SelFlag style={{ width: 22, height: "auto", borderRadius: 3, boxShadow: "0 0 0 1px rgba(0,0,0,0.08)", display: "block" }} />
      <span style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 14, color: "var(--c-ink)" }}>{country.dial}</span>
      <Icon name="chevronRight" size={13} color="var(--c-muted)" style={{ transform: "rotate(90deg)" }} />
    </button>
  );

  const nationalInput = (
    <input
      type="tel"
      inputMode="tel"
      autoComplete="tel-national"
      value={current.national}
      onChange={(e) => onNational(e.target.value)}
      placeholder="912 345 678"
      maxLength={14}
      style={{
        flex: 1,
        border: "none",
        outline: "none",
        background: "transparent",
        fontFamily: "var(--f-body)",
        fontWeight: variant === "row" ? 600 : 400,
        fontSize: variant === "row" ? 15.5 : 15,
        color: "var(--c-ink)",
        minWidth: 0,
        padding: variant === "row" ? "3px 0 0" : 0,
      }}
    />
  );

  const sheet = open && (
    <BottomSheet onClose={() => { setOpen(false); setQuery(""); }} maxHeight="80%">
      <h3 style={{ margin: "0 0 12px", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 18, color: "var(--c-ink)", textAlign: "center" }}>
        {lang === "en" ? "Country" : "País"}
      </h3>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 14px", height: 46, background: "var(--c-surface)", border: "1px solid var(--c-line)", borderRadius: 13, marginBottom: 12 }}>
        <Icon name="search" size={17} color="var(--c-muted)" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={lang === "en" ? "Search country…" : "Procurar país…"}
          style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: "var(--f-body)", fontSize: 15, color: "var(--c-ink)", minWidth: 0 }}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {filtered.map((c) => {
          const on = c.iso === current.iso;
          const F = c.flag;
          return (
            <button
              key={c.iso}
              type="button"
              onClick={() => pickCountry(c.iso)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "11px 14px",
                borderRadius: 13,
                border: "1px solid " + (on ? "transparent" : "var(--c-line)"),
                cursor: "pointer",
                textAlign: "left",
                background: on ? "color-mix(in srgb, var(--c-primary) 13%, var(--c-surface))" : "var(--c-surface)",
              }}
            >
              <F style={{ width: 26, height: "auto", borderRadius: 4, boxShadow: "0 0 0 1px rgba(0,0,0,0.08)", display: "block", flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--f-body)", fontWeight: on ? 800 : 600, fontSize: 15, color: on ? "var(--c-primary)" : "var(--c-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {lang === "en" ? c.en : c.pt}
              </span>
              <span style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 14, color: "var(--c-muted)" }}>{c.dial}</span>
              {on && <Icon name="check" size={16} stroke={2.6} />}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p style={{ textAlign: "center", padding: "18px 0", fontFamily: "var(--f-body)", fontSize: 14, color: "var(--c-muted)" }}>
            {lang === "en" ? "No country found." : "Nenhum país encontrado."}
          </p>
        )}
      </div>
    </BottomSheet>
  );

  // ── Variante "row": dentro de um Card (estilo EditField do perfil) ───────────
  if (variant === "row") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 4px", borderBottom: last ? "none" : "1px solid var(--c-line)" }}>
        {name && <input type="hidden" name={name} value={combined} />}
        <IconTile icon={icon} accent={accent} size={40} iconSize={19} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {label && (
            <div style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 11.5, letterSpacing: 0.4, textTransform: "uppercase", color: "var(--c-muted)" }}>{label}</div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            {countryButton}
            {nationalInput}
          </div>
        </div>
        {sheet}
      </div>
    );
  }

  // ── Variante "field": estilo Field (registo) ────────────────────────────────
  return (
    <div style={{ display: "block" }}>
      {name && <input type="hidden" name={name} value={combined} />}
      {label && (
        <div style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 13, color: "var(--c-ink)", marginBottom: 6 }}>{label}</div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 8px 0 8px", height: 50, background: "var(--c-surface)", border: "1px solid var(--c-line)", borderRadius: 15 }}>
        {countryButton}
        {nationalInput}
      </div>
      {sheet}
    </div>
  );
}
