import { TrendingDown, TrendingUp } from "lucide-react";

export default function StatsCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  className = "",
}) {
  const positive = trend != null && trend >= 0;
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg shadow-black/20 transition-all duration-200 hover:border-emerald-500/40 hover:shadow-emerald-500/5 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            {title}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50">
            {value}
          </p>
          {subtitle ? (
            <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
          ) : null}
          {trend != null ? (
            <p
              className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${
                positive ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {positive ? (
                <TrendingUp className="size-3.5" aria-hidden />
              ) : (
                <TrendingDown className="size-3.5" aria-hidden />
              )}
              {positive ? "+" : ""}
              {trend}% vs last week
            </p>
          ) : null}
        </div>
        {Icon ? (
          <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 transition-transform duration-200 group-hover:scale-105">
            <Icon className="size-5" aria-hidden />
          </span>
        ) : null}
      </div>
    </div>
  );
}
