"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getLocalToday } from "@/lib/utils";

export default function JournalPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/journal/${getLocalToday()}`);
  }, [router]);

  return null;
}
