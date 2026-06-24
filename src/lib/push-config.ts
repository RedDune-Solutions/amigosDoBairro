// Chave pública VAPID (pode ser exposta no cliente). Override por env se preciso.
export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BH0G4-0-zp3b0D50hXPjL63DCiGQRoGdvY21MGFQNqb_eODdoi8hlQ3pLHqrCfisD0rHLNne4OoWmeFpy60muC0";

/** Converte a chave VAPID base64url para o Uint8Array que o PushManager exige. */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
