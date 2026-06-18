# Os Amigos do Bairro — App de Fidelização

App de fidelização do **Café & Snack-Bar do Bairro**. Os clientes acumulam pontos,
trocam por recompensas e reservam mesa. PWA construída com Next.js + Supabase.

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Tailwind CSS 4** — tema quente "café do bairro" (Fraunces + Plus Jakarta Sans)
- **Supabase** (Postgres + Auth + RLS) — local via Docker, migrável para cloud sem reescrita
- **PWA** — manifest + ícones, mobile-first e responsivo em desktop

## Funcionalidades

| Área | O quê |
|------|-------|
| Cliente | Conta/login, saldo de pontos, QR rotativo para acumular, catálogo de recompensas com resgate, reserva de mesa, histórico |
| Staff | Ler QR do cliente (câmara ou manual) e creditar pontos, validar códigos de resgate, ver reservas |
| Admin | Gerir recompensas (CRUD), ajustar pontos, gerir reservas |

## Segurança (pontos = dinheiro)

- O ledger de pontos é **append-only**; o cliente **nunca** escreve nele directamente.
- Todo o crédito/débito passa por funções `SECURITY DEFINER` com verificação de role
  (`creditar_via_nonce`, `resgatar_recompensa`, `ajustar_pontos`).
- Acumulação por **nonce de uso único e curta duração** (anti-replay, anti-auto-crédito).
- RLS em todas as tabelas; cliente só vê os seus dados.
- Server actions validam input com `zod` e re-verificam o role no servidor.

## Desenvolvimento local

Pré-requisitos: **Node 20+**, **Docker** a correr.

```bash
npm install
npx supabase start          # sobe Postgres/Auth/Studio locais (1.ª vez puxa imagens)
npx supabase db reset       # aplica migrações + seed de recompensas demo
npm run dev                 # http://localhost:3000
```

`supabase start` imprime as chaves locais. Confirma que `.env.local` tem
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`.

### Criar um staff/admin (local)

Regista-te na app e depois, no Studio local (`http://localhost:54323`) ou via SQL:

```sql
update public.profiles set role = 'admin' where id = '<o-teu-uuid>';
```

## Migrar para Supabase cloud (quando houver projecto)

Sem reescrita — tudo está em ficheiros:

```bash
npx supabase link --project-ref <ref-do-projecto>
npx supabase db push        # aplica as migrações no cloud
```

Depois actualiza as variáveis de ambiente (Vercel) com o URL e as chaves do projecto cloud.

## A confirmar com a cliente (Daniela)

- Regra de pontos (ex.: 1 café = 1 ponto).
- Lista e custos das recompensas (o seed actual é placeholder).
- Horário e capacidade para reservas.
- Logótipo e cores exactas da marca (o emblema actual é placeholder).
