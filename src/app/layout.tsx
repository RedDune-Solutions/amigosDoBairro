import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Providers } from "./providers";
import { SITE_URL } from "@/lib/site";

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

const description =
  "Café & Snack-Bar Os Amigos do Bairro, em Quelfes (Olhão). Junta-te ao clube de fidelização: acumula pontos a cada visita, troca por recompensas, raspadinhas e reserva a tua mesa. Pequenos-almoços, sandes em pão caseiro, pastéis e pratos do dia.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Os Amigos do Bairro — Café & Snack-Bar em Quelfes, Olhão",
    template: "%s · Os Amigos do Bairro",
  },
  description,
  applicationName: "Os Amigos do Bairro",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Amigos do Bairro", statusBarStyle: "default" },
  alternates: { canonical: "/" },
  keywords: [
    "café Quelfes", "snack-bar Olhão", "café Olhão", "pequeno-almoço Olhão",
    "Os Amigos do Bairro", "café Algarve", "cartão de fidelização café",
    "pastéis de nata Olhão", "sandes pão caseiro", "pratos do dia Olhão",
  ],
  authors: [{ name: "Os Amigos do Bairro" }],
  category: "food",
  openGraph: {
    type: "website",
    locale: "pt_PT",
    url: "/",
    siteName: "Os Amigos do Bairro",
    title: "Os Amigos do Bairro — Café & Snack-Bar em Quelfes, Olhão",
    description,
  },
  twitter: { card: "summary_large_image", title: "Os Amigos do Bairro", description },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/favicon.ico", sizes: "any" }],
    apple: [{ url: "/icon.svg" }],
  },
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
