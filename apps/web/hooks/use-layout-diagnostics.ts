"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function useLayoutDiagnostics(tag = "app-shell") {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const width = window.innerWidth;
    // Early observability so we can confirm responsive heuristics are correct.
    console.info(`[${tag}] route=${pathname} viewport=${width}px`);
  }, [pathname, tag]);
}
