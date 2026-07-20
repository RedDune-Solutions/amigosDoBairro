"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/data";
import { storagePathFromPublicUrl } from "@/lib/storage-path";
import type { LandingPhoto, LandingPhotos } from "@/design/data";

async function assertAdmin() {
  const { profile } = await getProfile();
  if (!profile || profile.role !== "admin") throw new Error("forbidden");
}

/** Revalida tanto a landing pública como o painel admin após uma alteração. */
function revalidate() {
  revalidatePath("/");
  revalidatePath("/admin");
}

// ---------- Leitura (landing pública + admin) -------------------------------

/** Fotos da landing agrupadas por secção, ordenadas. Leitura pública (anon). */
export async function getLandingPhotos(): Promise<LandingPhotos> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("landing_photos")
    .select("id, section, image_url, label_pt, label_en, ordem")
    .order("ordem", { ascending: true });
  const rows = (data ?? []) as LandingPhoto[];
  return {
    espaco: rows.filter((r) => r.section === "espaco"),
    comida: rows.filter((r) => r.section === "comida"),
  };
}

// ---------- CRUD (admin) ----------------------------------------------------

const addSchema = z.object({
  section: z.enum(["espaco", "comida"]),
  image_url: z.string().trim().min(1).max(600),
});

/** Cria uma foto no fim da secção (a admin já fez upload e passa o image_url). */
export async function addLandingPhoto(input: z.input<typeof addSchema>): Promise<{ id?: string; error?: string }> {
  await assertAdmin();
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { error: "Dados inválidos." };
  const { section, image_url } = parsed.data;
  const supabase = await createClient();
  const { data: last } = await supabase
    .from("landing_photos")
    .select("ordem")
    .eq("section", section)
    .order("ordem", { ascending: false })
    .limit(1)
    .maybeSingle();
  const ordem = ((last?.ordem as number) ?? 0) + 1;
  const { data, error } = await supabase
    .from("landing_photos")
    .insert({ section, image_url, ordem })
    .select("id")
    .single();
  if (error) return { error: "Não foi possível adicionar." };
  revalidate();
  return { id: data.id as string };
}

const patchSchema = z.object({
  id: z.string().uuid(),
  image_url: z.string().trim().min(1).max(600).optional(),
  label_pt: z.string().trim().max(60).nullable().optional(),
  label_en: z.string().trim().max(60).nullable().optional(),
});

export async function patchLandingPhoto(input: z.input<typeof patchSchema>): Promise<{ ok?: boolean; error?: string }> {
  await assertAdmin();
  const parsed = patchSchema.safeParse(input);
  if (!parsed.success) return { error: "Dados inválidos." };
  const { id, ...fields } = parsed.data;
  if (Object.keys(fields).length === 0) return { ok: true };
  const supabase = await createClient();
  const { error } = await supabase.from("landing_photos").update(fields).eq("id", id);
  if (error) return { error: "Não foi possível guardar." };
  revalidate();
  return { ok: true };
}

export async function removeLandingPhoto(id: string): Promise<{ ok?: boolean; error?: string }> {
  await assertAdmin();
  const supabase = await createClient();
  const { data: row } = await supabase.from("landing_photos").select("image_url").eq("id", id).maybeSingle();
  const { error } = await supabase.from("landing_photos").delete().eq("id", id);
  if (error) return { error: "Não foi possível remover." };
  // Limpeza best-effort do ficheiro no storage (a linha já foi apagada).
  const path = row?.image_url ? storagePathFromPublicUrl(row.image_url as string, "landing") : null;
  if (path) await supabase.storage.from("landing").remove([path]);
  revalidate();
  return { ok: true };
}
