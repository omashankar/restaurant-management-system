import { adminSurface } from "@/config/adminSurfaceClasses";
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
      className={`${adminSurface.cardSolid} group relative overflow-hidden p-5 transition-all duration-200 hover-border-ra-primary-40 hover:shadow-ra-primary-soft ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-medium uppercase tracking-wider ${adminSurface.muted}`}>
            {title}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight admin-shell-text">
            {value}
          </p>
          {subtitle ? (
            <p className={`mt-1 text-sm ${adminSurface.muted}`}>{subtitle}</p>
          ) : null}
          {trend != null ? (
            <p
              className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${
                positive ? "text-ra-primary" : "text-amber-500"
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
          <span className="flex size-11 items-center justify-center rounded-xl bg-ra-primary-10 text-ra-primary ring-1 ring-ra-primary-20 transition-transform duration-200 group-hover:scale-105">
            <Icon className="size-5" aria-hidden />
          </span>
        ) : null}
      </div>
    </div>
  );
}
