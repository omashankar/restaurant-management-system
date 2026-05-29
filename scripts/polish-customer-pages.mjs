import fs from "fs";
import path from "path";

const root = "src/app/(customer)";

const pairs = [
  ["bg-gray-50 min-h-screen", "ct-page-shell"],
  ["min-h-screen bg-gray-50", "ct-page-shell"],
  ["bg-gray-50 min-h-[", "ct-page-shell min-h-["],
  ["flex min-h-screen items-center justify-center bg-gray-50", "ct-page-shell flex min-h-screen items-center justify-center"],
  ["bg-gray-50 min-h-screen", "ct-page-shell"],
  ["bg-gray-50 py-10", "bg-[var(--customer-cream)] py-10"],
  ["bg-gray-50 p-8", "bg-[var(--customer-cream)] p-8"],
  ["rounded-3xl bg-gray-50", "rounded-3xl bg-[var(--customer-cream)]"],
  ["bg-white border-b border-gray-100", "ct-page-header"],
  ["border-b border-gray-100", "border-b border-customer-border"],
  ["text-gray-500", "text-customer-muted"],
  ["text-gray-400", "text-customer-muted"],
  ["text-gray-600", "text-customer-muted"],
  ["text-gray-800", "text-customer-text"],
  ["text-gray-700", "text-customer-text"],
  ["text-gray-300", "text-customer-muted"],
  ["border-gray-200", "border-customer-border"],
  ["border-gray-100", "border-customer-border"],
  ["divide-gray-100", "divide-customer-border"],
  ["bg-gray-200", "bg-[var(--customer-border)]"],
  ["hover:text-gray-600", "hover:text-customer-text"],
  ["placeholder:text-gray-400", "placeholder:text-customer-muted"],
  ["shadow-gray-100", "shadow-[var(--customer-primary-shadow)]"],
  ["border border-gray-200 bg-white", "border border-customer-border bg-[var(--customer-card)]"],
  ["rounded-2xl bg-white", "ct-surface-card"],
  ["rounded-3xl bg-white", "ct-surface-card rounded-3xl"],
  ["overflow-hidden rounded-2xl bg-white", "overflow-hidden ct-surface-card"],
  ["bg-[#111827] text-white", "bg-customer-text text-white"],
];

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full);
    else if (ent.name.endsWith(".jsx") && ent.name !== "layout.jsx") {
      let c = fs.readFileSync(full, "utf8");
      const orig = c;
      for (const [from, to] of pairs) {
        while (c.includes(from)) c = c.replace(from, to);
      }
      if (c !== orig) {
        fs.writeFileSync(full, c);
        console.log(full);
      }
    }
  }
}

walk(root);
