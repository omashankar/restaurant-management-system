"use client";

import { MARKETING_SHELL_PATHS } from "@/lib/marketingShell";
import { useServerInsertedHTML } from "next/navigation";

const pathsJson = JSON.stringify(MARKETING_SHELL_PATHS);

const BOOTSTRAP = `
(function () {
  var MAX_MS = 7000;
  try {
    var paths = ${pathsJson};
    var path = location.pathname;
    if (paths.indexOf(path) === -1) return;
    var root = document.documentElement;
    root.classList.add("landing-preload-pending");
    setTimeout(function () {
      root.classList.remove("landing-preload-pending");
      root.removeAttribute("data-landing-shell");
      document.body.style.removeProperty("overflow");
    }, MAX_MS);
  } catch (e) {}
})();
`;

/** Hides marketing shell until React preloader releases it (prevents content flash). */
export default function LandingPreloadBootstrap() {
  useServerInsertedHTML(() => (
    <script id="landing-preload-bootstrap" dangerouslySetInnerHTML={{ __html: BOOTSTRAP }} />
  ));
  return null;
}
