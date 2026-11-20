"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { dropStaleContentTrend } from "@/lib/contentTrend";

/** Clears a Content Creation handoff once the user navigates away from its page. */
export default function ContentTrendWatcher() {
  const pathname = usePathname();
  useEffect(() => dropStaleContentTrend(pathname), [pathname]);
  return null;
}
