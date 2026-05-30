import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("src");

const DIRS = [
  "app/(app)",
  "components/rms",
  "components/settings",
  "components/dashboard",
  "components/analytics",
  "components/payment-settings",
  "components/inventory",
  "components/pos",
  "components/views",
  "components/menu",
  "components/reservations",
  "components/customer-site",
  "components/ui",
  "components/table",
  "components/auth",
];

const REPLACEMENTS = [
  ["focus:border-emerald-500/45 focus:ring-2 focus:ring-emerald-500/15", "focus-ra-primary focus:ring-2 focus:ring-ra-primary-25"],
  ["focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/15", "focus-ra-primary focus:ring-2 focus:ring-ra-primary-25"],
  ["focus-within:border-emerald-500/50", "focus-within-ra-primary"],
  ["hover:shadow-emerald-400/25", "hover:shadow-ra-primary-soft"],
  ["hover:shadow-emerald-500/10", "hover:shadow-ra-primary-soft"],
  ["hover:shadow-xl hover:shadow-emerald-500/10", "hover:shadow-xl hover:shadow-ra-primary-soft"],
  ["hover:border-emerald-500/35", "hover-border-ra-primary-40"],
  ["hover:border-emerald-500/50", "hover-border-ra-primary-50"],
  ["hover:border-emerald-500/30", "hover-border-ra-primary-30"],
  ["hover:text-emerald-100", "hover:text-ra-primary-muted"],
  ["hover:text-emerald-200", "hover:text-ra-primary-muted"],
  ["hover:text-emerald-300", "hover:text-ra-primary-muted"],
  ["hover:text-emerald-400", "hover-ra-primary"],
  ["hover:bg-emerald-400", "hover:brightness-110"],
  ["hover:bg-emerald-500/10", "hover-bg-ra-primary-10"],
  ["hover:bg-emerald-500/25", "hover-bg-ra-primary-15"],
  ["focus-within:border-emerald-500/40", "focus-within-ra-primary"],
  ["focus-within:border-emerald-500/45", "focus-within-ra-primary"],
  ["focus:border-emerald-500/50", "focus-ra-primary"],
  ["focus:border-emerald-500/45", "focus-ra-primary"],
  ["focus:border-emerald-500/40", "focus-ra-primary"],
  ["focus:ring-emerald-500/20", "focus:ring-ra-primary-25"],
  ["focus:ring-emerald-500/15", "focus:ring-ra-primary-25"],
  ["border-emerald-500/60 bg-emerald-500/10 ring-1 ring-emerald-500/25", "border-ra-primary-60 bg-ra-primary-10 ring-1 ring-ra-primary-25"],
  ["border-emerald-500/50 bg-emerald-500/10 ring-1 ring-emerald-500/30", "border-ra-primary-50 bg-ra-primary-10 ring-1 ring-ra-primary-25"],
  ["border-emerald-500/40 bg-emerald-500/15 text-emerald-300", "border-ra-primary-40 bg-ra-primary-15 text-ra-primary-muted"],
  ["border-emerald-500/40 bg-emerald-500/10 text-emerald-300", "border-ra-primary-40 bg-ra-primary-10 text-ra-primary-muted"],
  ["border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10", "border-ra-primary-40 text-ra-primary-muted hover-bg-ra-primary-10"],
  ["border-emerald-500/30 bg-emerald-500/5", "border-ra-primary-30 bg-ra-primary-5"],
  ["border-emerald-500/30 bg-zinc-900 text-emerald-300", "border-ra-primary-30 bg-zinc-900 text-ra-primary-muted"],
  ["border-emerald-500/25 bg-emerald-500/10 text-emerald-400", "border-ra-primary-25 bg-ra-primary-10 text-ra-primary"],
  ["border-emerald-500/25 bg-emerald-500/8", "border-ra-primary-25 bg-ra-primary-10"],
  ["border-emerald-500/20 bg-emerald-500/10 text-emerald-400", "border-ra-accent-20 bg-ra-accent-10 text-ra-accent"],
  ["bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/40", "bg-ra-primary-20 text-ra-primary ring-2 ring-ra-primary-40"],
  ["bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25", "bg-ra-primary-15 text-ra-primary ring-1 ring-ra-primary-25"],
  ["bg-emerald-500/15 text-emerald-300 ring-emerald-500/30", "ra-status-badge"],
  ["bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25", "bg-ra-primary-15 text-ra-primary-muted ring-1 ring-ra-primary-25"],
  ["bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20", "bg-ra-primary-10 text-ra-primary ring-1 ring-ra-primary-20"],
  ["bg-emerald-500/90 text-zinc-950 ring-emerald-400/50", "bg-ra-primary-90 text-zinc-950 ring-ra-primary-40"],
  ["shadow-lg shadow-emerald-500/25", "shadow-ra-primary-glow"],
  ["shadow-lg shadow-emerald-500/20", "shadow-ra-primary-glow"],
  ["shadow-md shadow-emerald-500/20", "shadow-ra-primary-glow"],
  ["shadow-sm shadow-emerald-500/20", "shadow-ra-primary-glow"],
  ["shadow-emerald-900/30", "shadow-ra-primary-glow"],
  ["ring-2 ring-emerald-500/60", "ring-2 ring-ra-primary-40"],
  ["ring-emerald-500/60", "ring-ra-primary-40"],
  ["border-t-emerald-400", "border-t-ra-primary"],
  ["border-l-emerald-400", "border-l-ra-accent"],
  ["ring-emerald-500/25", "ring-ra-primary-25"],
  ["ring-emerald-500/20", "ring-ra-primary-20"],
  ["ring-emerald-500/30", "ring-ra-primary-25"],
  ["ring-emerald-500/40", "ring-ra-primary-40"],
  ["border-emerald-500/60", "border-ra-primary-60"],
  ["border-emerald-500/50", "border-ra-primary-50"],
  ["border-emerald-500/40", "border-ra-primary-40"],
  ["border-emerald-500/35", "border-ra-primary-40"],
  ["border-emerald-500/30", "border-ra-primary-30"],
  ["border-emerald-500/25", "border-ra-primary-25"],
  ["border-emerald-500/20", "border-ra-primary-20"],
  ["bg-emerald-600", "bg-ra-primary"],
  ["bg-emerald-500/30", "bg-ra-primary-20"],
  ["bg-emerald-500/20", "bg-ra-primary-20"],
  ["bg-emerald-500/15", "bg-ra-primary-15"],
  ["bg-emerald-500/10", "bg-ra-primary-10"],
  ["bg-emerald-500/8", "bg-ra-primary-10"],
  ["bg-emerald-500/5", "bg-ra-primary-5"],
  ["text-emerald-400/90", "text-ra-primary-muted"],
  ["text-emerald-600", "text-ra-accent"],
  ["text-emerald-500", "text-ra-primary"],
  ["text-emerald-400", "text-ra-primary"],
  ["text-emerald-300", "text-ra-primary-muted"],
  ["from-emerald-600/80 to-emerald-400/90", "from-ra-primary to-ra-accent"],
  ["from-emerald-500/70 to-emerald-600/50", "from-ra-primary to-ra-accent"],
  ["bg-emerald-500 px-5 py-2.5", "bg-ra-primary px-5 py-2.5"],
  ["bg-emerald-500 px-4 py-2.5", "bg-ra-primary px-4 py-2.5"],
  ["bg-emerald-500 px-4 py-2", "bg-ra-primary px-4 py-2"],
  ["bg-emerald-500 py-2", "bg-ra-primary py-2"],
  ["rounded-xl bg-emerald-500", "rounded-xl bg-ra-primary"],
  ["scale-[1.02] bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/25", "scale-[1.02] bg-ra-primary text-zinc-950 shadow-ra-primary-glow"],
  ["? \"bg-emerald-500 text-zinc-950 shadow-md\"", "? \"bg-ra-primary text-zinc-950 shadow-md\""],
  ['checked ? "bg-emerald-500"', 'checked ? "bg-ra-primary"'],
  ['? "bg-emerald-500 text-zinc-950"', '? "bg-ra-primary text-zinc-950"'],
  ["bg-emerald-500", "bg-ra-primary"],
  ["accent-emerald-500", "accent-ra-primary"],
  ["ring-emerald-500/0", "ring-ra-primary-20"],
  ["focus-visible:ring-emerald-500/50", "focus-visible:ring-ra-primary-40"],
  ['color: "text-emerald-400"', 'color: "text-ra-primary"'],
  ['tone: "text-emerald-400"', 'tone: "text-ra-primary"'],
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
