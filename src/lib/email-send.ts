// Envio de email transacional via SMTP (Amen) — helper de servidor partilhado,
// no mesmo espírito do push-send.ts. NÃO é "use server": é um módulo de
// servidor importado por server actions. Sem credenciais SMTP completas o
// envio é silenciosamente ignorado (nunca falha a ação que o dispara).
import nodemailer, { type Transporter } from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = Number(process.env.SMTP_PORT || "465");
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || "";
// Destinatários dos avisos de reserva (lista separada por vírgulas).
const RESERVA_EMAIL_TO = process.env.RESERVA_EMAIL_TO || "";

let transporter: Transporter | null = null;

/** Há configuração SMTP completa? */
export function emailReady(): boolean {
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASSWORD && RESERVA_EMAIL_TO);
}

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    });
  }
  return transporter;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export type NovaReservaEmail = {
  clienteNome: string;
  clienteEmail: string;
  clienteTelefone: string;
  data: string; // YYYY-MM-DD
  hora: string; // HH:MM[:SS]
  nPessoas: number;
};

/** Aviso à equipa: novo pedido de reserva. Mesmo estilo visual dos templates de auth. */
export async function sendNovaReservaEmail(r: NovaReservaEmail): Promise<void> {
  if (!emailReady()) return;
  const hora = r.hora.slice(0, 5);
  const dataLonga = new Date(r.data + "T00:00:00").toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const dataCurta = `${r.data.slice(8, 10)}/${r.data.slice(5, 7)}`;

  const linha = (label: string, valor: string) => `
    <tr>
      <td style="padding:7px 0;font-size:13px;color:#8a7c6b;white-space:nowrap;">${label}</td>
      <td style="padding:7px 0 7px 16px;font-size:14.5px;font-weight:700;color:#2c2620;text-align:right;">${valor}</td>
    </tr>`;

  const html = `<!doctype html>
<html lang="pt">
  <body style="margin:0;padding:0;background:#fbf3e7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbf3e7;padding:28px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #f0e6d6;">
          <tr>
            <td bgcolor="#fff8ee" style="background-color:#fff8ee;padding:24px 28px;text-align:center;border-bottom:1px solid #f0e6d6;">
              <img src="https://www.osamigosdobairro.pt/logo-transp.png" width="180" alt="Os Amigos do Bairro — Café &amp; Snack-Bar" style="display:block;margin:0 auto;width:180px;max-width:80%;height:auto;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:30px 28px;">
              <h1 style="margin:0 0 10px;font-size:21px;color:#2c2620;font-weight:800;">Novo pedido de reserva 📅</h1>
              <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#6b5e4d;">
                ${esc(r.clienteNome)} pediu uma reserva para ${esc(dataLonga)} às ${esc(hora)}.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;border-top:1px solid #f0e6d6;border-bottom:1px solid #f0e6d6;">
                ${linha("Cliente", esc(r.clienteNome))}
                ${linha("Dia", esc(dataLonga))}
                ${linha("Hora", esc(hora))}
                ${linha("Pessoas", String(r.nPessoas))}
                ${r.clienteTelefone ? linha("Telefone", esc(r.clienteTelefone)) : ""}
                ${r.clienteEmail ? linha("Email", esc(r.clienteEmail)) : ""}
              </table>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr><td style="border-radius:14px;background:#ef9a2e;">
                  <a href="https://www.osamigosdobairro.pt/admin"
                     style="display:inline-block;padding:14px 30px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:14px;">
                    Responder no painel
                  </a>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px;background:#fff8ee;border-top:1px solid #f0e6d6;text-align:center;">
              <div style="font-size:12px;color:#8a7c6b;line-height:1.6;">
                R. Dâmaso da Encarnação 53C, 8700-249 Quelfes · Olhão<br/>
                +351 289 034 275
              </div>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  await getTransporter().sendMail({
    from: `"Os Amigos do Bairro" <${SMTP_USER}>`,
    to: RESERVA_EMAIL_TO,
    subject: `Nova reserva · ${r.clienteNome} · ${dataCurta} ${hora}`,
    html,
  });
}
