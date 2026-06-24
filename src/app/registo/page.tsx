import { Stage } from "@/design/ui";
import { AuthScreen } from "@/design/screens/AuthScreen";
import { getFoodCategories } from "@/lib/menu-actions";

export const metadata = { robots: { index: false, follow: false } };

export default async function RegistoPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const foodCategories = await getFoodCategories();
  return (
    <Stage>
      <AuthScreen initialMode="register" next={next} foodCategories={foodCategories} />
    </Stage>
  );
}
