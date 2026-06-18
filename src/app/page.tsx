import Link from "next/link";
import {
  Coffee,
  Stamp,
  Target,
  Card,
  Star,
  Gift,
  Sparkle,
  ArrowRight,
} from "@/components/icons";

const tiles = [
  { label: "Cada café conta", color: "bg-brick", Icon: Coffee },
  { label: "Junta selos", color: "bg-leaf", Icon: Stamp },
  { label: "Desafios", color: "bg-amber", Icon: Target },
  { label: "Cartão do clube", color: "bg-sky", Icon: Card },
  { label: "Favoritos", color: "bg-orange", Icon: Star },
  { label: "Recompensas", color: "bg-grape", Icon: Gift },
];

const benefits = [
  {
    Icon: Coffee,
    title: "Acumula pontos",
    text: "Cada café e cada visita contam para o teu saldo.",
  },
  {
    Icon: Gift,
    title: "Troca por recompensas",
    text: "Cafés, tostas e mimos do bairro à tua espera.",
  },
  {
    Icon: Star,
    title: "Vantagens de membro",
    text: "Promoções e novidades só para os Amigos do Bairro.",
  },
];

export default function Home() {
  return (
    <main className="min-h-dvh bg-gradient-to-b from-cream-soft via-cream to-cream-deep">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pb-8 pt-10 md:max-w-5xl md:justify-center md:px-10 md:py-16">
        <div className="md:grid md:grid-cols-2 md:items-center md:gap-14">
          {/* Coluna esquerda — marca + texto + CTA */}
          <section className="flex flex-col items-center text-center md:items-start md:text-left">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-cream-soft shadow-lg shadow-coffee/10 ring-4 ring-white md:h-28 md:w-28">
                {/* Placeholder do logótipo — substituir pelo logo real da Daniela */}
                <Coffee className="h-11 w-11 text-terracotta" />
              </div>
              <span
                aria-label="Portugal"
                className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center overflow-hidden rounded-full text-base shadow ring-2 ring-white"
              >
                🇵🇹
              </span>
            </div>

            <span className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-coffee-soft shadow-sm">
              <span className="text-terracotta">●</span> Café &amp; Snack-Bar do Bairro
            </span>

            <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.05] text-coffee md:text-6xl">
              O teu cantinho
              <br />
              no bairro
            </h1>

            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-coffee-soft">
              Junta-te ao clube dos Amigos do Bairro. Cada café conta — acumula
              pontos, troca recompensas e reserva a tua mesa.
            </p>

            <div className="mt-7 hidden w-full max-w-sm flex-col gap-3 md:flex">
              <CtaButtons />
            </div>
          </section>

          {/* Coluna direita — tiles + benefícios */}
          <section className="mt-8 md:mt-0">
            <div className="-mx-6 flex gap-3 overflow-x-auto px-6 pb-2 no-scrollbar md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0">
              {tiles.map(({ label, color, Icon }) => (
                <div
                  key={label}
                  className={`flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-2 rounded-tile ${color} p-3 text-white shadow-md md:aspect-square md:h-auto md:w-auto`}
                >
                  <Icon className="h-7 w-7" />
                  <span className="text-center text-[10px] font-semibold leading-tight opacity-95">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <h2 className="mt-8 text-xs font-bold uppercase tracking-[0.15em] text-coffee-soft">
              Porquê ser membro
            </h2>
            <ul className="mt-3 flex flex-col gap-2.5">
              {benefits.map(({ Icon, title, text }) => (
                <li
                  key={title}
                  className="flex items-start gap-3 rounded-2xl bg-white/70 p-3.5 shadow-sm"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-terracotta/15 text-terracotta">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-coffee">{title}</p>
                    <p className="text-[13px] leading-snug text-coffee-soft">
                      {text}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* CTA — em baixo no mobile */}
        <div className="mt-8 flex flex-col gap-3 md:hidden">
          <CtaButtons />
        </div>
      </div>
    </main>
  );
}

function CtaButtons() {
  return (
    <>
      <Link
        href="/registo"
        className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange to-orange-deep px-6 py-4 text-base font-semibold text-white shadow-lg shadow-orange/30 transition active:scale-[0.99]"
      >
        <Sparkle className="h-5 w-5" />
        Criar conta grátis
      </Link>
      <Link
        href="/entrar"
        className="flex items-center justify-center gap-1.5 text-sm font-medium text-coffee-soft"
      >
        Já tens conta?{" "}
        <span className="inline-flex items-center gap-1 font-semibold text-orange-deep">
          Entrar <ArrowRight className="h-4 w-4" />
        </span>
      </Link>
    </>
  );
}
