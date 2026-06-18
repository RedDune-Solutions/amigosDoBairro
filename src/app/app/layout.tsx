import { AppNav } from "@/components/app-nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-cream-soft via-cream to-cream-deep">
      <div className="mx-auto w-full max-w-md flex-1 px-5 pb-6 pt-8">
        {children}
      </div>
      <AppNav />
    </div>
  );
}
