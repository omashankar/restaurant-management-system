import fs from "fs";
import path from "path";

const dirs = ["src/app/(customer)", "src/components/customer"];

const pairs = [
  ["text-[#FF6B35]", "text-customer-primary"],
  ["text-[#ff6b35]", "text-customer-primary"],
  ["text-[#6B7280]", "text-customer-muted"],
  ["text-[#111827]", "text-customer-text"],
  ["bg-[#FF6B35]", "bg-customer-primary"],
  ["bg-[#FFF8F3]", "bg-customer-cream"],
  ["border-[#FF6B35]", "border-customer-primary"],
  ["border-[#FFE4D6]", "border-customer-border"],
  ["divide-[#FFE4D6]", "divide-customer-border"],
  ["ring-[#FF6B35]", "ring-[var(--customer-primary)]"],
  ["focus:ring-[#FF6B35]", "focus:ring-[var(--customer-primary)]"],
  ["from-[#FFF8F3]", "from-customer-cream"],
  ["to-[#FFE4D6]", "to-customer-border"],
  ["hover:text-[#FF6B35]", "hover:text-customer-primary"],
  ["to-[#FF6B35]", "to-customer-primary"],
  ["from-[#FF6B35]", "from-customer-primary"],
  ["to-[#FF9F1C]", "to-customer-secondary"],
];

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full);
    else if (ent.name.endsWith(".jsx")) {
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

for (const d of dirs) {
  if (fs.existsSync(d)) walk(d);
}
