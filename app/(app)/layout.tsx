import { BottomNav } from "@/components/nav/bottom-nav";
import { CaptureUI } from "@/components/captures/capture-ui";
import { PageTransition } from "@/components/pwa/page-transition";
import { PullToRefresh } from "@/components/pwa/pull-to-refresh";
import { SleepProvider } from "@/components/sleep/sleep-provider";
import { SleepOverlay } from "@/components/sleep/sleep-overlay";
import { WakeOverlay } from "@/components/sleep/wake-overlay";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SleepProvider>
      <div className="flex min-h-dvh flex-col bg-bg">
        <PullToRefresh>
          <main className="px-5 pt-[env(safe-area-inset-top)] pb-[calc(5rem+env(safe-area-inset-bottom))] max-w-lg mx-auto w-full">
            <PageTransition>{children}</PageTransition>
          </main>
        </PullToRefresh>
        <BottomNav />
        <CaptureUI />
      </div>
      <SleepOverlay />
      <WakeOverlay />
    </SleepProvider>
  );
}
