import type { NextConfig } from "next";
import path from "node:path";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // câmara permitida (scanner do staff); resto bloqueado
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

// Storage do Supabase servido através do optimizador de imagens da Vercel:
// a Vercel só vai buscar cada imagem ao Supabase uma vez (por tamanho) e serve
// do cache dela — corta o egress do Supabase e converte para webp redimensionado.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  // Pin the workspace root to this project (a stray lockfile exists higher up
  // in the home dir, which would otherwise be inferred as the root).
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    // Objeto explícito (não `new URL`): o URL fixaria search:"" e os nossos URLs
    // de storage levam ?t=timestamp, que tem de continuar a passar.
    remotePatterns: supabaseUrl
      ? [
          {
            protocol: new URL(supabaseUrl).protocol === "http:" ? ("http" as const) : ("https" as const),
            hostname: new URL(supabaseUrl).hostname,
            port: new URL(supabaseUrl).port,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
    // URLs de storage são versionadas (?t=timestamp) → cache longo é seguro.
    minimumCacheTTL: 2678400, // 31 dias
    // Supabase local (127.0.0.1:54321) só em dev; em produção fica a proteção SSRF.
    ...(process.env.NODE_ENV === "development" ? { dangerouslyAllowLocalIP: true } : {}),
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
