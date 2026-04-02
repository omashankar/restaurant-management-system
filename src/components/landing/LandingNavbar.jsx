"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { NAV_LINKS } from "./data";

export default function LandingNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-500 text-sm font-bold text-white shadow-sm shadow-indigo-400/40">
            RMS
          </span>
          <span className="text-sm font-semibold tracking-tight text-slate-900">
            Restaurant OS
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((item) => (
            <a
              key={item.label}
              href={item.href}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-400/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-500"
          >
            Get Started
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 p-2 text-slate-700 md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="grid gap-2">
            {NAV_LINKS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="rounded-lg px-2 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <Link href="/login" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">
              Login
            </Link>
            <Link href="/signup" className="rounded-lg bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white">
              Get Started
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
