import { AlertTriangle, Clock, Sparkles, Star, TrendingUp, Users } from "lucide-react";

const iconMap = { "trending-up": TrendingUp, clock: Clock, star: Star, alert: AlertTriangle, users: Users };

const typeStyles = {
  positive: { card: "border-emerald-500/20 bg-emerald-500/5",  icon: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/20", text: "text-emerald-300" },
  info:     { card: "border-indigo-500/20 bg-indigo-500/5",    icon: "bg-indigo-500/15 text-indigo-400 ring-indigo-500/20",    text: "text-indigo-300"  },
  warning:  { card: "border-amber-500/25 bg-amber-500/5",      icon: "bg-amber-500/15 text-amber-400 ring-amber-500/25",       text: "text-amber-300"   },
};

export default function AiInsights({ insights = [] }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/20">
          <Sparkles className="size-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">AI Insights</h3>
          <p className="text-xs text-zinc-500">Smart observations from today's data</p>
        </div>
        <span className="ml-auto rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-violet-400">
          Live
        </span>
      </div>

      {insights.length === 0 ? (
        <p className="mt-6 text-center text-sm text-zinc-600">No insights yet — place some orders first.</p>
      ) : (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
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
      )}
    </div>
  );
}
