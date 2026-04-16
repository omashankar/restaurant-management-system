"use client";

const DEFAULT_CHANNELS = [
  { label: "Dine-In",  value: 0, color: "#10b981" },
  { label: "Takeaway", value: 0, color: "#6366f1" },
  { label: "Delivery", value: 0, color: "#f59e0b" },
];

export default function DonutChart({ channels = DEFAULT_CHANNELS }) {
  const total = channels.reduce((s, c) => s + c.value, 0);

  const r = 54, cx = 70, cy = 70;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const segments = channels.map((c) => {
    const pct  = total > 0 ? c.value / total : 0;
    const dash = pct * circumference;
    const gap  = circumference - dash;
    const seg  = { ...c, dash, gap, offset };
    offset += dash;
    return seg;
  });

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <h3 className="text-sm font-semibold text-zinc-100">Order Channels</h3>
      <p className="text-xs text-zinc-500">Online vs offline split</p>

      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-around">
        <div className="relative shrink-0">
          <svg width="140" height="140" viewBox="0 0 140 140" aria-hidden>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#27272a" strokeWidth="18" />
            {total > 0 && segments.map((seg) => (
              <circle key={seg.label} cx={cx} cy={cy} r={r} fill="none"
                stroke={seg.color} strokeWidth="18"
                strokeDasharray={`${seg.dash} ${seg.gap}`}
                strokeDashoffset={-seg.offset + circumference * 0.25}
                strokeLinecap="butt" />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-xl font-semibold text-zinc-50">{total > 0 ? `${total}` : "—"}</p>
            <p className="text-[10px] text-zinc-500">Orders</p>
          </div>
        </div>

        <div className="space-y-3">
          {channels.map((c) => (
            <div key={c.label} className="flex items-center gap-3">
              <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
              <div>
                <p className="text-sm font-medium text-zinc-200">{c.label}</p>
                <p className="text-xs text-zinc-500">{c.value} orders</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
