/**
 * One-off: replace hardcoded dark zinc surfaces with admin theme tokens.
 */
import fs from "fs";
import path from "path";

const ROOT = path.join(process.cwd(), "src", "app");
const DIRS = ["super-admin", path.join("(app)")];

const REPLACEMENTS = [
  ['? "bg-zinc-800 admin-shell-text"', '? "admin-surface-segment-btn-active admin-shell-text"'],
  ["? 'bg-zinc-800 admin-shell-text'", "? 'admin-surface-segment-btn-active admin-shell-text'"],
  ['bg-zinc-800 admin-shell-text"', 'admin-surface-segment-btn-active admin-shell-text"'],
  [
    'text-zinc-500 hover:bg-[var(--admin-hover)] hover:admin-surface-body',
    'admin-surface-segment-btn hover:admin-surface-body',
  ],
  ['h-1.5 w-full rounded-full bg-zinc-800', 'h-1.5 w-full rounded-full admin-progress-track'],
  ['h-1 w-full rounded-full bg-zinc-800', 'h-1 w-full rounded-full admin-progress-track'],
  ['rounded-xl border admin-shell-border bg-zinc-900/70', 'rounded-xl border admin-shell-border admin-surface-input'],
  ['border admin-shell-border bg-zinc-900/70', 'border admin-shell-border admin-surface-input'],
  [
    'rounded-lg border admin-shell-border bg-zinc-900 px-2 py-1 text-[10px] font-semibold admin-shell-text shadow-lg',
    'rounded-lg admin-chart-tooltip px-2 py-1 text-[10px] font-semibold admin-shell-text shadow-lg',
  ],
  [
    'hidden group-hover:flex whitespace-nowrap rounded-lg border admin-shell-border bg-zinc-900 px-2 py-1',
    'hidden group-hover:flex whitespace-nowrap rounded-lg admin-chart-tooltip px-2 py-1',
  ],
  [
    'hidden -translate-x-1/2 whitespace-nowrap rounded-lg border admin-shell-border bg-zinc-900 px-2 py-1',
    'hidden -translate-x-1/2 whitespace-nowrap rounded-lg admin-chart-tooltip px-2 py-1',
  ],
  ['flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800', 'flex size-8 shrink-0 items-center justify-center rounded-lg admin-rank-badge'],
  ['flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-800', 'flex size-8 shrink-0 items-center justify-center rounded-full admin-rank-badge'],
  ['flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-800', 'flex size-7 shrink-0 items-center justify-center rounded-full admin-rank-badge'],
  ['flex size-6 shrink-0 items-center justify-center rounded-full bg-zinc-800', 'flex size-6 shrink-0 items-center justify-center rounded-full admin-rank-badge'],
  ['ml-auto rounded-full bg-zinc-800 px-2', 'ml-auto rounded-full bg-[var(--admin-hover-strong)] px-2'],
  ['rounded-full bg-zinc-800 px-2 py-0.5', 'rounded-full bg-[var(--admin-hover-strong)] px-2 py-0.5'],
  ['rounded-lg bg-zinc-800 px-2 py-0.5', 'rounded-lg bg-[var(--admin-hover-strong)] px-2 py-0.5'],
  ['h-8 w-40 animate-pulse rounded-lg bg-zinc-800', 'h-8 w-40 animate-pulse rounded-lg admin-progress-track'],
  ['h-8 w-56 animate-pulse rounded-lg bg-zinc-800', 'h-8 w-56 animate-pulse rounded-lg admin-progress-track'],
  ['h-8 w-32 animate-pulse rounded-lg bg-zinc-800', 'h-8 w-32 animate-pulse rounded-lg admin-progress-track'],
  ['h-8 w-28 animate-pulse rounded-lg bg-zinc-800', 'h-8 w-28 animate-pulse rounded-lg admin-progress-track'],
  ['h-8 w-64 animate-pulse rounded-lg bg-zinc-800', 'h-8 w-64 animate-pulse rounded-lg admin-progress-track'],
  ['h-10 w-64 animate-pulse rounded-lg bg-zinc-800', 'h-10 w-64 animate-pulse rounded-lg admin-progress-track'],
  ['h-10 w-64 rounded-lg bg-zinc-800 animate-pulse', 'h-10 w-64 rounded-lg admin-progress-track animate-pulse'],
  ['h-8 w-40 rounded-lg bg-zinc-800 animate-pulse', 'h-8 w-40 rounded-lg admin-progress-track animate-pulse'],
  ['h-56 animate-pulse rounded-2xl border border-sa-primary-10 bg-zinc-900/40', 'h-56 animate-pulse rounded-2xl border border-sa-primary-10 admin-surface-card'],
  ['h-56 animate-pulse rounded-2xl border border-ra-primary-10 bg-zinc-900/40', 'h-56 animate-pulse rounded-2xl border border-ra-primary-10 admin-surface-card'],
  ['rounded-xl border admin-shell-border bg-zinc-900 p-1', 'rounded-xl border admin-shell-border admin-surface-segment-track p-1'],
  ['inline-flex rounded-xl border admin-shell-border bg-zinc-900 p-1', 'inline-flex rounded-xl border admin-shell-border admin-surface-segment-track p-1'],
  ['h-8 rounded-md border admin-shell-border bg-zinc-900 px-2', 'h-8 rounded-md border admin-shell-border admin-surface-input px-2'],
  ['rounded-lg border admin-shell-border bg-zinc-900 px-2 py-1', 'rounded-lg border admin-shell-border admin-surface-input px-2 py-1'],
  ['rounded-md border admin-shell-border bg-zinc-900 px-2', 'rounded-md border admin-shell-border admin-surface-input px-2'],
  ['rounded-lg border admin-shell-border bg-zinc-900/30 p-2.5', 'rounded-lg border admin-shell-border admin-surface-card p-2.5'],
  ['shrink-0 border-r border-zinc-700 bg-zinc-800 px-3', 'shrink-0 border-r admin-shell-border bg-[var(--admin-hover-strong)] px-3'],
  [
    'flex size-20 items-center justify-center rounded-full bg-zinc-800 text-2xl font-bold admin-shell-text ring-2 ring-zinc-700',
    'flex size-20 items-center justify-center rounded-full admin-rank-badge text-2xl font-bold admin-shell-text',
  ],
  ['mt-1 w-px flex-1 bg-zinc-800', 'mt-1 w-px flex-1 bg-[var(--admin-border-subtle)]'],
  [
    '? "border-zinc-600 bg-zinc-800 admin-shell-text"',
    '? "admin-surface-segment-btn-active admin-shell-text"',
  ],
  [
    ': "admin-shell-border bg-zinc-900/40 text-zinc-500 hover:border-zinc-700 hover:admin-surface-body"',
    ': "admin-shell-border admin-surface-card text-zinc-500 hover:admin-surface-body"',
  ],
  ['active ? "bg-zinc-700 admin-surface-body" : "bg-zinc-800 text-zinc-600"', 'active ? "admin-surface-segment-btn-active admin-surface-body" : "admin-surface-segment-btn"'],
  [
    '? "border-sa-accent-30 bg-zinc-900 text-sa-accent-muted"',
    '? "border-sa-accent-30 admin-surface-card text-sa-accent-muted"',
  ],
  [
    ': "border-red-500/30 bg-zinc-900 text-red-300"',
    ': "border-red-500/30 admin-surface-card text-red-300"',
  ],
  [
    '? "border-ra-primary-30 bg-zinc-900 text-ra-primary-muted"',
    '? "border-ra-primary-30 admin-surface-card text-ra-primary-muted"',
  ],
  ['bg-zinc-900/60', 'admin-surface-card'],
  ['bg-zinc-900/40', 'admin-surface-card'],
  ['bg-zinc-800 text-zinc-600', 'admin-surface-segment-btn'],
  ['badge:    "bg-zinc-800 text-zinc-400"', 'badge:    "bg-[var(--admin-hover-strong)] admin-surface-muted"'],
  ['border admin-shell-border bg-zinc-950/40', 'border admin-shell-border admin-surface-card'],
  ['border admin-shell-border bg-zinc-950/60', 'border admin-shell-border admin-surface-input'],
  ['border admin-shell-border bg-zinc-950/70', 'border admin-shell-border admin-surface-card'],
  ['border admin-shell-border bg-zinc-950/80', 'border admin-shell-border admin-surface-card'],
  ['border admin-shell-border bg-zinc-950/95', 'border admin-shell-border admin-surface-card backdrop-blur'],
  ['border-l admin-shell-border bg-zinc-950 p-4', 'border-l admin-shell-border admin-surface-card-solid p-4'],
  ['border admin-shell-border bg-zinc-950 px-2', 'border admin-shell-border admin-surface-input px-2'],
  ['thead className="bg-zinc-950/70', 'thead className="admin-table-head'],
  ['className="bg-zinc-950/30"', 'className="admin-surface-card"'],
  ['bg-zinc-800 admin-surface-body hover:bg-zinc-700', 'admin-surface-segment-btn admin-surface-body'],
  ['border admin-shell-border bg-zinc-900 shadow-2xl', 'border admin-shell-border admin-surface-card-solid shadow-2xl'],
  ['bg-zinc-900 text-zinc-400 ring-1 ring-zinc-800', 'admin-surface-card admin-surface-muted ring-1 admin-shell-border'],
  ['aspect-[5/3] bg-zinc-800', 'aspect-[5/3] admin-progress-track'],
  ['rounded bg-zinc-800', 'rounded admin-progress-track'],
  ['rounded-xl bg-zinc-800', 'rounded-xl admin-progress-track'],
  ['?? "bg-zinc-800 border-zinc-700"', '?? "admin-surface-card admin-shell-border"'],
  [
    '? "border-zinc-500 bg-zinc-800 admin-shell-text ring-1 ring-zinc-600"',
    '? "admin-surface-segment-btn-active admin-shell-text ring-1 admin-shell-border"',
  ],
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (name.endsWith(".jsx") || name.endsWith(".tsx")) files.push(p);
  }
  return files;
}

let changed = 0;
for (const sub of DIRS) {
  const dir = path.join(ROOT, sub);
  for (const file of walk(dir)) {
    let text = fs.readFileSync(file, "utf8");
    const orig = text;
    for (const [from, to] of REPLACEMENTS) {
      text = text.split(from).join(to);
    }
    if (text !== orig) {
      fs.writeFileSync(file, text);
      changed++;
      console.log("updated:", path.relative(process.cwd(), file));
    }
  }
}
console.log(`Done. ${changed} file(s) updated.`);
