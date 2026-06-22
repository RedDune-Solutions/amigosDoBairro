import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Providers } from "./providers";

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Os Amigos do Bairro · App de Fidelização",
  description:
    "Clube de fidelização do Café & Snack-Bar do Bairro. Acumula pontos, troca recompensas e reserva a tua mesa.",
  applicationName: "Os Amigos do Bairro",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Amigos do Bairro", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#fbf3e7",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-PT"
      className={`${baloo.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
