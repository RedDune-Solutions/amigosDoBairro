"use client";

import {
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Icon } from "@/design/icons";
import { useI18n } from "@/design/i18n";

// ── Status bar ──────────────────────────────────────────────────────────────
export function StatusBar({ dark = false }: { dark?: boolean }) {
  const c = dark ? "#fff" : "#1d1a16";
  return (
    <div
      style={{
        height: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px 0 32px",
        position: "relative",
        zIndex: 20,
        flexShrink: 0,
      }}
    >
      <span style={{ fontFamily: "var(--f-body)", fontWeight: 800, fontSize: 16, color: c, letterSpacing: 0.2 }}>
        9:41
      </span>
      <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
        <svg width="18" height="12" viewBox="0 0 18 12">
          <g fill={c}>
            <rect x="0" y="7" width="3" height="5" rx="0.7" />
            <rect x="5" y="4.5" width="3" height="7.5" rx="0.7" />
            <rect x="10" y="2" width="3" height="10" rx="0.7" />
            <rect x="15" y="0" width="3" height="12" rx="0.7" />
          </g>
        </svg>
        <svg width="16" height="12" viewBox="0 0 17 12" fill={c}>
          <path d="M8.5 3.2C10.8 3.2 12.9 4.1 14.4 5.6L15.5 4.5C13.7 2.7 11.2 1.5 8.5 1.5S3.3 2.7 1.5 4.5L2.6 5.6C4.1 4.1 6.2 3.2 8.5 3.2Z" />
          <path d="M8.5 6.8C9.9 6.8 11.1 7.3 12 8.2L13.1 7.1C11.8 5.9 10.2 5.1 8.5 5.1S5.2 5.9 3.9 7.1L5 8.2C5.9 7.3 7.1 6.8 8.5 6.8Z" />
          <circle cx="8.5" cy="10.5" r="1.4" />
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12">
          <rect x="0.5" y="0.5" width="21" height="11" rx="3" stroke={c} strokeOpacity="0.4" fill="none" />
          <rect x="2" y="2" width="16" height="8" rx="1.8" fill={c} />
          <path d="M23 4v4c.7-.3 1.2-1 1.2-2S23.7 4.3 23 4Z" fill={c} fillOpacity="0.5" />
        </svg>
      </div>
    </div>
  );
}

// ── Phone frame ──────────────────────────────────────────────────────────────
export function PhoneFrame({
  children,
  statusDark = false,
  bg,
}: {
  children: ReactNode;
  statusDark?: boolean;
  bg?: string;
}) {
  return (
    <div
      style={{
        width: 390,
        height: 844,
        borderRadius: 52,
        position: "relative",
        background: "#0f0d0a",
        padding: 5,
        flexShrink: 0,
        boxShadow: "0 50px 90px -20px rgba(40,30,10,0.45), 0 0 0 1px rgba(0,0,0,0.2)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 5,
          borderRadius: 47,
          overflow: "hidden",
          background: bg || "var(--c-bg)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 11,
            left: "50%",
            transform: "translateX(-50%)",
            width: 116,
            height: 33,
            borderRadius: 20,
            background: "#0c0a08",
            zIndex: 60,
          }}
        />
        <StatusBar dark={statusDark} />
        {children}
        <div
          style={{
            position: "absolute",
            bottom: 7,
            left: 0,
            right: 0,
            zIndex: 60,
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: 132,
              height: 5,
              borderRadius: 100,
              background: statusDark ? "rgba(255,255,255,0.6)" : "rgba(40,30,15,0.28)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Stage responsivo: em ecrã grande mostra o PhoneFrame centrado (como o design);
 * em telemóvel ocupa o ecrã todo (app real). children = conteúdo do ecrã.
 */
export function Stage({
  children,
  statusDark = false,
}: {
  children: ReactNode;
  statusDark?: boolean;
}) {
  const [mode, setMode] = useState<"phone" | "full" | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const fit = () => {
      const big = window.innerWidth >= 460 && window.innerHeight >= 560;
      setMode(big ? "phone" : "full");
      if (big) {
        const s = Math.min((window.innerWidth - 32) / 390, (window.innerHeight - 32) / 844, 1.05);
        setScale(Math.max(0.5, s));
      }
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  if (mode === null) {
    return <div style={{ minHeight: "100dvh" }} />;
  }

  if (mode === "full") {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: "var(--c-bg)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}>
        <PhoneFrame statusDark={statusDark}>{children}</PhoneFrame>
      </div>
    </div>
  );
}

// ── Top bar ──────────────────────────────────────────────────────────────────
export function TopBar({
  title,
  onBack,
  right,
}: {
  title: ReactNode;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 18px 14px", flexShrink: 0 }}>
      {onBack && (
        <button
          onClick={onBack}
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            border: "1px solid var(--c-line)",
            background: "var(--c-surface)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--c-ink)",
            flexShrink: 0,
          }}
        >
          <Icon name="chevronLeft" size={20} stroke={2.4} />
        </button>
      )}
      <h1
        style={{
          margin: 0,
          fontFamily: "var(--f-display)",
          fontWeight: 700,
          fontSize: 24,
          color: "var(--c-ink)",
          flex: 1,
          letterSpacing: -0.3,
        }}
      >
        {title}
      </h1>
      {right}
    </div>
  );
}

// ── Tab bar ──────────────────────────────────────────────────────────────────
export const TABS = [
  { id: "home", icon: "home", tkey: "tab.home" },
  { id: "card", icon: "star", tkey: "tab.card" },
  { id: "reservations", icon: "calendar", tkey: "tab.reservations" },
  { id: "menu", icon: "menu", tkey: "tab.menu" },
  { id: "profile", icon: "user", tkey: "tab.profile" },
] as const;

export function TabBar({
  active,
  onChange,
}: {
  active: string;
  onChange: (id: string) => void;
}) {
  const { T } = useI18n();
  return (
    <div
      style={{
        flexShrink: 0,
        display: "flex",
        padding: "8px 8px 26px",
        background: "var(--c-surface)",
        borderTop: "1px solid var(--c-line)",
      }}
    >
      {TABS.map((t) => {
        const on = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              flex: 1,
              border: "none",
              background: "none",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "6px 0",
              color: on ? "var(--c-primary)" : "var(--c-muted)",
            }}
          >
            <Icon
              name={t.icon}
              size={23}
              stroke={on ? 2.4 : 2}
              fill={on ? "color-mix(in srgb, var(--c-primary) 16%, transparent)" : "none"}
            />
            <span style={{ fontFamily: "var(--f-body)", fontSize: 11, fontWeight: on ? 800 : 600 }}>
              {T(t.tkey) as string}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Scroll ───────────────────────────────────────────────────────────────────
export function Scroll({
  children,
  pad = 18,
  style,
}: {
  children: ReactNode;
  pad?: number;
  style?: CSSProperties;
}) {
  return (
    <div className="om-scroll" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: `0 ${pad}px`, ...style }}>
      {children}
      <div style={{ height: 16 }} />
    </div>
  );
}

// ── Button ───────────────────────────────────────────────────────────────────
type BtnVariant = "primary" | "dark" | "soft" | "outline" | "ghost";
export function Button({
  children,
  onClick,
  variant = "primary",
  full,
  size = "md",
  icon,
  style,
  accent,
  type,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  full?: boolean;
  size?: "sm" | "md" | "lg";
  icon?: string;
  style?: CSSProperties;
  accent?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontFamily: "var(--f-display)",
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    borderRadius: 16,
    border: "1px solid transparent",
    width: full ? "100%" : undefined,
    fontSize: size === "lg" ? 18 : size === "sm" ? 14 : 16,
    padding: size === "lg" ? "16px 22px" : size === "sm" ? "9px 14px" : "13px 20px",
    transition: "transform .12s, filter .12s",
    WebkitTapHighlightColor: "transparent",
    whiteSpace: "nowrap",
    lineHeight: 1.1,
    opacity: disabled ? 0.6 : 1,
  };
  const c = accent || "var(--c-primary)";
  const variants: Record<BtnVariant, CSSProperties> = {
    primary: { background: c, color: "#fff", boxShadow: "0 8px 20px -8px color-mix(in srgb, var(--c-primary) 60%, transparent)" },
    dark: { background: "var(--c-ink)", color: "#fff" },
    soft: { background: `color-mix(in srgb, ${c} 14%, var(--c-surface))`, color: c },
    outline: { background: "var(--c-surface)", color: "var(--c-ink)", border: "1px solid var(--c-line)" },
    ghost: { background: "transparent", color: c },
  };
  return (
    <button
      type={type || "button"}
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {icon && <Icon name={icon} size={size === "lg" ? 20 : 18} stroke={2.2} />}
      {children}
    </button>
  );
}

// ── Card / tiles / chips ─────────────────────────────────────────────────────
export function Card({
  children,
  style,
  pad = 18,
  onClick,
}: {
  children: ReactNode;
  style?: CSSProperties;
  pad?: number;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--c-surface)",
        borderRadius: 22,
        padding: pad,
        border: "1px solid var(--c-line)",
        boxShadow: "0 1px 2px rgba(40,30,10,0.04)",
        cursor: onClick ? "pointer" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function IconTile({
  icon,
  accent = "var(--c-primary)",
  size = 52,
  radius = 16,
  iconSize,
}: {
  icon: string;
  accent?: string;
  size?: number;
  radius?: number;
  iconSize?: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        flexShrink: 0,
        background: `color-mix(in srgb, ${accent} 16%, var(--c-surface))`,
        color: accent,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name={icon} size={iconSize || size * 0.46} stroke={2.1} />
    </div>
  );
}

export function Chip({
  children,
  active,
  onClick,
  accent = "var(--c-primary)",
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  accent?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0,
        padding: "9px 15px",
        borderRadius: 13,
        cursor: "pointer",
        fontFamily: "var(--f-body)",
        fontWeight: 700,
        fontSize: 13.5,
        border: active ? "1px solid transparent" : "1px solid var(--c-line)",
        background: active ? accent : "var(--c-surface)",
        color: active ? "#fff" : "var(--c-muted)",
        whiteSpace: "nowrap",
        transition: "all .15s",
      }}
    >
      {children}
    </button>
  );
}

// ── Logo + stamp ─────────────────────────────────────────────────────────────
export function LogoBadge({ size = 64, ring = true }: { size?: number; ring?: boolean }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#fff",
        overflow: "hidden",
        flexShrink: 0,
        border: ring ? "3px solid #fff" : "none",
        boxShadow: "0 6px 18px -6px rgba(40,30,10,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.jpeg"
        alt="Os Amigos do Bairro"
        style={{ width: "128%", height: "128%", objectFit: "cover", objectPosition: "center 42%" }}
      />
    </div>
  );
}

export function Stamp({ filled, idx }: { filled?: boolean; idx?: number }) {
  return (
    <div
      style={{
        aspectRatio: "1",
        borderRadius: "50%",
        border: filled
          ? "2px solid transparent"
          : "2px dashed color-mix(in srgb, var(--c-primary) 40%, var(--c-line))",
        background: filled ? "var(--c-primary)" : "color-mix(in srgb, var(--c-primary) 6%, var(--c-surface))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: filled ? "#fff" : "color-mix(in srgb, var(--c-primary) 50%, var(--c-muted))",
      }}
    >
      {filled ? (
        <Icon name="coffee" size={20} stroke={2.2} />
      ) : (
        <span style={{ fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 14, opacity: 0.7 }}>{idx}</span>
      )}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--f-body)",
        fontWeight: 800,
        fontSize: 12,
        letterSpacing: 1,
        textTransform: "uppercase",
        color: "var(--c-muted)",
      }}
    >
      {children}
    </div>
  );
}

// ── Field (input) ────────────────────────────────────────────────────────────
export function Field({
  label,
  placeholder,
  icon,
  name,
  type,
  defaultValue,
  required,
  autoComplete,
}: {
  label: string;
  placeholder?: string;
  icon: string;
  name?: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 13, color: "var(--c-ink)", marginBottom: 6 }}>
        {label}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 14px",
          height: 50,
          background: "var(--c-surface)",
          border: "1px solid var(--c-line)",
          borderRadius: 15,
        }}
      >
        <Icon name={icon} size={18} color="var(--c-muted)" />
        <input
          name={name}
          type={type || "text"}
          placeholder={placeholder}
          defaultValue={defaultValue}
          required={required}
          autoComplete={autoComplete}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            fontFamily: "var(--f-body)",
            fontSize: 15,
            color: "var(--c-ink)",
            minWidth: 0,
          }}
        />
      </div>
    </label>
  );
}
