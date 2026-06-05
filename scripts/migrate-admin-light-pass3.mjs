/**
 * Light-theme pass 3 — admin-scoped components (UTF-8 safe, Node only).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const DIRS = [
  "src/components/pos",
  "src/components/payment-settings",
  "src/components/analytics",
  "src/components/views",
  "src/components/reservations",
  "src/components/inventory",
  "src/components/rms",
];

const REPLACEMENTS = [
  ["border-b border-zinc-800", "border-b admin-shell-border"],
  ["border-t border-zinc-800", "border-t admin-shell-border"],
  ["border border-zinc-800", "border admin-shell-border"],
  ["divide-y divide-zinc-800", "divide-y admin-shell-divider"],
  ["divide-y divide-zinc-800/60", "divide-y admin-shell-divider"],
  ["divide-y divide-zinc-800/80", "divide-y admin-shell-divider"],
  ["text-zinc-500", "admin-surface-muted"],
  ["text-zinc-600", "admin-surface-faint"],
  ["text-zinc-400", "admin-surface-muted"],
  [
    "w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100",
    "admin-surface-input w-full px-3 py-2 text-sm",
  ],
  [
    "w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100",
    "admin-surface-input w-full px-3 py-2.5 text-sm",
  ],
  ["rounded-2xl border border-zinc-800 bg-zinc-900/60", "admin-surface-card"],
  ["rounded-xl border border-zinc-800 bg-zinc-950/50", "rounded-xl border admin-shell-border bg-[var(--admin-hover)]"],
  ["hover:bg-zinc-800/30", "hover:bg-[var(--admin-hover)]"],
  ["hover:bg-zinc-800/40", "hover:bg-[var(--admin-hover)]"],
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(jsx|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

let total = 0;
for (const rel of DIRS) {
  const dir = path.join(root, rel);
  for (const file of walk(dir)) {
    let c = fs.readFileSync(file, "utf8");
    let n = 0;
    for (const [a, b] of REPLACEMENTS) {
      if (c.includes(a)) {
        const parts = c.split(a);
        if (parts.length > 1) {
          c = parts.join(b);
          n += parts.length - 1;
        }
      }
    }
    if (n) {
      fs.writeFileSync(file, c, "utf8");
      console.log(path.relative(root, file), n);
      total += n;
    }
  }
}
console.log("done", total);
