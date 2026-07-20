/**
 * Extrai o path dentro do bucket a partir de um URL público do Storage
 * (ex.: https://xxx.supabase.co/storage/v1/object/public/menu/abc.jpg?t=123 → "abc.jpg").
 * Devolve null se o URL não pertencer ao bucket indicado.
 */
export function storagePathFromPublicUrl(url: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  const path = url.slice(i + marker.length).split("?")[0];
  return path ? decodeURIComponent(path) : null;
}
