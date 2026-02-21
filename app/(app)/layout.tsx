import { BottomNav } from "@/components/nav/bottom-nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <main className="flex-1 overflow-y-auto px-5 pt-[env(safe-area-inset-top)] pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
