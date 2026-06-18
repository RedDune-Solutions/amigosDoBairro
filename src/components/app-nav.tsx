"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coffee, Gift, Calendar, Star } from "@/components/icons";

const items = [
  { href: "/app", label: "Início", Icon: Coffee },
  { href: "/recompensas", label: "Recompensas", Icon: Gift },
  { href: "/reservar", label: "Reservar", Icon: Calendar },
  { href: "/perfil", label: "Perfil", Icon: Star },
];

export function AppNav() {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 z-10 border-t border-coffee/10 bg-cream-soft/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {items.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                active ? "text-orange-deep" : "text-coffee-soft"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
