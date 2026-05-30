import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("src");

const FILES = [
  ...globDir(path.join(ROOT, "app/super-admin"), ".jsx"),
  ...globDir(path.join(ROOT, "components/super-admin"), ".jsx"),
];

const REPLACEMENTS = [
  ["bg-emerald-500/15 text-emerald-400 ring-emerald-500/25", "sa-status-badge"],
  ["bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25", "sa-status-badge"],
  ["bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20", "sa-status-badge"],
  ["bg-emerald-500/10 text-2xl font-bold text-emerald-400 ring-1 ring-emerald-500/20", "bg-sa-accent-10 text-2xl font-bold text-sa-accent ring-1 ring-sa-accent-25"],
  ["bg-emerald-500/10 text-sm font-bold text-emerald-400 ring-1 ring-emerald-500/20", "bg-sa-accent-10 text-sm font-bold text-sa-accent ring-1 ring-sa-accent-25"],
  ["border-emerald-500/30 bg-zinc-900 text-emerald-300", "border-sa-accent-30 bg-zinc-900 text-sa-accent-muted"],
  ["border-emerald-500/20 bg-emerald-500/5", "border-sa-accent-20 bg-sa-accent-5"],
  ["border-emerald-500/20", "border-sa-accent-20"],
  ["bg-emerald-500/5", "bg-sa-accent-5"],
  ["bg-emerald-500/10", "bg-sa-accent-10"],
  ["bg-emerald-500/15", "bg-sa-accent-15"],
  ["bg-emerald-500/30", "bg-sa-accent-30"],
  ["bg-emerald-500", "bg-sa-accent"],
  ["ring-emerald-500/25", "ring-sa-accent-25"],
  ["ring-emerald-500/20", "ring-sa-accent-20"],
  ["text-emerald-500", "text-sa-accent"],
  ["text-emerald-400", "text-sa-accent"],
  ["text-emerald-300", "text-sa-accent-muted"],
  ["hover:bg-emerald-500/50", "hover:opacity-80"],
  ['color: "text-emerald-400"', 'color: "text-sa-accent"'],
  ['tone: "text-emerald-400"', 'tone: "text-sa-accent"'],
  ['paid:    "bg-emerald-500"', 'paid:    "bg-sa-accent"'],
  ['dot: "bg-emerald-500"', 'dot: "bg-sa-accent"'],
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
