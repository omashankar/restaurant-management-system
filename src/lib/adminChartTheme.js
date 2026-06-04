/** Chart axis/grid colors — follow html[data-admin-mode] via CSS variables. */

export const ADMIN_CHART_FALLBACK = {
  grid: "#27272a",
  tick: "#71717a",
  tickSecondary: "#a1a1aa",
  tooltipBg: "#18181b",
  tooltipBorder: "#27272a",
  ring: "#27272a",
};

export function readAdminChartTheme() {
  if (typeof window === "undefined") return { ...ADMIN_CHART_FALLBACK };
  const root = document.documentElement;
  const s = getComputedStyle(root);
  const pick = (name, fallback) => s.getPropertyValue(name).trim() || fallback;
  return {
    grid: pick("--admin-chart-grid", ADMIN_CHART_FALLBACK.grid),
    tick: pick("--admin-chart-tick", ADMIN_CHART_FALLBACK.tick),
    tickSecondary: pick("--admin-chart-tick-secondary", ADMIN_CHART_FALLBACK.tickSecondary),
    tooltipBg: pick("--admin-chart-tooltip-bg", ADMIN_CHART_FALLBACK.tooltipBg),
    tooltipBorder: pick("--admin-chart-tooltip-border", ADMIN_CHART_FALLBACK.tooltipBorder),
    ring: pick("--admin-chart-ring", ADMIN_CHART_FALLBACK.ring),
  };
}

export function adminChartTick(fontSize = 11, secondary = false) {
  const t = readAdminChartTheme();
  return {
    fill: secondary ? t.tickSecondary : t.tick,
    fontSize,
  };
}

export function adminChartTooltipStyle() {
  const t = readAdminChartTheme();
  return {
    background: t.tooltipBg,
    border: `1px solid ${t.tooltipBorder}`,
    borderRadius: 12,
    fontSize: 12,
  };
}
