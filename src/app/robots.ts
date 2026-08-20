import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Áreas privadas / de conta — não indexar.
const PRIVADAS = ["/app", "/admin", "/staff", "/entrar", "/registo", "/recuperar", "/auth"];

// Crawlers de AI search (ChatGPT, Claude, Perplexity, Gemini) com grupo próprio:
// o "*" já os permite hoje, mas o grupo explícito declara a intenção (o café
// quer aparecer em respostas de AI) e sobrevive a um futuro aperto do "*".
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVADAS },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: PRIVADAS },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
