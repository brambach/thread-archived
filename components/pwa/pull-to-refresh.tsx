"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { usePathname } from "next/navigation";

const THRESHOLD = 80;
const MAX_PULL = 120;

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const [refreshing, setRefreshing] = useState(false);
  const pullY = useMotionValue(0);
  const spinnerOpacity = useTransform(pullY, [0, THRESHOLD * 0.4, THRESHOLD], [0, 0.5, 1]);
  const spinnerScale = useTransform(pullY, [0, THRESHOLD], [0.5, 1]);
  const spinnerRotate = useTransform(pullY, [0, MAX_PULL], [0, 180]);

  const touchStartRef = useRef(0);
  const isPullingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Reset on route change
  useEffect(() => {
    setRefreshing(false);
    pullY.set(0);
  }, [pathname, pullY]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Animate to resting "refreshing" position
    animate(pullY, 50, { duration: 0.2 });

    try {
      // Force a full page refresh via Next.js router
      const { useRouter } = await import("next/navigation");
      // Since we can't use hooks outside components, use window.location
      // for a clean refresh that re-fetches server components
      window.location.reload();
    } catch {
      setRefreshing(false);
      animate(pullY, 0, { duration: 0.25 });
    }
  }, [pullY]);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (refreshing) return;
      const scrollTop = containerRef.current?.scrollTop ?? 0;
      if (scrollTop > 5) return; // Only activate at top of scroll

      touchStartRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    },
    [refreshing]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isPullingRef.current || refreshing) return;

      const scrollTop = containerRef.current?.scrollTop ?? 0;
      if (scrollTop > 5) {
        isPullingRef.current = false;
        pullY.set(0);
        return;
      }

      const delta = e.touches[0].clientY - touchStartRef.current;
      if (delta < 0) {
        pullY.set(0);
        return;
      }

      // Rubber band effect — diminishing returns past threshold
      const dampened = delta > THRESHOLD
        ? THRESHOLD + (delta - THRESHOLD) * 0.3
        : delta;

      pullY.set(Math.min(dampened, MAX_PULL));
    },
    [refreshing, pullY]
  );

  const onTouchEnd = useCallback(() => {
    if (!isPullingRef.current || refreshing) return;
    isPullingRef.current = false;

    if (pullY.get() >= THRESHOLD) {
      handleRefresh();
    } else {
      animate(pullY, 0, { duration: 0.25, ease: "easeOut" });
    }
  }, [refreshing, pullY, handleRefresh]);

  const contentY = useTransform(pullY, (v) => Math.min(v, MAX_PULL));

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Spinner indicator */}
      <motion.div
        className="flex items-center justify-center overflow-hidden pointer-events-none"
        style={{
          height: contentY,
          opacity: spinnerOpacity,
        }}
      >
        <motion.div
          style={{ scale: spinnerScale, rotate: refreshing ? undefined : spinnerRotate }}
          animate={refreshing ? { rotate: 360 } : undefined}
          transition={refreshing ? { duration: 0.8, repeat: Infinity, ease: "linear" } : undefined}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent"
          >
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
        </motion.div>
      </motion.div>

      {children}
    </div>
  );
}
