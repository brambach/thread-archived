"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

const TAB_ORDER = ["/today", "/tasks", "/calendar", "/journal", "/work"];

function getTabIndex(path: string): number {
  const idx = TAB_ORDER.findIndex(
    (t) => path === t || path.startsWith(t + "/")
  );
  return idx === -1 ? 0 : idx;
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentTab = getTabIndex(pathname);
  const prevTabRef = useRef(currentTab);

  // Direction is derived from stable ref — useEffect update avoids StrictMode double-render issues
  const direction =
    currentTab > prevTabRef.current ? 1
    : currentTab < prevTabRef.current ? -1
    : 0;

  useEffect(() => {
    prevTabRef.current = currentTab;
  }, [pathname, currentTab]);

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, x: direction * 32 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}
