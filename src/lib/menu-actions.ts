"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/data";
import type { MenuCatRow, FoodCategory, FoodPrefStat } from "@/design/data";

async function assertAdmin() {
  const { profile } = await getProfile();
  if (!profile || profile.role !== "admin") throw new Error("forbidden");
}

// ---------- Leitura (server components) -------------------------------------

/** Menu completo (categorias + itens) ordenado. Para clientes e admin. */
export async function getMenu(): Promise<MenuCatRow[]> {
  const supabase = await createClient();
  const { data: cats } = await supabase
    .from("menu_categories")
    .select("id, label_pt, label_en, icon, accent, ordem")
    .order("ordem", { ascending: true });
  if (!cats || cats.length === 0) return [];
  const { data: items } = await supabase
    .from("menu_items")
    .select("id, category_id, name_pt, name_en, desc_pt, desc_en, price, ordem")
    .order("ordem", { ascending: true });
  return (cats as { id: string; label_pt: string; label_en: string | null; icon: string; accent: string }[]).map((c) => ({
    id: c.id,
    label_pt: c.label_pt,
    label_en: c.label_en,
    icon: c.icon,
    accent: c.accent,
    items: (items ?? [])
      .filter((it) => (it.category_id as string) === c.id)
      .map((it) => ({
        id: it.id as string,
        name_pt: it.name_pt as string,
        name_en: it.name_en as string | null,
        desc_pt: it.desc_pt as string | null,
        desc_en: it.desc_en as string | null,
        price: it.price as string,
      })),
  }));
}

/** Opções de comida activas (dropdown do registo). */
export async function getFoodCategories(activeOnly = true): Promise<FoodCategory[]> {
  const supabase = await createClient();
  let q = supabase.from("food_categories").select("id, slug, label_pt, label_en, ordem, ativo").order("ordem", { ascending: true });
  if (activeOnly) q = q.eq("ativo", true);
  const { data } = await q;
  return (data ?? []) as FoodCategory[];
}

/** Agregado de preferências para o gráfico (admin). */
export async function getFoodPrefStats(): Promise<FoodPrefStat[]> {
  const supabase = await createClient();
  const [{ data: cats }, { data: profs }] = await Promise.all([
    supabase.from("food_categories").select("slug, label_pt, ordem").order("ordem", { ascending: true }),
    supabase.from("profiles").select("food_pref").eq("role", "customer"),
  ]);
  const counts = new Map<string, number>();
  for (const p of (profs ?? []) as { food_pref: string | null }[]) {
    if (p.food_pref) counts.set(p.food_pref, (counts.get(p.food_pref) ?? 0) + 1);
  }
  return ((cats ?? []) as { slug: string; label_pt: string }[]).map((c) => ({
    slug: c.slug,
    label: c.label_pt,
    count: counts.get(c.slug) ?? 0,
  }));
}

// ---------- CRUD Menu (admin) -----------------------------------------------

const catSchema = z.object({
  id: z.string().uuid(),
  label_pt: z.string().trim().max(60).optional(),
  label_en: z.string().trim().max(60).optional(),
  icon: z.string().max(20).optional(),
  accent: z.enum(["primary", "green", "blue", "red"]).optional(),
});

export async function patchMenuCategory(input: z.input<typeof catSchema>): Promise<{ ok?: boolean; error?: string }> {
  await assertAdmin();
  const parsed = catSchema.safeParse(input);
  if (!parsed.success) return { error: "Dados inválidos." };
  const { id, ...fields } = parsed.data;
  if (Object.keys(fields).length === 0) return { ok: true };
  const supabase = await createClient();
  const { error } = await supabase.from("menu_categories").update(fields).eq("id", id);
  if (error) return { error: "Não foi possível guardar." };
  return { ok: true };
}

export async function addMenuCategory(): Promise<{ id?: string; error?: string }> {
  await assertAdmin();
  const supabase = await createClient();
  const { data: last } = await supabase.from("menu_categories").select("ordem").order("ordem", { ascending: false }).limit(1).maybeSingle();
  const ordem = ((last?.ordem as number) ?? 0) + 1;
  const { data, error } = await supabase
    .from("menu_categories")
    .insert({ label_pt: "Nova categoria", label_en: "New category", icon: "coffee", accent: "primary", ordem })
    .select("id")
    .single();
  if (error) return { error: "Não foi possível adicionar." };
  return { id: data.id as string };
}

export async function removeMenuCategory(id: string): Promise<{ ok?: boolean; error?: string }> {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("menu_categories").delete().eq("id", id);
  if (error) return { error: "Não foi possível remover." };
  return { ok: true };
}

const itemSchema = z.object({
  id: z.string().uuid(),
  name_pt: z.string().trim().max(80).optional(),
  name_en: z.string().trim().max(80).optional(),
  desc_pt: z.string().trim().max(160).optional(),
  desc_en: z.string().trim().max(160).optional(),
  price: z.string().trim().max(12).optional(),
});

export async function patchMenuItem(input: z.input<typeof itemSchema>): Promise<{ ok?: boolean; error?: string }> {
  await assertAdmin();
  const parsed = itemSchema.safeParse(input);
  if (!parsed.success) return { error: "Dados inválidos." };
  const { id, ...fields } = parsed.data;
  if (Object.keys(fields).length === 0) return { ok: true };
  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").update(fields).eq("id", id);
  if (error) return { error: "Não foi possível guardar." };
  return { ok: true };
}

export async function addMenuItem(categoryId: string): Promise<{ id?: string; error?: string }> {
  await assertAdmin();
  const supabase = await createClient();
  const { data: last } = await supabase.from("menu_items").select("ordem").eq("category_id", categoryId).order("ordem", { ascending: false }).limit(1).maybeSingle();
  const ordem = ((last?.ordem as number) ?? 0) + 1;
  const { data, error } = await supabase
    .from("menu_items")
    .insert({ category_id: categoryId, name_pt: "Novo item", name_en: "New item", price: "0,00", ordem })
    .select("id")
    .single();
  if (error) return { error: "Não foi possível adicionar." };
  return { id: data.id as string };
}

export async function removeMenuItem(id: string): Promise<{ ok?: boolean; error?: string }> {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").delete().eq("id", id);
  if (error) return { error: "Não foi possível remover." };
  return { ok: true };
}

// ---------- CRUD opções de comida (admin) -----------------------------------

const foodSchema = z.object({
  id: z.string().uuid(),
  label_pt: z.string().trim().max(40).optional(),
  label_en: z.string().trim().max(40).optional(),
  ativo: z.boolean().optional(),
});

export async function patchFoodCategory(input: z.input<typeof foodSchema>): Promise<{ ok?: boolean; error?: string }> {
  await assertAdmin();
  const parsed = foodSchema.safeParse(input);
  if (!parsed.success) return { error: "Dados inválidos." };
  const { id, ...fields } = parsed.data;
  if (Object.keys(fields).length === 0) return { ok: true };
  const supabase = await createClient();
  const { error } = await supabase.from("food_categories").update(fields).eq("id", id);
  if (error) return { error: "Não foi possível guardar." };
  return { ok: true };
}

export async function addFoodCategory(): Promise<{ id?: string; error?: string }> {
  await assertAdmin();
  const supabase = await createClient();
  const { data: last } = await supabase.from("food_categories").select("ordem").order("ordem", { ascending: false }).limit(1).maybeSingle();
  const ordem = ((last?.ordem as number) ?? 0) + 1;
  const slug = "op_" + Date.now().toString(36);
  const { data, error } = await supabase
    .from("food_categories")
    .insert({ slug, label_pt: "Nova opção", label_en: "New option", ordem, ativo: true })
    .select("id")
    .single();
  if (error) return { error: "Não foi possível adicionar." };
  return { id: data.id as string };
}

export async function removeFoodCategory(id: string): Promise<{ ok?: boolean; error?: string }> {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("food_categories").delete().eq("id", id);
  if (error) return { error: "Não foi possível remover." };
  return { ok: true };
}
