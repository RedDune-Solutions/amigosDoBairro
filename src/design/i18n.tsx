"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { STRINGS, type Lang } from "@/design/strings";

/** Localiza um campo bilingue { pt, en }. */
export function localize<T>(val: T | { pt: T; en: T }, lang: Lang): T {
  if (val && typeof val === "object" && ("pt" in val || "en" in val)) {
    const v = val as { pt: T; en: T };
    return v[lang] != null ? v[lang] : v.pt;
  }
  return val as T;
}

/** Traduz por chave (com args para entradas-função). */
export function translate(lang: Lang, key: string, ...args: unknown[]): string | string[] {
  const entry = STRINGS[key];
  if (entry == null) return key;
  const v = (entry[lang] != null ? entry[lang] : entry.pt) as
    | string
    | string[]
    | ((...a: unknown[]) => string | string[]);
  return typeof v === "function" ? v(...args) : v;
}

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  T: (key: string, ...args: unknown[]) => string | string[];
  L: <T>(val: T | { pt: T; en: T }) => T;
};

const LangContext = createContext<Ctx | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("pt");

  useEffect(() => {
    try {
      const s = localStorage.getItem("oab_lang");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (s === "pt" || s === "en") setLangState(s);
    } catch {
      /* noop */
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("oab_lang", l);
    } catch {
      /* noop */
    }
  };

  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang,
      T: (key, ...args) => translate(lang, key, ...args),
      L: (val) => localize(val, lang),
    }),
    [lang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(LangContext);
  if (!ctx) {
    // fallback PT (fora de provider)
    return {
      lang: "pt",
      setLang: () => {},
      T: (key, ...args) => translate("pt", key, ...args),
      L: (val) => localize(val, "pt"),
    };
  }
  return ctx;
}

// Bandeiras (flagcdn) — emojis 🇵🇹/🇬🇧 aparecem como letras no Windows
export function FlagIcon({ code, size = 26 }: { code: string; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/${code}.svg`}
      alt={code === "pt" ? "Português" : "English"}
      width={size}
      height={size}
      style={{ display: "block", width: size, height: size, objectFit: "cover", borderRadius: "50%" }}
    />
  );
}

export function LangToggle({
  value,
  onChange,
  flags,
}: {
  value: Lang;
  onChange: (l: Lang) => void;
  flags?: boolean;
}) {
  if (flags) {
    const next: Lang = value === "pt" ? "en" : "pt";
    const flagCode = value === "pt" ? "pt" : "gb";
    return (
      <button
        onClick={() => onChange(next)}
        title={next === "en" ? "Switch to English" : "Mudar para Português"}
        style={{
          padding: 3,
          borderRadius: "50%",
          border: "2px solid var(--c-surface)",
          background: "var(--c-surface)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.16), 0 0 0 1px var(--c-line)",
          width: 30,
          height: 30,
        }}
      >
        <FlagIcon code={flagCode} size={32} />
      </button>
    );
  }
  const opts: [Lang, string][] = [
    ["pt", "PT"],
    ["en", "EN"],
  ];
  return (
    <div
      style={{
        display: "inline-flex",
        gap: 4,
        padding: 4,
        borderRadius: 100,
        background: "var(--c-surface2)",
        border: "1px solid var(--c-line)",
      }}
    >
      {opts.map(([v, lbl]) => {
        const on = value === v;
        return (
          <button
            key={v}
            onClick={() => onChange(v)}
            style={{
              padding: "7px 15px",
              borderRadius: 100,
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--f-display)",
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: 0.3,
              background: on ? "var(--c-primary)" : "transparent",
              color: on ? "var(--c-primaryInk)" : "var(--c-muted)",
            }}
          >
            {lbl}
          </button>
        );
      })}
    </div>
  );
}
