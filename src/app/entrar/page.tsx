import { Stage } from "@/design/ui";
import { AuthScreen } from "@/design/screens/AuthScreen";

export const metadata = { robots: { index: false, follow: false } };

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <Stage>
      <AuthScreen initialMode="login" next={next} />
    </Stage>
  );
}
