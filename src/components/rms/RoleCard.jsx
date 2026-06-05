import { AlertTriangle, Check } from "lucide-react";

export default function RoleCard({
  title,
  description,
  variant = "allowed",
  className = "",
}) {
  const isLimited = variant === "limited";
  return (
    <div
      className={`rounded-2xl border p-4 transition-all duration-200 hover:scale-[1.01] ${
        isLimited
          ? "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50"
          : "admin-shell-border admin-surface-card hover-border-ra-primary-40"
      } ${className}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg ${
            isLimited
              ? "bg-amber-500/15 text-amber-400"
              : "bg-ra-primary-15 text-ra-primary"
          }`}
        >
          {isLimited ? (
            <AlertTriangle className="size-4" aria-hidden />
          ) : (
            <Check className="size-4" aria-hidden />
          )}
        </span>
        <div>
          <p className="font-medium admin-shell-text">{title}</p>
          {description ? (
            <p className="mt-1 text-sm leading-relaxed admin-surface-muted">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
