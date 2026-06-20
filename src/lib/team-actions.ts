"use server";

import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/data";

async function assertAdmin() {
  const { profile } = await getProfile();
  if (!profile || profile.role !== "admin") throw new Error("forbidden");
}

const emailSchema = z.string().trim().email();

/** Convida alguém para staff: promove se já existe, senão envia convite por email. */
export async function inviteStaff(
  rawEmail: string,
  nome?: string,
): Promise<{ ok?: boolean; promoted?: boolean; invited?: boolean; error?: string }> {
  await assertAdmin();
  const parsed = emailSchema.safeParse(rawEmail);
  if (!parsed.success) return { error: "Email inválido." };
  const email = parsed.data.toLowerCase();

  const svc = createServiceClient();
  // procurar utilizador existente com este email
  const { data: list } = await svc.auth.admin.listUsers();
  const existing = (list?.users ?? []).find(
    (u: { email?: string | null; id: string }) => (u.email ?? "").toLowerCase() === email,
  );

  if (existing) {
    const supabase = await createClient();
    const { error } = await supabase.rpc("definir_role", { p_user: existing.id, p_role: "staff" });
    if (error) return { error: error.message?.includes("principal") ? "Não é possível alterar essa conta." : "Não foi possível promover." };
    return { ok: true, promoted: true };
  }

  // não existe → convite por email + registo do convite pendente
  const { error: invErr } = await svc.auth.admin.inviteUserByEmail(email, {
    data: nome ? { nome } : undefined,
  });
  if (invErr) return { error: "Não foi possível enviar o convite." };
  const supabase = await createClient();
  await supabase.from("staff_invites").upsert({ email, role: "staff" });
  return { ok: true, invited: true };
}

const roleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["customer", "staff", "admin"]),
});

export async function setRole(
  userId: string,
  role: "customer" | "staff" | "admin",
): Promise<{ ok?: boolean; error?: string }> {
  await assertAdmin();
  const parsed = roleSchema.safeParse({ userId, role });
  if (!parsed.success) return { error: "Dados inválidos." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("definir_role", { p_user: parsed.data.userId, p_role: parsed.data.role });
  if (error) {
    const m = error.message ?? "";
    return {
      error: m.includes("principal")
        ? "A conta principal não pode ser alterada."
        : m.includes("administradores")
          ? "Só a conta principal pode criar administradores."
          : "Não foi possível alterar.",
    };
  }
  return { ok: true };
}

export async function removeMember(userId: string): Promise<{ ok?: boolean; error?: string }> {
  return setRole(userId, "customer");
}

export async function cancelInvite(email: string): Promise<{ ok?: boolean; error?: string }> {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("staff_invites").delete().eq("email", email.toLowerCase());
  if (error) return { error: "Não foi possível cancelar." };
  return { ok: true };
}
