/**
 * Replace common dark-only zinc shells in admin page.jsx with semantic CSS classes.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

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
    "overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50",
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
];

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (name === "page.jsx") acc.push(p);
  }
  return acc;
}

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let changed = false;
  for (const [from, to] of REPLACEMENTS) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      changed = true;
    }
  }
  if (!changed) return false;
  fs.writeFileSync(filePath, content);
  return true;
}

const pages = [
  ...walk(path.join(root, "src", "app", "(app)")),
  ...walk(path.join(root, "src", "app", "super-admin")),
];

let n = 0;
for (const f of pages) {
  if (migrateFile(f)) {
    console.log(path.relative(root, f));
    n++;
  }
}
console.log(`Updated ${n} page(s).`);
