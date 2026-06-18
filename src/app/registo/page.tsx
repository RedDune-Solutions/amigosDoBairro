import { Stage } from "@/design/ui";
import { AuthScreen } from "@/design/screens/AuthScreen";

export default async function RegistoPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <Stage>
      <AuthScreen initialMode="register" next={next} />
    </Stage>
  );
}
