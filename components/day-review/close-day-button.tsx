"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { CloseDayFlow } from "./close-day-flow";

export function CloseDayButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full mt-6 py-3.5 rounded-xl border text-sm font-medium transition-all hover:border-[#4A3820] hover:text-[#C4924F] active:scale-[0.98]"
        style={{
          borderColor: "#2C2520",
          color: "#7A7068",
          backgroundColor: "transparent",
        }}
      >
        Close the Day →
      </button>

      <AnimatePresence>
        {open && <CloseDayFlow onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
