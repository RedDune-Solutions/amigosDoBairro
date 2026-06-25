"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/design/ui";
import { Splash } from "@/design/screens/Splash";
import { useI18n } from "@/design/i18n";
import { signOut } from "@/lib/auth-actions";
import type { Lang } from "@/design/strings";

/**
 * Botão de terminar sessão com **loader**: enquanto a server action `signOut`
 * corre (sign out + redirect), mostra o Splash em ecrã inteiro — senão a saída
 * ficava sem feedback (o redirect do server action não dispara `loading.tsx`).
 */
function SignOutInner({ label, lang }: { label: string; lang: Lang }) {
  const { pending } = useFormStatus();
  return (
    <>
      <Button full variant="soft" accent="var(--c-red)" icon="logout" type="submit" loading={pending}>
        {label}
      </Button>
      {pending && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            background: "var(--c-bg)",
            animation: "fadeIn .15s ease",
          }}
        >
          <Splash lang={lang} />
        </div>
      )}
    </>
  );
}

export function SignOutButton({ label }: { label: string }) {
  const { lang } = useI18n();
  return (
    <form action={signOut}>
      <SignOutInner label={label} lang={lang} />
    </form>
  );
}
