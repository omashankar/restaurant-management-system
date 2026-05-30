import fs from "node:fs";
import path from "node:path";

const src = fs.readFileSync(
  path.resolve("src/app/super-admin/super-admin-theme.css"),
  "utf8"
);

const out = src
  .replace(/Super Admin dynamic theme/g, "Restaurant Admin dynamic theme")
  .replace(/super-admin-panel/g, "restaurant-admin-panel")
  .replace(/data-super-admin-theme/g, "data-restaurant-admin-theme")
  .replace(/--sa-/g, "--ra-")
  .replace(/var\(--sa-/g, "var(--ra-")
  .replace(/\.sa-/g, ".ra-")
  .replace(/bg-sa-/g, "bg-ra-")
  .replace(/text-sa-/g, "text-ra-")
  .replace(/border-sa-/g, "border-ra-")
  .replace(/ring-sa-/g, "ring-ra-")
  .replace(/focus-sa-/g, "focus-ra-")
  .replace(/hover-sa-/g, "hover-ra-")
  .replace(/hover-bg-ra-/g, "hover-bg-ra-")
  .replace(/hover-text-ra-/g, "hover-text-ra-")
  .replace(/hover-border-ra-/g, "hover-border-ra-")
  .replace(/shadow-sa-/g, "shadow-ra-")
  .replace("#f43f5e", "#10b981");

out = out.replace(
  /--ra-accent: #10b981;/,
  "--ra-accent: #34d399;"
);

fs.writeFileSync(
  path.resolve("src/app/(app)/restaurant-admin-theme.css"),
  out,
  "utf8"
);
console.log("generated restaurant-admin-theme.css");
