import { ArrowRight, PlayCircle } from "lucide-react";
import Link from "next/link";

export default function CTASection() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-500 p-10 shadow-2xl shadow-indigo-500/30 md:flex md:items-center md:justify-between">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -right-10 -top-10 size-64 rounded-full bg-white/5 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 left-20 size-48 rounded-full bg-indigo-400/20 blur-2xl" />

        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-200">
            Get Started Today
          </p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">
            Start Managing Your Restaurant Smarter
          </h3>
          <p className="mt-2 max-w-md text-sm text-indigo-100">
            Join 500+ restaurants already using RMS. Launch your modern operations
            stack in minutes — no credit card required.
          </p>
        </div>

        <div className="relative mt-6 flex flex-wrap gap-3 md:mt-0 md:shrink-0">
          <Link
            href="/signup"
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-indigo-700 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-indigo-50"
          >
            Get Started Now <ArrowRight className="size-4" />
          </Link>
          <a
            href="#demo"
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/20"
          >
            <PlayCircle className="size-4" /> View Demo
          </a>
        </div>
      </div>
    </section>
  );
}
