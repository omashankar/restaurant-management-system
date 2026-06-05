import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const FILES = [
  "src/components/ui/TableSkeleton.jsx",
  "src/components/settings/TimePicker.jsx",
  "src/components/ui/PhoneInput.jsx",
  "src/components/menu/MenuProductCard.jsx",
  "src/components/menu/MenuCard.jsx",
  "src/components/analytics/TopItemsTable.jsx",
  "src/components/table/AreaSelector.jsx",
  "src/components/filters/ItemTypeFilter.jsx",
  "src/components/inventory/InventoryTable.jsx",
  "src/components/TwoFactorSetup.jsx",
  "src/components/ui/TableSkeleton.jsx",
];

const REPLACEMENTS = [
  ["overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40", "admin-surface-table-shell"],
  ["border-b border-zinc-800 bg-zinc-950/50 px-4 py-3", "border-b admin-shell-border bg-[var(--admin-hover-strong)] px-4 py-3"],
  ["h-3 flex-1 rounded bg-zinc-800 animate-pulse", "h-3 flex-1 rounded admin-surface-skeleton animate-pulse"],
  ["h-4 flex-1 rounded-md bg-zinc-800/80 animate-pulse", "h-4 flex-1 rounded-md admin-surface-skeleton animate-pulse"],
  ["divide-y divide-zinc-800/80", "divide-y divide-zinc-800/80"],
  [
    "w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors focus-ra-primary disabled:cursor-not-allowed disabled:opacity-50",
    "admin-surface-input focus-ra-primary w-full px-3 py-2.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
  ],
  [
    "mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500",
    "admin-surface-label mb-1.5 block",
  ],
  [
    "w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus-ra-primary",
    "admin-surface-input focus-ra-primary w-full px-3 py-2 text-sm transition-colors",
  ],
  [
    "mb-1 block text-xs font-medium text-zinc-500",
    "admin-surface-label mb-1 block",
  ],
  ["rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5", "admin-surface-card p-5"],
  ["rounded-2xl border border-zinc-800 bg-zinc-900/70", "admin-surface-card"],
  ["border border-zinc-800 bg-zinc-900/50", "admin-surface-card border"],
  ["bg-zinc-900 text-zinc-400 ring-1 ring-zinc-800", "admin-surface-segment-btn"],
  ["rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6", "admin-surface-card p-6"],
];

for (const rel of FILES) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) continue;
  let c = fs.readFileSync(p, "utf8");
  let n = 0;
  for (const [a, b] of REPLACEMENTS) {
    if (c.includes(a)) {
      c = c.split(a).join(b);
      n++;
    }
  }
  if (n) {
    fs.writeFileSync(p, c, "utf8");
    console.log(rel, n);
  }
}
