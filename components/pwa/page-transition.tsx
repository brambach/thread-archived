"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useRef } from "react";

const TAB_ORDER = ["/today", "/tasks", "/calendar", "/journal", "/work"];

function getTabIndex(path: string): number {
  const idx = TAB_ORDER.findIndex(
    (t) => path === t || path.startsWith(t + "/")
  );
  return idx === -1 ? -1 : idx;
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prevTabRef = useRef(getTabIndex(pathname));
  const currentTab = getTabIndex(pathname);

  // Determine slide direction based on tab order
  const direction = currentTab > prevTabRef.current ? 1 : -1;

  // Update ref after determining direction
  if (currentTab !== -1) {
    prevTabRef.current = currentTab;
  }

  // Only animate between main tabs, not sub-routes
  const isMainTab = currentTab !== -1;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={
          isMainTab
            ? { opacity: 0, x: direction * 40 }
            : { opacity: 0 }
        }
        animate={{ opacity: 1, x: 0 }}
        exit={
          isMainTab
            ? { opacity: 0, x: direction * -40 }
            : { opacity: 0 }
        }
        transition={{
          duration: 0.2,
          ease: [0.25, 0.1, 0.25, 1],
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
