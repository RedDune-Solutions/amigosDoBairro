import { AuthShell } from "@/components/brand-mark";
import { AuthForm } from "@/components/auth-form";

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <AuthShell title="Bem-vindo de volta" subtitle="Entra para ver os teus pontos.">
      <AuthForm mode="entrar" next={next} />
    </AuthShell>
  );
}
