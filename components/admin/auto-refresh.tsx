"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Re-fetches this route's server-rendered data on an interval, so admin pages
// reflect new survey submissions without a manual reload. Paused while the tab
// is hidden so a forgotten background tab doesn't poll the DB indefinitely.
export function AutoRefresh({ intervalMs = 10000 }: { intervalMs?: number }) {
  const router = useRouter();
  const routerRef = useRef(router);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") routerRef.current.refresh();
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return null;
}
