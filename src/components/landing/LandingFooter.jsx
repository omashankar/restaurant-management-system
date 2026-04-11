import { UtensilsCrossed } from "lucide-react";
import Link from "next/link";

const FOOTER_LINKS = {
  Product: [
    { label: "Features",   href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Demo",       href: "#demo" },
  ],
  Company: [
    { label: "About",    href: "#contact" },
    { label: "Contact",  href: "#contact" },
    { label: "Privacy",  href: "#" },
  ],
  Access: [
    { label: "Login",       href: "/login",  isLink: true },
    { label: "Sign Up",     href: "/signup", isLink: true },
    { label: "Customer App", href: "/home",  isLink: true },
  ],
};

export default function LandingFooter() {
  return (
    <footer id="contact" className="border-t border-slate-200 bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="inline-flex items-center gap-2.5">
              <span className="inline-flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-400/30">
                <UtensilsCrossed className="size-4" />
              </span>
              <span className="text-sm font-bold tracking-tight text-slate-900">Restaurant OS</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              All-in-one restaurant management platform built for modern operations and growing teams.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <Link
                href="/signup"
                className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-500"
              >
                Get Started Free
              </Link>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{group}</p>
              <ul className="mt-4 space-y-3">
                {links.map(({ label, href, isLink }) => (
                  <li key={label}>
                    {isLink ? (
                      <Link
                        href={href}
                        className="cursor-pointer text-sm text-slate-600 transition-colors hover:text-indigo-600"
                      >
                        {label}
                      </Link>
                    ) : (
                      <a
                        href={href}
                        className="cursor-pointer text-sm text-slate-600 transition-colors hover:text-indigo-600"
                      >
                        {label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 sm:flex-row">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Restaurant OS. All rights reserved.
          </p>
          <p className="text-xs text-slate-400">Built for modern restaurants and growing operations.</p>
        </div>
      </div>
    </footer>
  );
}
