import { Stage } from "@/design/ui";
import { RecoverScreen } from "@/design/screens/RecoverScreen";

export const metadata = { robots: { index: false, follow: false } };

export default function RecuperarPage() {
  return (
    <Stage>
      <RecoverScreen />
    </Stage>
  );
}
