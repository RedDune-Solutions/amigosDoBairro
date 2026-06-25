import { createServiceClient } from "@/lib/supabase/server";
import { vapidReady, sendToSubs, type PushSub } from "@/lib/push-send";

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
  if (!vapidReady()) return Response.json({ ok: false, reason: "no-vapid" });

  const svc = createServiceClient();
  const { date, nowMin } = lisbonNow();
  const { data: rows } = await svc
    .from("reservations")
    .select("id, user_id, hora, lembrete_dia_at, lembrete_30_at")
    .eq("estado", "confirmada")
    .eq("data", date);

  let dia = 0, antes = 0;
  for (const r of rows ?? []) {
    const hora = String(r.hora);
    const hhmm = hora.slice(0, 5);
    const horaMin = toMin(hora);
    const subs = await subsFor(svc, r.user_id as string);
    if (!subs.length) continue;

    // Lembrete do dia — a partir das 08:00 (Lisboa).
    if (!r.lembrete_dia_at && nowMin >= 480) {
      await sendToSubs(subs, { title: "Lembrete de reserva", body: `Tens hoje uma reserva às ${hhmm}. Até já no café!`, url: "/app" });
      await svc.from("reservations").update({ lembrete_dia_at: new Date().toISOString() }).eq("id", r.id as string);
      dia++;
    }
    // Lembrete ~30 min antes (janela 20–40 min para apanhar com cron de 10 min).
    if (!r.lembrete_30_at && horaMin - nowMin >= 20 && horaMin - nowMin <= 40) {
      await sendToSubs(subs, { title: "A tua reserva é já a seguir", body: `Reserva às ${hhmm} — daqui a ~30 min.`, url: "/app" });
      await svc.from("reservations").update({ lembrete_30_at: new Date().toISOString() }).eq("id", r.id as string);
      antes++;
    }
  }
  return Response.json({ ok: true, date, nowMin, lembretesDia: dia, lembretes30: antes });
}

export const GET = handle;
export const POST = handle;
