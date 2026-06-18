import Link from "next/link";
import { getProfile, getBalance } from "@/lib/data";
import { EarnQr } from "@/components/earn-qr";
import { Gift, Calendar, ArrowRight } from "@/components/icons";

export default async function AppHome() {
  const [{ profile }, saldo] = await Promise.all([getProfile(), getBalance()]);
  const primeiroNome = profile?.nome?.split(" ")[0] ?? "amigo";
  const isStaff = profile?.role === "staff" || profile?.role === "admin";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-coffee-soft">Olá,</p>
          <h1 className="font-display text-2xl font-semibold text-coffee">
            {primeiroNome} 👋
          </h1>
        </div>
        {isStaff && (
          <Link
            href="/staff"
            className="rounded-full bg-coffee px-3.5 py-2 text-xs font-semibold text-cream-soft"
          >
            Painel staff
          </Link>
        )}
      </header>

      {/* Cartão de saldo */}
      <section className="rounded-3xl bg-gradient-to-br from-terracotta to-orange-deep p-6 text-white shadow-lg shadow-orange/20">
        <p className="text-sm font-medium opacity-90">O teu saldo</p>
        <p className="mt-1 font-display text-5xl font-semibold">
          {saldo}
          <span className="ml-2 text-xl font-medium opacity-90">pontos</span>
        </p>
        <p className="mt-3 text-sm opacity-90">
          Cada café conta. Continua a juntar para trocares por recompensas.
        </p>
      </section>

      {/* QR de acumulação */}
      <section className="rounded-3xl bg-white/70 p-6 shadow-sm">
        <h2 className="mb-4 text-center font-display text-lg font-semibold text-coffee">
          Acumular pontos
        </h2>
        <EarnQr />
      </section>

      {/* Atalhos */}
      <section className="grid grid-cols-2 gap-3">
        <QuickLink href="/recompensas" Icon={Gift} title="Recompensas" sub="Troca os teus pontos" />
        <QuickLink href="/reservar" Icon={Calendar} title="Reservar mesa" sub="Garante o teu lugar" />
      </section>
    </div>
  );
}

function QuickLink({
  href,
  Icon,
  title,
  sub,
}: {
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-2 rounded-2xl bg-white/70 p-4 shadow-sm transition active:scale-[0.99]"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-terracotta/15 text-terracotta">
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-sm font-semibold text-coffee">{title}</span>
      <span className="flex items-center gap-1 text-xs text-coffee-soft">
        {sub} <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}
