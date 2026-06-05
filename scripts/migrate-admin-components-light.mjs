import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const DIRS = [
  "src/components/views",
  "src/components/pos",
  "src/components/reservations",
  "src/components/dashboard",
  "src/components/rms",
  "src/components/settings",
  "src/components/payment-settings",
];

const REPLACEMENTS = [
  ["rounded-2xl border border-zinc-800 bg-zinc-900/70", "admin-surface-card"],
  ["rounded-2xl border border-zinc-800 bg-zinc-900/60", "admin-surface-card"],
  ["rounded-2xl border border-zinc-800 bg-zinc-900/50", "admin-surface-card"],
  ["rounded-2xl border border-zinc-800 bg-zinc-900/40", "admin-surface-card"],
  ["rounded-xl border border-zinc-800 bg-zinc-900/70", "admin-surface-card"],
  ["rounded-xl border border-zinc-800 bg-zinc-900/60", "admin-surface-card"],
  ["rounded-xl border border-zinc-800 bg-zinc-900/50", "admin-surface-card"],
  ["rounded-xl border border-zinc-800 bg-zinc-900/40", "admin-surface-card"],
  [
    "overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60",
    "admin-surface-table-shell",
  ],
  [
    "overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60",
    "admin-surface-table-shell",
  ],
  ["mb-1 block text-xs font-medium text-zinc-500", "admin-surface-label"],
  ["block text-xs font-medium text-zinc-500", "admin-surface-label"],
  [
    "text-xs font-medium uppercase tracking-wider text-zinc-500",
    "admin-surface-label",
  ],
  [
    "w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus-ra-primary",
    "admin-surface-input focus-ra-primary px-3 py-2",
  ],
  [
    "w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus-ra-primary",
    "admin-surface-input focus-ra-primary px-3 py-2.5",
  ],
  [
    "mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus-ra-primary",
    "admin-surface-input focus-ra-primary mt-1 px-3 py-2.5",
  ],
];

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (/\.(jsx|tsx)$/.test(name)) acc.push(p);
  }
  return acc;
}

let n = 0;
for (const rel of DIRS) {
  const dir = path.join(root, rel);
  for (const f of walk(dir)) {
    let content = fs.readFileSync(f, "utf8");
    let changed = false;
    for (const [from, to] of REPLACEMENTS) {
      if (content.includes(from)) {
        content = content.split(from).join(to);
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(f, content);
      console.log(path.relative(root, f));
      n++;
    }
  }
}
console.log(`Updated ${n} component file(s).`);
