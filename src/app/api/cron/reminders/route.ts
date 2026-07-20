import { createServiceClient } from "@/lib/supabase/server";
import { vapidReady, sendToSubs, type PushSub } from "@/lib/push-send";
import { sendClienteEmail } from "@/lib/email-send";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // web-push precisa de runtime Node

/** Data (YYYY-MM-DD) e minutos-do-dia na hora de Portugal (café em Lisboa). */
function lisbonNow(): { date: string; nowMin: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Lisbon",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, nowMin: parseInt(get("hour"), 10) * 60 + parseInt(get("minute"), 10) };
}
const toMin = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

type Svc = ReturnType<typeof createServiceClient>;
async function subsFor(svc: Svc, userId: string): Promise<PushSub[]> {
  const { data } = await svc.from("push_subscriptions").select("endpoint, p256dh, auth").eq("user_id", userId);
  return (data ?? []).map((s) => ({ endpoint: s.endpoint as string, p256dh: s.p256dh as string, auth: s.auth as string }));
}

async function handle(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET ?? "";
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("forbidden", { status: 401 });
  }

  const svc = createServiceClient();
  const { date, nowMin } = lisbonNow();
  const { data: rows } = await svc
    .from("reservations")
    .select("id, user_id, hora, lembrete_dia_at, lembrete_30_at")
    .eq("estado", "confirmada")
    .eq("data", date);

  // Lembrete em 3 canais (coerência, auditoria 2026-07-20): in-app fica sempre
  // na app; push se houver dispositivos subscritos; email se email_notifs ativo.
  // Best-effort por canal — a flag de idempotência marca a TENTATIVA (o lembrete
  // não é reenviado noutra corrida mesmo que um canal tenha falhado).
  type Lembrete = { titulo: string; corpo: string; tituloEn: string; corpoEn: string; assunto: string };
  async function lembrar(userId: string, l: Lembrete): Promise<void> {
    // Nota: os builders do supabase-js NUNCA rejeitam — o erro vem em `{ error }`
    // e tem de ser verificado à mão, senão a falha é invisível.
    const inappP = (async () => {
      const { error } = await svc.from("notifications").insert({
        user_id: userId, kind: "reserva", title_pt: l.titulo, title_en: l.tituloEn,
        body_pt: l.corpo, body_en: l.corpoEn, icon: "calendar", accent: "primary",
      });
      if (error) console.error("[cron reminders] in-app:", error.message);
    })();
    const pushP = (async () => {
      if (!vapidReady()) return;
      const subs = await subsFor(svc, userId);
      if (!subs.length) return;
      const { stale } = await sendToSubs(subs, { title: l.titulo, body: l.corpo, url: "/app" });
      if (stale.length) await svc.from("push_subscriptions").delete().in("endpoint", stale);
    })();
    const emailP = (async () => {
      const { data: prof } = await svc.from("profiles").select("email_notifs").eq("id", userId).single();
      if (!prof?.email_notifs) return;
      const { data } = await svc.auth.admin.getUserById(userId);
      const email = data?.user?.email;
      if (!email) return;
      await sendClienteEmail(email, { assunto: l.assunto, titulo: l.titulo, corpo: l.corpo, ctaUrl: "https://www.osamigosdobairro.pt/app" });
    })();
    const results = await Promise.allSettled([inappP, pushP, emailP]);
    for (const r of results) {
      if (r.status === "rejected") console.error("[cron reminders]", r.reason);
    }
  }

  let dia = 0, antes = 0;
  for (const r of rows ?? []) {
    const hora = String(r.hora);
    const hhmm = hora.slice(0, 5);
    const horaMin = toMin(hora);

    // Lembrete do dia — a partir das 08:00 (Lisboa).
    if (!r.lembrete_dia_at && nowMin >= 480) {
      await lembrar(r.user_id as string, {
        titulo: "Lembrete de reserva",
        corpo: `Tens hoje uma reserva às ${hhmm}. Até já no café!`,
        tituloEn: "Booking reminder",
        corpoEn: `You have a booking today at ${hhmm}. See you at the café!`,
        assunto: `Lembrete: reserva hoje às ${hhmm}`,
      });
      await svc.from("reservations").update({ lembrete_dia_at: new Date().toISOString() }).eq("id", r.id as string);
      dia++;
    }
    // Lembrete ~30 min antes (janela 20–40 min para apanhar com cron de 10 min).
    if (!r.lembrete_30_at && horaMin - nowMin >= 20 && horaMin - nowMin <= 40) {
      await lembrar(r.user_id as string, {
        titulo: "A tua reserva é já a seguir",
        corpo: `Reserva às ${hhmm} — daqui a ~30 min.`,
        tituloEn: "Your booking is coming up",
        corpoEn: `Booking at ${hhmm} — in about 30 min.`,
        assunto: `A tua reserva às ${hhmm} é já a seguir`,
      });
      await svc.from("reservations").update({ lembrete_30_at: new Date().toISOString() }).eq("id", r.id as string);
      antes++;
    }
  }
  return Response.json({ ok: true, date, nowMin, lembretesDia: dia, lembretes30: antes });
}

export const GET = handle;
export const POST = handle;
