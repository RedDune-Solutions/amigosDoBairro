"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/data";

async function assertAdmin() {
  const { profile } = await getProfile();
  if (!profile || profile.role !== "admin") throw new Error("forbidden");
}

const addSchema = z.object({
  titulo_pt: z.string().trim().min(2, "Título demasiado curto.").max(80),
  titulo_en: z.string().trim().max(80).optional().or(z.literal("")),
  desc_pt: z.string().trim().max(160).optional().or(z.literal("")),
  desc_en: z.string().trim().max(160).optional().or(z.literal("")),
  icon: z.string().max(20).optional(),
  accent: z.enum(["primary", "green", "blue", "red"]).optional(),
});

export async function addNews(
  input: z.input<typeof addSchema>,
): Promise<{ ok?: boolean; error?: string }> {
  await assertAdmin();
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const d = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("news").insert({
    titulo_pt: d.titulo_pt,
    titulo_en: d.titulo_en || null,
    desc_pt: d.desc_pt || null,
    desc_en: d.desc_en || null,
    icon: d.icon || "sparkle",
    accent: d.accent || "primary",
  });
  if (error) return { error: "Não foi possível adicionar." };
  return { ok: true };
}

export async function setNewsActive(id: string, ativo: boolean): Promise<{ ok?: boolean; error?: string }> {
  await assertAdmin();
  if (!z.string().uuid().safeParse(id).success) return { error: "Inválido." };
  const supabase = await createClient();
  const { error } = await supabase.from("news").update({ ativo }).eq("id", id);
  if (error) return { error: "Não foi possível guardar." };
  return { ok: true };
}

export async function removeNews(id: string): Promise<{ ok?: boolean; error?: string }> {
  await assertAdmin();
  if (!z.string().uuid().safeParse(id).success) return { error: "Inválido." };
  const supabase = await createClient();
  const { error } = await supabase.from("news").delete().eq("id", id);
  if (error) return { error: "Não foi possível remover." };
  return { ok: true };
}
