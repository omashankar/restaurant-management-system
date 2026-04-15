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
                : `border-zinc-800 bg-zinc-900/50 text-zinc-300 ${hoverClasses}`
            }`}
          >
            <span className={`flex size-10 items-center justify-center rounded-xl transition-colors ${isActive ? "bg-zinc-800/60" : iconBg}`}>
              <Icon className={`size-5 ${isActive ? "text-current" : iconColor}`} />
            </span>
            <div>
              <p className={`text-sm font-bold ${isActive ? "text-current" : "text-zinc-100"}`}>{label}</p>
              {info && (
                <p className="mt-0.5 text-xs text-zinc-500">
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
