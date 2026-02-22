import { BottomNav } from "@/components/nav/bottom-nav";
import { CaptureUI } from "@/components/captures/capture-ui";
import { PageTransition } from "@/components/pwa/page-transition";
import { PullToRefresh } from "@/components/pwa/pull-to-refresh";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <PullToRefresh>
        <main className="px-5 pt-[env(safe-area-inset-top)] pb-24 max-w-lg mx-auto w-full">
          <PageTransition>{children}</PageTransition>
        </main>
      </PullToRefresh>
      <BottomNav />
      <CaptureUI />
    </div>
  );
}
