import fs from "fs";
import path from "path";

const ROOT = path.join(process.cwd(), "src", "app");
const ICON_RE =
  /<span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-[^"]+">/g;

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (name === "page.jsx") files.push(p);
  }
  return files;
}

function ensureImport(text, isSa) {
  const imp = isSa ? "saIconBadgeCls" : "raIconBadgeCls";
  const from = isSa
    ? '@/config/superAdminTheme'
    : '@/config/restaurantAdminTheme';
  if (text.includes(imp)) return text;
  const line = `import { ${imp} } from "${from}";\n`;
  const useClient = text.match(/^"use client";\r?\n/);
  if (useClient) {
    return text.replace(useClient[0], `${useClient[0]}${line}`);
  }
  const idx = text.indexOf("\n\n");
  if (idx === -1) return line + text;
  return text.slice(0, idx + 1) + line + text.slice(idx + 1);
}

let n = 0;
for (const sub of ["super-admin", path.join("(app)")]) {
  for (const file of walk(path.join(ROOT, sub))) {
    let text = fs.readFileSync(file, "utf8");
    if (!ICON_RE.test(text)) continue;
    ICON_RE.lastIndex = 0;
    const isSa = file.includes(`${path.sep}super-admin${path.sep}`);
    const imp = isSa ? "saIconBadgeCls" : "raIconBadgeCls";
    const next = text.replace(
      ICON_RE,
      `<span className={\`mt-1 \${${imp}}\`}>`
    );
    if (next === text) continue;
    const out = ensureImport(next, isSa);
    fs.writeFileSync(file, out);
    n++;
    console.log(path.relative(process.cwd(), file));
  }
}
console.log(`Updated ${n} page(s).`);
