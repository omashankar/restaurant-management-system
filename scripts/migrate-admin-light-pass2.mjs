import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const REPLACEMENTS = [
  ["rounded-2xl border border-zinc-800 bg-zinc-950/60", "admin-surface-card"],
  ["rounded-2xl border border-zinc-800 bg-zinc-950/40", "admin-surface-card"],
  ["rounded-xl border border-zinc-800 bg-zinc-950/60", "admin-surface-card"],
  ["rounded-xl border border-zinc-800 bg-zinc-950/80", "admin-surface-card"],
  ["border border-zinc-800 bg-zinc-900/60", "admin-surface-card"],
  ["border border-zinc-800 bg-zinc-900/50", "admin-surface-card"],
  ["border border-zinc-800 bg-zinc-900/40", "admin-surface-card"],
  ["border border-zinc-800 bg-zinc-950/40", "admin-surface-card"],
  ["border border-zinc-800 bg-zinc-950/60", "admin-surface-card"],
  ["min-h-screen bg-zinc-950", "min-h-screen admin-shell-bg"],
  ["divide-zinc-800", "admin-shell-border divide-y"],
  ["hover:bg-zinc-800/40", "hover:admin-shell-hover"],
  ["hover:bg-zinc-800/60", "hover:admin-shell-hover"],
  ["hover:bg-zinc-800/20", "hover:admin-shell-hover"],
  ["bg-zinc-800/40", "admin-surface-segment-track"],
  ["bg-zinc-800/60", "admin-surface-segment-track"],
  ["bg-zinc-950/40", "admin-surface-segment-track"],
  ["bg-zinc-950/60", "admin-surface-card"],
  ["bg-zinc-900/70", "admin-surface-card"],
  [
    "rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100",
    "admin-surface-input focus-ra-primary px-3 py-2 text-sm",
  ],
  [
    "rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100",
    "admin-surface-input focus-ra-primary px-3 py-2.5 text-sm",
  ],
  ["text-zinc-100", "admin-shell-text"],
  ["text-zinc-200", "admin-shell-text"],
  ["text-zinc-300", "admin-surface-body"],
];

const TARGETS = [
  path.join(root, "src", "app", "(app)"),
  path.join(root, "src", "app", "super-admin"),
  path.join(root, "src", "components", "views"),
  path.join(root, "src", "components", "pos"),
  path.join(root, "src", "components", "reservations"),
  path.join(root, "src", "components", "dashboard"),
];

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, acc);
    else if (/\.(jsx|tsx)$/.test(name)) acc.push(p);
  }
  return acc;
}

let n = 0;
const seen = new Set();
for (const base of TARGETS) {
  for (const f of walk(base)) {
    if (seen.has(f)) continue;
    seen.add(f);
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
console.log(`Pass 2: ${n} file(s).`);
