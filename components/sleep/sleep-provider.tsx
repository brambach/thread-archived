"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

interface SleepState {
  active: boolean;
  date: string; // date when sleep was activated
  waking: boolean; // true during the wake-up animation
}

interface SleepContextValue {
  isSleeping: boolean;
  isWaking: boolean;
  enterSleep: () => void;
  wake: () => void;
}

const SleepContext = createContext<SleepContextValue>({
  isSleeping: false,
  isWaking: false,
  enterSleep: () => {},
  wake: () => {},
});

export function useSleep() {
  return useContext(SleepContext);
}

const STORAGE_KEY = "thread-sleep-mode";

function getLocalToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function loadSleepState(): SleepState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveSleepState(state: SleepState | null) {
  if (typeof window === "undefined") return;
  if (!state) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

export function SleepProvider({ children }: { children: React.ReactNode }) {
  const [sleeping, setSleeping] = useState(false);
  const [waking, setWaking] = useState(false);
  const [mounted, setMounted] = useState(false);

  // On mount, restore sleep state from localStorage
  useEffect(() => {
    const saved = loadSleepState();
    if (saved?.active) {
      // Still sleeping — show the overlay
      setSleeping(true);
    }
    setMounted(true);
  }, []);

  const enterSleep = useCallback(() => {
    const state: SleepState = {
      active: true,
      date: getLocalToday(),
      waking: false,
    };
    saveSleepState(state);
    setSleeping(true);
  }, []);

  const wake = useCallback(() => {
    setWaking(true);
    // After the wake animation finishes, clear everything
    setTimeout(() => {
      setSleeping(false);
      setWaking(false);
      saveSleepState(null);
    }, 1200);
  }, []);

  // Don't render sleep overlay during SSR
  if (!mounted) {
    return (
      <SleepContext.Provider
        value={{ isSleeping: false, isWaking: false, enterSleep, wake }}
      >
        {children}
      </SleepContext.Provider>
    );
  }

  return (
    <SleepContext.Provider
      value={{ isSleeping: sleeping, isWaking: waking, enterSleep, wake }}
    >
      {children}
    </SleepContext.Provider>
  );
}
