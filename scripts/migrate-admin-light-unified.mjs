/**
 * Unified light-theme migration — semantic admin classes across admin UI.
 * UTF-8 safe (Node only). Run: node scripts/migrate-admin-light-unified.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Longest-first replacements */
const REPLACEMENTS = [
  [
    "rounded-2xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 outline-none",
    "admin-surface-input focus-ra-primary w-full px-3 py-2.5 text-sm outline-none",
  ],
  [
    "rounded-xl border border-zinc-700 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 outline-none",
    "admin-surface-input focus-ra-primary w-full px-3 py-2 text-sm outline-none",
  ],
  [
    "w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none",
    "admin-surface-input focus-ra-primary w-full px-3 py-2.5 text-sm outline-none",
  ],
  [
    "w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100",
    "admin-surface-input focus-ra-primary w-full px-3 py-2.5 text-sm",
  ],
  ["rounded-2xl border border-zinc-800 bg-zinc-950/80", "admin-surface-card"],
  ["rounded-2xl border border-zinc-800 bg-zinc-950/60", "admin-surface-card"],
  ["rounded-2xl border border-zinc-800 bg-zinc-950/50", "admin-surface-card"],
  ["rounded-2xl border border-zinc-800 bg-zinc-900/80", "admin-surface-card"],
  ["rounded-2xl border border-zinc-800 bg-zinc-900/70", "admin-surface-card"],
  ["rounded-2xl border border-zinc-800 bg-zinc-900/60", "admin-surface-card"],
  ["rounded-xl border border-zinc-800 bg-zinc-950/80", "admin-surface-card"],
  ["rounded-xl border border-zinc-800 bg-zinc-950/60", "admin-surface-card"],
  ["rounded-xl border border-zinc-800 bg-zinc-900/60", "admin-surface-card"],
  ["border border-zinc-800 bg-zinc-950/60", "admin-surface-card"],
  ["border border-zinc-800 bg-zinc-950/50", "admin-surface-card"],
  ["border border-zinc-800 bg-zinc-900/50", "admin-surface-card"],
  ["border border-zinc-800 bg-zinc-900/40", "admin-surface-card"],
  ["bg-zinc-900/80 shadow", "admin-surface-card shadow"],
  ["bg-zinc-900/60 hover", "admin-surface-card hover"],
  ["text-2xl font-bold text-zinc-50", "admin-surface-heading text-2xl font-bold"],
  ["text-xl font-bold text-zinc-50", "admin-surface-heading text-xl font-bold"],
  ["text-xl font-semibold text-zinc-50", "admin-surface-heading text-xl font-semibold"],
  ["text-lg font-semibold text-zinc-50", "admin-surface-title text-lg font-semibold"],
  ["text-lg font-bold text-zinc-50", "admin-surface-title text-lg font-bold"],
  ["text-base font-semibold text-zinc-50", "admin-surface-title text-base font-semibold"],
  ["text-sm font-semibold text-zinc-100", "admin-surface-title text-sm font-semibold"],
  ["text-sm font-semibold text-zinc-50", "admin-surface-title text-sm font-semibold"],
  ["text-sm font-medium text-zinc-200", "text-sm font-medium admin-shell-text"],
  ["text-sm font-medium text-zinc-300", "text-sm font-medium admin-surface-body"],
  ["text-sm text-zinc-300", "text-sm admin-surface-body"],
  ["text-sm text-zinc-400", "text-sm admin-surface-muted"],
  ["text-sm text-zinc-500", "text-sm admin-surface-muted"],
  ["text-sm text-zinc-600", "text-sm admin-surface-faint"],
  ["text-xs font-semibold text-zinc-500", "admin-surface-label text-xs font-semibold"],
  ["text-xs font-medium text-zinc-500", "text-xs font-medium admin-surface-muted"],
  ["text-xs text-zinc-500", "text-xs admin-surface-muted"],
  ["text-xs text-zinc-600", "text-xs admin-surface-faint"],
  ["text-[10px] text-zinc-500", "text-[10px] admin-surface-faint"],
  ["text-[10px] text-zinc-600", "text-[10px] admin-surface-faint"],
  ["text-[11px] text-zinc-500", "text-[11px] admin-surface-faint"],
  ["text-zinc-100", "admin-shell-text"],
  ["text-zinc-200", "admin-shell-text"],
  ["text-zinc-300", "admin-surface-body"],
  ["border-b border-zinc-800/80", "border-b admin-shell-border"],
  ["border-t border-zinc-800/80", "border-t admin-shell-border"],
  ["border-b border-zinc-800", "border-b admin-shell-border"],
  ["border-t border-zinc-800", "border-t admin-shell-border"],
  ["border-r border-zinc-800", "border-r admin-shell-border"],
  ["border-l border-zinc-800", "border-l admin-shell-border"],
  ["border border-zinc-800", "border admin-shell-border"],
  ["border border-zinc-700", "border admin-shell-border"],
  ["border-zinc-800", "admin-shell-border"],
  ["divide-y divide-zinc-800/60", "divide-y admin-shell-divider"],
  ["divide-y divide-zinc-800", "divide-y admin-shell-divider"],
  ["hover:bg-zinc-800/50", "hover:bg-[var(--admin-hover)]"],
  ["hover:bg-zinc-800/40", "hover:bg-[var(--admin-hover)]"],
  ["hover:bg-zinc-800/30", "hover:bg-[var(--admin-hover)]"],
  ["hover:bg-zinc-800/20", "hover:bg-[var(--admin-hover)]"],
  ["hover:bg-zinc-800", "hover:bg-[var(--admin-hover)]"],
  ["hover:bg-zinc-900", "hover:bg-[var(--admin-hover)]"],
  ["bg-zinc-800/70", "bg-[var(--admin-hover-strong)]"],
  ["bg-zinc-800/60", "admin-surface-segment-track"],
  ["bg-zinc-800/50", "admin-surface-segment-track"],
  ["bg-zinc-800/40", "admin-surface-segment-track"],
  ["placeholder:text-zinc-600", "placeholder:admin-surface-faint"],
  ["placeholder:text-zinc-500", "placeholder:admin-surface-faint"],
  [
    "rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-500",
    "admin-surface-btn-ghost px-4 py-2 text-sm transition-colors",
  ],
  [
    "rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-200",
    "admin-surface-btn-ghost px-4 py-2 text-sm",
  ],
];

const TARGETS = [
  path.join(root, "src", "app", "(app)"),
  path.join(root, "src", "app", "super-admin"),
  path.join(root, "src", "components"),
];

const SKIP_DIRS = new Set([
  path.join(root, "src", "components", "auth"),
  path.join(root, "src", "components", "customer"),
  path.join(root, "src", "components", "payments"),
]);

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) {
      if (!SKIP_DIRS.has(p)) walk(p, acc);
    } else if (/\.(jsx|tsx)$/.test(name)) acc.push(p);
  }
  return acc;
}

let files = 0;
let subs = 0;
const seen = new Set();
for (const base of TARGETS) {
  for (const f of walk(base)) {
    if (seen.has(f)) continue;
    seen.add(f);
    let content = fs.readFileSync(f, "utf8");
    let changed = false;
    for (const [from, to] of REPLACEMENTS) {
      if (content.includes(from)) {
        const n = content.split(from).length - 1;
        content = content.split(from).join(to);
        subs += n;
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(f, content, "utf8");
      console.log(path.relative(root, f));
      files++;
    }
  }
}
console.log(`Unified pass: ${files} file(s), ${subs} replacement(s).`);
