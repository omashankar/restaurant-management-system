import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("src");

const FILES = [
  ...globDir(path.join(ROOT, "app/super-admin"), ".jsx"),
  ...globDir(path.join(ROOT, "components/super-admin"), ".jsx"),
];

const REPLACEMENTS = [
  ["hover:bg-rose-400", "hover:brightness-110"],
  ["hover:text-rose-300", "hover:text-sa-primary-muted"],
  ["hover:text-rose-400", "hover-sa-primary"],
  ["hover:border-rose-500/40", "hover-border-sa-primary-40"],
  ["hover:bg-rose-500/15", "hover-bg-sa-primary-15"],
  ["hover:bg-rose-500/10", "hover-bg-sa-primary-10"],
  ["focus-within:border-rose-500/40", "focus-within-sa-primary"],
  ["focus-within:border-rose-500/50", "focus-within-sa-primary"],
  ["focus:border-rose-500/50", "focus-sa-primary"],
  ["focus:border-rose-500/45", "focus-sa-primary"],
  ["focus:border-rose-500/40", "focus-sa-primary"],
  ["focus:ring-rose-500/15", "focus:ring-sa-primary-25"],
  ["border-rose-500/50 bg-rose-500/10 ring-1 ring-rose-500/30", "border-sa-primary-50 bg-sa-primary-10 ring-1 ring-sa-primary-25"],
  ["border-rose-500/40 bg-rose-500/15 text-rose-300", "border-sa-primary-40 bg-sa-primary-15 text-sa-primary-muted"],
  ["border-rose-500/40 bg-rose-500/10 text-rose-400", "border-sa-primary-40 bg-sa-primary-10 text-sa-primary"],
  ["border-rose-500/25 bg-rose-500/10 text-rose-400", "border-sa-primary-25 bg-sa-primary-10 text-sa-primary"],
  ["border-rose-500/30 bg-zinc-900 text-rose-300", "border-sa-primary-30 bg-zinc-900 text-sa-primary-muted"],
  ["border-rose-500/40 bg-rose-500/15 px-3 py-1.5 text-xs font-medium text-rose-300", "border-sa-primary-40 bg-sa-primary-15 px-3 py-1.5 text-xs font-medium text-sa-primary-muted"],
  ["bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/25", "bg-sa-primary-15 text-sa-primary ring-1 ring-sa-primary-25"],
  ["bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/25", "bg-sa-primary-15 text-sa-primary-muted ring-1 ring-sa-primary-25"],
  ["bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20", "bg-sa-primary-10 text-sa-primary ring-1 ring-sa-primary-20"],
  ["bg-rose-500/10 text-2xl font-bold text-rose-400 ring-1 ring-rose-500/20", "bg-sa-primary-10 text-2xl font-bold text-sa-primary ring-1 ring-sa-primary-20"],
  ["bg-rose-500/5 border border-rose-500/20", "bg-sa-primary-5 border border-sa-primary-20"],
  ["text-rose-400 bg-rose-500/5 border border-rose-500/20", "text-sa-primary bg-sa-primary-5 border border-sa-primary-20"],
  ["shadow-lg shadow-rose-900/30", "shadow-sa-primary-glow"],
  ["border-t-rose-400", "border-t-sa-primary"],
  ["ring-rose-500/25", "ring-sa-primary-25"],
  ["ring-rose-500/20", "ring-sa-primary-20"],
  ["ring-rose-500/40", "ring-sa-primary-40"],
  ["border-rose-500/50", "border-sa-primary-50"],
  ["border-rose-500/40", "border-sa-primary-40"],
  ["border-rose-500/30", "border-sa-primary-30"],
  ["border-rose-500/25", "border-sa-primary-25"],
  ["border-rose-500/20", "border-sa-primary-20"],
  ["bg-rose-500/30", "bg-sa-primary-20"],
  ["bg-rose-500/15", "bg-sa-primary-15"],
  ["bg-rose-500/10", "bg-sa-primary-10"],
  ["bg-rose-500/5", "bg-sa-primary-5"],
  ["bg-rose-500 px-5 py-2.5", "bg-sa-primary px-5 py-2.5"],
  ["bg-rose-500 px-4 py-2.5", "bg-sa-primary px-4 py-2.5"],
  ["bg-rose-500 px-4 py-2", "bg-sa-primary px-4 py-2"],
  ["bg-rose-500 px-1.5", "bg-sa-primary px-1.5"],
  ["bg-rose-500/20 text-rose-300", "bg-sa-primary-20 text-sa-primary-muted"],
  ["text-rose-500", "text-sa-primary"],
  ["text-rose-400", "text-sa-primary"],
  ["text-rose-300", "text-sa-primary-muted"],
  ["? \"bg-rose-500 text-zinc-950\"", "? \"bg-sa-primary text-zinc-950\""],
  ['checked ? "bg-rose-500"', 'checked ? "bg-sa-primary"'],
  ['gw.enabled ? "bg-rose-500"', 'gw.enabled ? "bg-sa-primary"'],
  ['!gw.testMode ? "bg-rose-500"', '!gw.testMode ? "bg-sa-primary"'],
  ['active ? "text-rose-400"', 'active ? "text-sa-primary"'],
  ['isActive ? "text-rose-400"', 'isActive ? "text-sa-primary"'],
  ["bg-rose-500", "bg-sa-primary"],
  ["color = \"bg-rose-500\"", "color = \"bg-sa-primary\""],
  ["color=\"bg-rose-500\"", "color=\"bg-sa-primary\""],
];

function globDir(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...globDir(p, ext));
    else if (ent.name.endsWith(ext)) out.push(p);
  }
  return out;
}

for (const file of FILES) {
  let text = fs.readFileSync(file, "utf8");
  let changed = false;
  for (const [from, to] of REPLACEMENTS) {
    if (text.includes(from)) {
      text = text.split(from).join(to);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(file, text, "utf8");
    console.log("updated", path.relative(ROOT, file));
  }
}

console.log("done");
