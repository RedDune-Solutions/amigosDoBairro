import Link from "next/link";
import { Coffee } from "@/components/icons";

/** Emblema da marca (placeholder — substituir pelo logótipo real da Daniela). */
export function BrandMark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-2">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-cream-soft shadow-lg shadow-coffee/10 ring-4 ring-white">
        <Coffee className="h-8 w-8 text-terracotta" />
      </span>
      <span className="font-display text-lg font-semibold text-coffee">
        Os Amigos do Bairro
      </span>
    </Link>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-cream-soft via-cream to-cream-deep px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center">
          <BrandMark />
        </div>
        <div className="mt-7 rounded-3xl bg-white/70 p-6 shadow-xl shadow-coffee/5 backdrop-blur-sm">
          <h1 className="font-display text-2xl font-semibold text-coffee">
            {title}
          </h1>
          <p className="mt-1 mb-5 text-sm text-coffee-soft">{subtitle}</p>
          {children}
        </div>
      </div>
    </main>
  );
}
