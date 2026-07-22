import { headers } from "next/headers";

/**
 * IP do pedido, robusto contra spoofing na Vercel.
 *
 * Preferimos `x-real-ip` — na Vercel é definido pela edge e o cliente não o
 * consegue forjar. Só na ausência dele (ex.: outro host) usamos o ÚLTIMO
 * elemento de `x-forwarded-for` (o mais próximo do nosso proxy; os elementos da
 * esquerda são controláveis pelo cliente). Fallback 'unknown' quando não há
 * cabeçalho.
 *
 * PORQUÊ: usar o PRIMEIRO elemento de `x-forwarded-for` deixava a chave de
 * rate-limit dos RPCs (signup_precheck / pw_reset_request) ser controlada pelo
 * cliente → o throttle por IP era contornável (enumeração de emails + flood).
 */
export async function getRequestIp(): Promise<string> {
  const h = await headers();
  const real = h.get("x-real-ip")?.trim();
  if (real) return real;
  const fwd = h.get("x-forwarded-for");
  if (fwd) {
    const last = fwd
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .pop();
    if (last) return last;
  }
  return "unknown";
}
