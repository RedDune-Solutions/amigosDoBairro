import { ImageResponse } from "next/og";

export const alt = "Os Amigos do Bairro — Café & Snack-Bar em Quelfes, Olhão";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #F6A93B 0%, #E2722B 60%, #C2531A 100%)",
          color: "#fff8ee",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 4, opacity: 0.9 }}>
          ☕ CAFÉ &amp; SNACK-BAR
        </div>
        <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1.05, marginTop: 16 }}>
          Os Amigos do Bairro
        </div>
        <div style={{ fontSize: 38, fontWeight: 500, marginTop: 28, maxWidth: 900, opacity: 0.95 }}>
          Junta-te ao clube: acumula pontos, troca recompensas e reserva a tua mesa.
        </div>
        <div style={{ fontSize: 30, fontWeight: 600, marginTop: 40, opacity: 0.9 }}>
          📍 Quelfes · Olhão · Algarve
        </div>
      </div>
    ),
    size,
  );
}
