"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/design/icons";
import { useI18n, LangToggle } from "@/design/i18n";
import { Scroll, Card, IconTile, Button, LogoBadge, SectionLabel } from "@/design/ui";

const MARQUEE_TOP = [
  { icon: "coffee", from: "#E8A14C", to: "#C9772A" },
  { icon: "cake", from: "#E67E73", to: "#C2503F" },
  { icon: "plate", from: "#7BB88C", to: "#4E9468" },
  { icon: "sandwich", from: "#6FA8C9", to: "#3E7FA6" },
];
const MARQUEE_BOTTOM = [
  { icon: "star", from: "#D8A24A", to: "#A8761E" },
  { icon: "gift", from: "#B98AC9", to: "#8A5BA6" },
  { icon: "coffee", from: "#E0905A", to: "#B5632A" },
  { icon: "cake", from: "#E8B05C", to: "#C98A2A" },
];

function MarqueeRow({ tiles, dir }: { tiles: typeof MARQUEE_TOP; dir: "left" | "right" }) {
  const loop = [...tiles, ...tiles];
  return (
    <div style={{ overflow: "hidden", width: "100%" }}>
      <div
        style={{
          display: "flex",
          gap: 8,
          width: "max-content",
          animation: `${dir === "left" ? "omMarqueeL" : "omMarqueeR"} 22s linear infinite`,
        }}
      >
        {loop.map((s, i) => (
          <div
            key={i}
            style={{
              flex: "0 0 auto",
              width: 128,
              height: 88,
              borderRadius: 14,
              overflow: "hidden",
              background: `linear-gradient(140deg, ${s.from}, ${s.to})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -18,
                right: -12,
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.14)",
              }}
            />
            <Icon name={s.icon} size={40} stroke={1.7} color="rgba(255,255,255,0.92)" />
          </div>
        ))}
      </div>
    </div>
  );
}

function PhotoCarousel() {
  return (
    <div style={{ marginTop: 22, marginLeft: -24, marginRight: -24, display: "flex", flexDirection: "column", gap: 8 }}>
      <MarqueeRow tiles={MARQUEE_TOP} dir="left" />
      <MarqueeRow tiles={MARQUEE_BOTTOM} dir="right" />
    </div>
  );
}

export function Landing() {
  const router = useRouter();
  const { T, L, lang, setLang } = useI18n();
  const title = T("land.title") as string[];
  const hoursVal = T("land.hoursVal") as string[];
  const whereVal = T("land.whereVal") as string[];

  const features = [
    { icon: "star", accent: "var(--c-primary)", title: T("land.f1.t") as string, desc: T("land.f1.d") as string },
    { icon: "gift", accent: "var(--c-red)", title: T("land.f2.t") as string, desc: T("land.f2.d") as string },
    { icon: "calendar", accent: "var(--c-green)", title: T("land.f3.t") as string, desc: T("land.f3.d") as string },
  ];

  const house = [
    { n: { pt: "Pastel de nata", en: "Custard tart" }, p: "1,20", a: "var(--c-red)", i: "cake" },
    { n: { pt: "Galão", en: "Latte" }, p: "1,40", a: "var(--c-primary)", i: "coffee" },
    { n: { pt: "Tosta mista", en: "Ham & cheese toastie" }, p: "2,50", a: "var(--c-blue)", i: "sandwich" },
    { n: { pt: "Prato do dia", en: "Dish of the day" }, p: "7,50", a: "var(--c-green)", i: "plate" },
  ];

  return (
    <>
      <Scroll pad={0} style={{ paddingBottom: 0 }}>
        {/* Hero */}
        <div
          style={{
            position: "relative",
            padding: "8px 24px 30px",
            textAlign: "center",
            background:
              "linear-gradient(170deg, color-mix(in srgb, var(--c-primary) 22%, var(--c-bg)), var(--c-bg) 78%)",
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              bottom: 10,
              left: -40,
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "color-mix(in srgb, var(--c-green) 16%, transparent)",
            }}
          />
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", top: 12, right: 0, zIndex: 10 }}>
              <LangToggle value={lang} onChange={setLang} flags />
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
              <LogoBadge size={132} />
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                marginTop: 18,
                padding: "6px 13px",
                background: "var(--c-surface)",
                borderRadius: 100,
                border: "1px solid var(--c-line)",
                fontFamily: "var(--f-body)",
                fontWeight: 800,
                fontSize: 12,
                color: "var(--c-primary)",
                letterSpacing: 0.3,
              }}
            >
              <Icon name="mapPin" size={14} stroke={2.4} /> {T("land.badge") as string}
            </div>
            <h1
              style={{
                margin: "14px 0 0",
                fontFamily: "var(--f-display)",
                fontWeight: 800,
                fontSize: 33,
                lineHeight: 1.05,
                color: "var(--c-ink)",
                letterSpacing: -0.5,
              }}
            >
              {title[0]}
              <br />
              {title[1]}
            </h1>
            <p
              style={{
                margin: "12px auto 18px",
                maxWidth: 290,
                fontFamily: "var(--f-body)",
                fontSize: 15.5,
                lineHeight: 1.5,
                color: "var(--c-muted)",
              }}
            >
              {T("land.sub") as string}
            </p>
            <PhotoCarousel />
          </div>
        </div>

        {/* Features */}
        <div style={{ padding: "26px 18px 6px" }}>
          <SectionLabel>{T("land.why") as string}</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 12 }}>
            {features.map((f) => (
              <Card key={f.title} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <IconTile icon={f.icon} accent={f.accent} size={50} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 16.5, color: "var(--c-ink)" }}>
                    {f.title}
                  </div>
                  <div style={{ fontFamily: "var(--f-body)", fontSize: 13.5, color: "var(--c-muted)", marginTop: 1 }}>
                    {f.desc}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Da nossa casa */}
        <div style={{ padding: "20px 0 6px" }}>
          <div style={{ padding: "0 18px" }}>
            <SectionLabel>{T("land.house") as string}</SectionLabel>
          </div>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", padding: "12px 18px 4px" }} className="om-scroll">
            {house.map((it) => (
              <div key={it.i} style={{ width: 116, flexShrink: 0 }}>
                <div
                  style={{
                    height: 96,
                    borderRadius: 18,
                    background: `color-mix(in srgb, ${it.a} 16%, var(--c-surface))`,
                    border: "1px solid var(--c-line)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: it.a,
                  }}
                >
                  <Icon name={it.i} size={42} stroke={1.9} />
                </div>
                <div style={{ fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 14, color: "var(--c-ink)", marginTop: 7 }}>
                  {L(it.n)}
                </div>
                <div style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 13, color: "var(--c-muted)" }}>
                  {it.p} €
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Visita-nos */}
        <div style={{ padding: "20px 18px 0" }}>
          <SectionLabel>{T("land.visit") as string}</SectionLabel>
          <Card style={{ padding: 0, overflow: "hidden", marginTop: 12 }}>
            <a
              href="https://www.google.com/maps/place/Os+Amigos+Do+Bairro/@37.034983,-7.8477932,17z"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "block", position: "relative", lineHeight: 0 }}
            >
              <iframe
                title="Google Maps"
                src="https://www.google.com/maps?q=R.%20D%C3%A2maso%20da%20Encarna%C3%A7%C3%A3o%2053C%2C%208700-247%20Quelfes&z=16&output=embed"
                style={{ width: "100%", height: 168, border: "none", display: "block", filter: "saturate(1.05)", pointerEvents: "none" }}
                loading="lazy"
              />
              <div
                style={{
                  position: "absolute",
                  right: 12,
                  bottom: 12,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "8px 13px",
                  borderRadius: 100,
                  background: "var(--c-surface)",
                  border: "1px solid var(--c-line)",
                  boxShadow: "0 4px 14px rgba(40,30,10,0.16)",
                  fontFamily: "var(--f-display)",
                  fontWeight: 700,
                  fontSize: 12.5,
                  color: "var(--c-ink)",
                }}
              >
                <Icon name="mapPin" size={15} color="var(--c-red)" stroke={2.4} /> {T("land.openMaps") as string}
              </div>
            </a>
            <div style={{ padding: "15px 16px", display: "flex", flexDirection: "column", gap: 13 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 14.5, color: "var(--c-ink)" }}>
                  <Icon name="mapPin" size={16} color="var(--c-red)" /> {T("land.address") as string}
                </div>
                <div style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-muted)", marginTop: 4, lineHeight: 1.5 }}>
                  {whereVal[0]}
                  <br />
                  {whereVal[1]}
                </div>
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 14.5, color: "var(--c-ink)" }}>
                  <Icon name="clock" size={16} color="var(--c-primary)" /> {T("land.hours") as string}
                </div>
                <div style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-muted)", marginTop: 4, lineHeight: 1.5 }}>
                  {hoursVal[0]}
                  <br />
                  {hoursVal[1]}
                </div>
              </div>
              <a
                href="tel:+351912021759"
                style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 14.5, color: "var(--c-ink)", textDecoration: "none" }}
              >
                <Icon name="phone" size={16} color="var(--c-green)" /> {T("land.phoneVal") as string}
              </a>
            </div>
          </Card>
        </div>

        <div style={{ textAlign: "center", padding: "22px 18px 24px" }}>
          <p style={{ fontFamily: "var(--f-body)", fontSize: 13, color: "var(--c-muted)", margin: 0 }}>
            {T("land.footer") as string}
          </p>
        </div>
      </Scroll>

      {/* Barra de ações fixa */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          padding: "14px 18px calc(12px + env(safe-area-inset-bottom))",
          background: "color-mix(in srgb, var(--c-surface) 82%, transparent)",
          backdropFilter: "blur(16px) saturate(1.4)",
          WebkitBackdropFilter: "blur(16px) saturate(1.4)",
          borderTop: "1px solid color-mix(in srgb, var(--c-line) 70%, transparent)",
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          boxShadow: "0 -10px 30px -12px rgba(40,30,10,0.16)",
        }}
      >
        <Button
          size="lg"
          full
          onClick={() => router.push("/registo")}
          icon="sparkle"
          style={{
            background: "linear-gradient(135deg, var(--c-primary), var(--c-red))",
            boxShadow: "0 12px 26px -10px color-mix(in srgb, var(--c-primary) 75%, transparent)",
            letterSpacing: 0.2,
          }}
        >
          {T("land.register") as string}
        </Button>
        <button
          onClick={() => router.push("/entrar")}
          style={{
            appearance: "none",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            padding: "10px 12px 2px",
            fontFamily: "var(--f-body)",
            fontSize: 14.5,
            color: "var(--c-muted)",
            whiteSpace: "nowrap",
          }}
        >
          {T("land.memberQ") as string}{" "}
          <span style={{ color: "var(--c-primary)", fontWeight: 800 }}>{T("land.memberLink") as string}</span>
        </button>
      </div>
    </>
  );
}
