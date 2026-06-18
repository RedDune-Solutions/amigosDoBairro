import { AuthShell } from "@/components/brand-mark";
import { AuthForm } from "@/components/auth-form";

export default async function RegistoPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <AuthShell
      title="Junta-te ao clube"
      subtitle="Cria a tua conta grátis e começa a acumular pontos."
    >
      <AuthForm mode="registo" next={next} />
    </AuthShell>
  );
}
