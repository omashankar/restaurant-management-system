"use client";

import { useApp } from "@/context/AppProviders";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function RestrictedPage({ title = "Access restricted", message }) {
  const { user } = useApp();
  const home =
    user?.role === "chef"
      ? "/kitchen"
      : user?.role === "waiter"
        ? "/pos"
        : "/dashboard";

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-500/5 p-10 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30">
        <ShieldAlert className="size-7" aria-hidden />
      </span>
      <h2 className="mt-6 text-xl font-semibold text-zinc-100">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
        {message ??
          "Your role does not include this module. Contact an administrator if you need access."}
      </p>
      <Link
        href={home}
        className="mt-8 rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:border-emerald-500/50 hover:bg-emerald-500/10"
      >
        Back to workspace
      </Link>
    </div>
  );
}
