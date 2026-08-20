import { SITE_URL, SITE_DESCRIPTION, CAFE } from "@/lib/site";
import { CAFE_HOURS } from "@/design/data";

// llms.txt (llmstxt.org): resumo do site em texto simples para assistentes de
// AI (ChatGPT, Claude, Perplexity, …). Contactos/horário vêm da fonte única
// (site.ts + CAFE_HOURS); o texto descritivo é editorial mas tem de bater com
// o que o site afirma — nunca inventar factos novos aqui.
// Formato do spec: factos em texto livre ANTES do primeiro H2 (os H2 são
// listas de links); por isso "Factos" não é heading.
export const dynamic = "force-static";

export function GET() {
  const semana = CAFE_HOURS[1];
  const fimDeSemana = CAFE_HOURS[6];
  const body = `# ${CAFE.name}

> ${SITE_DESCRIPTION}

Factos:

- Tipo: café e snack-bar de bairro
- Morada: ${CAFE.street}, ${CAFE.postal} ${CAFE.city}, ${CAFE.region}, Algarve, Portugal
- Telefone: ${CAFE.phoneDisplay} (${CAFE.phone})
- Horário: Seg–Sex ${semana.open}–${semana.close} · Sáb–Dom ${fimDeSemana.open}–${fimDeSemana.close}
- Localização: [Google Maps](${CAFE.mapsUrl})
- Oferta: pequenos-almoços, sandes em pão caseiro, pastéis e pratos do dia
- Clube de fidelização (app web gratuita): pontos por visita via QR no balcão, recompensas, raspadinhas, cartão de carimbos e pedidos de reserva de mesa

## Páginas
- [Início](${SITE_URL}/): apresentação do café, fotos, horário e contactos
- [Entrar no clube](${SITE_URL}/registo): registo no clube de fidelização
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
