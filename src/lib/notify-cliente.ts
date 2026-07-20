// Canais de notificação ao CLIENTE num só sítio — coerência por construção.
// A notificação IN-APP é criada por trigger/RPC na BD (fonte da verdade);
// este helper trata dos canais opcionais: PUSH (se o dispositivo estiver
// subscrito) e EMAIL (se profiles.email_notifs estiver ativo).
// NÃO é "use server": módulo de servidor importado por server actions/rotas.
import { createServiceClient } from "@/lib/supabase/server";
import { sendPushToUser, type PushPayload } from "@/lib/push-send";
import { sendClienteEmail } from "@/lib/email-send";

export type ClienteNotif = PushPayload & {
  /** Assunto do email; por omissão usa o título. */
  emailAssunto?: string;
};

/** Email do utilizador + preferência de email, via service client (server-only). */
async function emailSePermitido(userId: string): Promise<string | null> {
  const svc = createServiceClient();
  const { data: prof } = await svc.from("profiles").select("email_notifs").eq("id", userId).single();
  if (!prof?.email_notifs) return null;
  const { data } = await svc.auth.admin.getUserById(userId);
  return data?.user?.email ?? null;
}

/** Push (dispositivos subscritos) + email (se ativo no perfil), em paralelo.
 *  Best-effort nos dois canais — nunca falha a ação que o dispara. */
export async function notificarCliente(userId: string, n: ClienteNotif): Promise<void> {
  const pushP = sendPushToUser(userId, { title: n.title, body: n.body, url: n.url });
  const emailP = (async () => {
    const email = await emailSePermitido(userId);
    if (!email) return;
    await sendClienteEmail(email, {
      assunto: n.emailAssunto || n.title,
      titulo: n.title,
      corpo: n.body,
      ctaUrl: "https://www.osamigosdobairro.pt" + (n.url || "/app"),
      ctaLabel: "Abrir a app",
    });
  })();
  const results = await Promise.allSettled([pushP, emailP]);
  for (const r of results) {
    if (r.status === "rejected") console.error("[notificar-cliente]", r.reason);
  }
}
