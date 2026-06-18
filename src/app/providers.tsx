"use client";

import { LangProvider } from "@/design/i18n";

export function Providers({ children }: { children: React.ReactNode }) {
  return <LangProvider>{children}</LangProvider>;
}
