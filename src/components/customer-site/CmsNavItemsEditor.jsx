"use client";

import { layoutInputCls } from "@/components/customer-site/layoutEditorUi";
import { newNavItem, newSocialItem } from "@/lib/layoutNavDefaults";
import { ChevronDown, ChevronUp, Eye, EyeOff, Plus, Trash2 } from "lucide-react";

export default function CmsNavItemsEditor({
  items,
  onChange,
  mode = "path",
  addLabel = "Add link",
}) {
  const list = Array.isArray(items) ? items : [];

  const update = (index, patch) => {
    const next = [...list];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const remove = (index) => onChange(list.filter((_, i) => i !== index));

  const move = (index, dir) => {
    const j = index + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[index], next[j]] = [next[j], next[index]];
    onChange(next);
  };

  const add = () => {
    onChange([...list, mode === "url" ? newSocialItem() : newNavItem()]);
  };

  return (
    <div className="space-y-2">
      {list.map((item, index) => (
        <div
          key={item.id ?? index}
          className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 space-y-2"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-2">
              <input
                value={item.label ?? ""}
                onChange={(e) => update(index, { label: e.target.value })}
                placeholder="Label"
                className={layoutInputCls}
              />
              {mode === "url" ? (
                <input
                  value={item.url ?? ""}
                  onChange={(e) => update(index, { url: e.target.value })}
                  placeholder="https://..."
                  className={layoutInputCls}
                />
              ) : (
                <input
                  value={item.path ?? ""}
                  onChange={(e) => update(index, { path: e.target.value })}
                  placeholder="/order/menu"
                  className={layoutInputCls}
                />
              )}
              <p className="text-[10px] font-mono text-zinc-600">
                {mode === "url" ? `[Link]: ${item.url || "—"}` : `[Route]: ${item.path || "—"}`}
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-1">
              <button
                type="button"
                onClick={() => update(index, { enabled: item.enabled === false })}
                className="rounded-lg border border-zinc-700 p-1.5 text-zinc-400 hover:text-emerald-400"
                title={item.enabled === false ? "Show" : "Hide"}
              >
                {item.enabled === false ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
              <button
                type="button"
                disabled={index === 0}
                onClick={() => move(index, -1)}
                className="rounded-lg border border-zinc-700 p-1.5 text-zinc-500 disabled:opacity-30"
              >
                <ChevronUp className="size-4" />
              </button>
              <button
                type="button"
                disabled={index === list.length - 1}
                onClick={() => move(index, 1)}
                className="rounded-lg border border-zinc-700 p-1.5 text-zinc-500 disabled:opacity-30"
              >
                <ChevronDown className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => remove(index)}
                className="rounded-lg border border-red-500/30 p-1.5 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 py-3 text-sm font-medium text-zinc-400 hover:border-emerald-500/40 hover:text-emerald-400"
      >
        <Plus className="size-4" /> {addLabel}
      </button>
    </div>
  );
}
