"use client";

import { readAdminChartTheme } from "@/lib/adminChartTheme";
import { useEffect, useState } from "react";

export function useAdminChartTheme() {
  const [chart, setChart] = useState(readAdminChartTheme);

  useEffect(() => {
    const sync = () => setChart(readAdminChartTheme());
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-admin-mode"],
    });
    return () => obs.disconnect();
  }, []);

  return chart;
}
