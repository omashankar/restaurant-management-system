"use client";

import { adminSurface } from "@/config/adminSurfaceClasses";
import { RESTAURANT_ADMIN_PRIMARY } from "@/config/restaurantAdminTheme";
import { useRestaurantTheme } from "@/hooks/useRestaurantTheme";

const DEFAULT_CHANNELS = [
  { label: "Dine-In", value: 0, color: RESTAURANT_ADMIN_PRIMARY },
  { label: "Takeaway", value: 0, color: "#6366f1" },
  { label: "Delivery", value: 0, color: "#f59e0b" },
];

function normalizeChannels(channels) {
  return (channels ?? []).map((c, i) => ({
    id: c.id ?? c.name ?? c.label ?? `channel-${i}`,
    label: c.label ?? c.name ?? `Channel ${i + 1}`,
    value: Number(c.value ?? 0),
    color: c.color ?? "#71717a",
  }));
}

function resolveChannelColor(color, primary) {
  if (!color || color === "#10b981" || color === RESTAURANT_ADMIN_PRIMARY) return primary;
  return color;
}

export default function DonutChart({ channels = DEFAULT_CHANNELS }) {
  const { theme } = useRestaurantTheme();
  const items = normalizeChannels(channels.length ? channels : DEFAULT_CHANNELS).map((c) => ({
    ...c,
    color: resolveChannelColor(c.color, theme.primaryColor),
  }));
  const total = items.reduce((s, c) => s + c.value, 0);

  const r = 54, cx = 70, cy = 70;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const segments = items.map((c) => {
    const pct = total > 0 ? c.value / total : 0;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const seg = { ...c, dash, gap, offset };
    offset += dash;
    return seg;
  });

  return (
    <div className={`rms-dashboard-card rms-dashboard-card--md flex h-full min-h-0 w-full flex-col p-5 ${adminSurface.card}`}>
      <div className="shrink-0">
        <h3 className={`text-sm font-semibold ${adminSurface.title}`}>Order Channels</h3>
        <p className={`text-xs ${adminSurface.muted}`}>Online vs offline split</p>
      </div>

      <div className="rms-dashboard-card__body rms-dashboard-card__body--y mt-4 min-h-0 flex-1 pr-1">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-around">
        <div className="relative shrink-0">
          <svg width="140" height="140" viewBox="0 0 140 140" aria-hidden>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--admin-chart-ring)" strokeWidth="18" />
            {total > 0 && segments.map((seg) => (
              <circle key={seg.id} cx={cx} cy={cy} r={r} fill="none"
                stroke={seg.color} strokeWidth="18"
                strokeDasharray={`${seg.dash} ${seg.gap}`}
                strokeDashoffset={-seg.offset + circumference * 0.25}
                strokeLinecap="butt" />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-xl font-semibold">{total > 0 ? `${total}` : "—"}</p>
            <p className={`text-[10px] ${adminSurface.muted}`}>Orders</p>
          </div>
        </div>

        <div className="space-y-3">
          {items.map((c) => (
            <div key={c.id} className="flex items-center gap-3">
              <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
              <div>
                <p className={`text-sm font-medium ${adminSurface.body}`}>{c.label}</p>
                <p className={`text-xs ${adminSurface.muted}`}>{c.value} orders</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
