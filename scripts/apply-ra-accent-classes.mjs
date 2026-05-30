import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("src");

const DIRS = [
  "app/(app)",
  "components/rms",
  "components/dashboard",
  "components/analytics",
  "components/payment-settings",
  "components/inventory",
  "components/pos",
  "components/views",
];

const REPLACEMENTS = [
  ["bg-emerald-500/15 text-emerald-400 ring-emerald-500/25", "ra-status-badge"],
  ["bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25", "ra-status-badge"],
  ["bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25", "ra-status-badge"],
  ["border-emerald-500/30 bg-zinc-900 text-emerald-300", "border-ra-accent-30 bg-zinc-900 text-ra-accent-muted"],
  ["border-emerald-500/30 bg-emerald-500/10 text-emerald-300", "border-ra-accent-30 bg-ra-accent-10 text-ra-accent-muted"],
  ["border-emerald-500/25 bg-emerald-500/10 text-emerald-400", "border-ra-accent-25 bg-ra-accent-10 text-ra-accent"],
  ["positive ? \"border-emerald-500/25 bg-emerald-500/10 text-emerald-400\"", "positive ? \"border-ra-accent-25 bg-ra-accent-10 text-ra-accent\""],
  ["border-emerald-500/20 bg-emerald-500/5", "border-ra-accent-20 bg-ra-accent-5"],
  ["from-emerald-600 to-emerald-400", "from-ra-accent to-ra-primary"],
  ["hover:from-emerald-500 hover:to-emerald-300", "hover:opacity-90"],
];

function globDir(dir, ext) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  const out = [];
  for (const ent of fs.readdirSync(full, { withFileTypes: true })) {
    const p = path.join(full, ent.name);
    if (ent.isDirectory()) out.push(...globDir(path.relative(ROOT, p), ext));
    else if (ent.name.endsWith(ext)) out.push(p);
  }
  return out;
}

const FILES = DIRS.flatMap((d) => globDir(d, ".jsx"));

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
