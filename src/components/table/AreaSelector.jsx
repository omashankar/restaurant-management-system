import { TABLE_AREAS } from "@/config/tableAreas";

/**
 * Area selection cards.
 * Props:
 *   selected  — currently selected area id (string | null)
 *   onChange  — (areaId) => void
 *   counts    — { [areaId]: { total, available } }  (optional)
 */
export default function AreaSelector({ selected, onChange, counts = {} }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {TABLE_AREAS.map(({ id, label, Icon, activeClasses, hoverClasses, iconColor, iconBg }) => {
        const isActive = selected === id;
        const info = counts[id];
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`cursor-pointer group flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${
              isActive
                ? activeClasses
                : `admin-shell-border bg-zinc-900/50 admin-surface-body ${hoverClasses}`
            }`}
          >
            <span className={`flex size-10 items-center justify-center rounded-xl transition-colors ${isActive ? "admin-surface-segment-track" : iconBg}`}>
              <Icon className={`size-5 ${isActive ? "text-current" : iconColor}`} />
            </span>
            <div>
              <p className={`text-sm font-bold ${isActive ? "text-current" : "admin-shell-text"}`}>{label}</p>
              {info && (
                <p className="mt-0.5 text-xs admin-surface-muted">
                  {info.available}/{info.total} available
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
