/** URL canónico do site para SEO (canonical, Open Graph, sitemap, JSON-LD).
 *  Trocável por env sem mexer no código; default = domínio oficial do café. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://osamigosdobairro.pt").replace(/\/$/, "");

/** Dados reais do café (fonte única para metadata + JSON-LD). */
export const CAFE = {
  name: "Os Amigos do Bairro",
  legalName: "Os Amigos do Bairro — Café & Snack-Bar",
  street: "R. Dâmaso da Encarnação 53C",
  postal: "8700-249",
  city: "Quelfes",
  region: "Olhão",
  country: "PT",
  phone: "+351289034275",
  phoneDisplay: "289 034 275",
  lat: 37.034983,
  lng: -7.8477932,
  mapsUrl: "https://www.google.com/maps/place/Os+Amigos+Do+Bairro/@37.034983,-7.8477932,17z",
} as const;
