import fs from "fs";
import path from "path";

const REFRESH_PATTERNS = [
  'inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border admin-shell-border px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:admin-shell-text disabled:opacity-50 sm:w-auto',
  'inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border admin-shell-border px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:admin-shell-text sm:w-auto',
  'inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border admin-shell-border px-3 py-2.5 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:admin-shell-text sm:w-auto',
  'inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border admin-shell-border px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:admin-shell-text disabled:opacity-50 sm:order-last sm:w-auto',
  'inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border admin-shell-border px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:admin-shell-text disabled:opacity-50 sm:w-auto',
  'inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border admin-shell-border px-3 py-2.5 text-sm admin-surface-body transition-colors hover:border-zinc-500 disabled:opacity-50 sm:w-auto',
];

const PRIMARY_REPLACEMENTS = [
  {
    from: 'className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-ra-primary px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:brightness-110 sm:w-auto"',
    to: "className={raPagePrimaryBtnCls}",
  },
  {
    from: 'className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-ra-primary px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:brightness-110 sm:w-auto"',
    to: "className={raPagePrimaryBtnCls}",
  },
  {
    from: 'className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-ra-primary px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:brightness-110 disabled:opacity-40 sm:w-auto"',
    to: 'className={`${raPagePrimaryBtnCls} disabled:opacity-40`}',
  },
  {
    from: 'className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-ra-primary px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:brightness-110 disabled:opacity-50 sm:w-auto"',
    to: 'className={`${raPagePrimaryBtnCls} disabled:opacity-50`}',
  },
  {
    from: 'className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-ra-primary px-5 py-2.5 text-sm font-bold text-zinc-950 shadow-ra-primary-glow hover:brightness-110 active:scale-[0.98] sm:w-auto"',
    to: "className={raPagePrimaryBtnCls}",
  },
  {
    from: 'className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-ra-primary px-4 py-2 text-sm font-bold text-zinc-950 shadow-ra-primary-glow hover:brightness-110 active:scale-[0.98] sm:w-auto"',
    to: 'className={`${raPagePrimaryBtnCls} px-4 py-2 text-sm font-bold`}',
  },
];

const SA_REFRESH_PATTERNS = [
  "cursor-pointer flex w-full items-center justify-center gap-1.5 rounded-xl border admin-shell-border px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:admin-shell-text sm:w-auto",
  "cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl border admin-shell-border px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:admin-shell-text disabled:opacity-50 sm:w-auto",
  "cursor-pointer inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-xl border admin-shell-border px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:admin-shell-text sm:w-auto",
];

const WRAPPER_OLD = [
  'className="flex w-full min-w-0 flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center"',
  'className="flex w-full min-w-0 shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap"',
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules") walk(full, files);
    else if (/\.(jsx|tsx)$/.test(entry.name)) files.push(full);
  }
  return files;
}

function ensureThemeImports(content) {
  const needsRefresh = content.includes("{raPageRefreshBtnCls}");
  const needsPrimary = content.includes("raPagePrimaryBtnCls");
  if (!needsRefresh && !needsPrimary) return content;

  const importRe = /import \{([^}]+)\} from "@\/config\/restaurantAdminTheme";/;
  const toAdd = [];
  if (needsRefresh) toAdd.push("raPageRefreshBtnCls");
  if (needsPrimary) toAdd.push("raPagePrimaryBtnCls");

  if (importRe.test(content)) {
    return content.replace(importRe, (_m, inner) => {
      const parts = inner.split(",").map((s) => s.trim()).filter(Boolean);
      for (const imp of toAdd) {
        if (!parts.includes(imp)) parts.push(imp);
      }
      return `import { ${parts.join(", ")} } from "@/config/restaurantAdminTheme";`;
    });
  }

  const firstImport = content.indexOf("import ");
  if (firstImport < 0) return content;
  return (
    content.slice(0, firstImport) +
    `import { ${toAdd.join(", ")} } from "@/config/restaurantAdminTheme";\n` +
    content.slice(firstImport)
  );
}

const changed = [];

for (const file of walk("src")) {
  let content = fs.readFileSync(file, "utf8");
  const original = content;

  for (const pattern of REFRESH_PATTERNS) {
    content = content.split(`className="${pattern}"`).join("className={raPageRefreshBtnCls}");
  }

  for (const { from, to } of PRIMARY_REPLACEMENTS) {
    content = content.split(from).join(to);
  }

  for (const pattern of SA_REFRESH_PATTERNS) {
    content = content.split(`className="${pattern}"`).join("className={raPageRefreshBtnCls}");
  }

  for (const pattern of WRAPPER_OLD) {
    content = content.split(pattern).join('className="admin-page-header-actions"');
  }

  content = ensureThemeImports(content);

  if (content !== original) {
    fs.writeFileSync(file, content);
    changed.push(path.relative(".", file));
  }
}

console.log(`Updated ${changed.length} files:`);
changed.forEach((f) => console.log(` - ${f}`));
