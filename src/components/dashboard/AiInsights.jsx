import { AlertTriangle, Clock, Sparkles, Star, TrendingUp, Users } from "lucide-react";

const iconMap = { "trending-up": TrendingUp, clock: Clock, star: Star, alert: AlertTriangle, users: Users };

const typeStyles = {
  positive: { card: "border-ra-primary-20 bg-ra-primary-5",  icon: "bg-ra-primary-15 text-ra-primary ring-ra-primary-20", text: "text-ra-primary-muted" },
  info:     { card: "border-indigo-500/20 bg-indigo-500/5",    icon: "bg-indigo-500/15 text-indigo-400 ring-indigo-500/20",    text: "text-indigo-300"  },
  warning:  { card: "border-amber-500/25 bg-amber-500/5",      icon: "bg-amber-500/15 text-amber-400 ring-amber-500/25",       text: "text-amber-300"   },
};

export default function AiInsights({ insights = [] }) {
  return (
    <div className="rms-dashboard-card rms-dashboard-card--md flex flex-col rms-dashboard-card admin-surface-card p-5">
      <div className="flex flex-wrap items-start gap-2 sm:items-center">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/20">
          <Sparkles className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="admin-surface-title text-sm font-semibold">AI Insights</h3>
          <p className="admin-surface-subheading">Smart observations from today&apos;s data</p>
        </div>
        <span className="shrink-0 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-violet-400 sm:ml-auto">
          Live
        </span>
      </div>

      {insights.length === 0 ? (
        <p className="mt-6 text-center text-sm admin-surface-faint">No insights yet — place some orders first.</p>
      ) : (
        <div className="rms-dashboard-card__body rms-dashboard-card__body--y mt-4 min-h-0 flex-1 pr-1">
          <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
            {insights.map((insight, i) => {
              const Icon = iconMap[insight.icon] ?? TrendingUp;
              const s = typeStyles[insight.type] ?? typeStyles.info;
              return (
                <div key={i} className={`flex items-start gap-3 rounded-xl border p-3 ${s.card}`}>
                  <span className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg ring-1 ${s.icon}`}>
                    <Icon className="size-3.5" />
                  </span>
                  <p className={`text-xs leading-relaxed ${s.text}`}>{insight.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
