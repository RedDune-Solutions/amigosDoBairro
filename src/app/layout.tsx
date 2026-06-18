import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Os Amigos do Bairro — o teu cantinho no bairro",
  description:
    "Clube de fidelização do Café & Snack-Bar do Bairro. Acumula pontos, troca recompensas e reserva a tua mesa.",
  applicationName: "Os Amigos do Bairro",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Amigos do Bairro", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#f7efe1",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-PT"
      className={`${fraunces.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
