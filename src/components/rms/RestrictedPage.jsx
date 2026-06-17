"use client";

import { useApp } from "@/context/AppProviders";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function RestrictedPage({ title = "Access restricted", message }) {
  const { user } = useApp();
  const home =
    user?.role === "chef"
      ? "/kitchen"
      : "/dashboard";

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-500/5 p-10 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30">
        <ShieldAlert className="size-7" aria-hidden />
      </span>
      <h2 className="mt-6 text-xl font-semibold admin-shell-text">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed admin-surface-muted">
        {message ??
          "Your role does not include this module. Contact an administrator if you need access."}
      </p>
      <Link
        href={home}
        className="cursor-pointer mt-8 rounded-xl border admin-shell-border px-5 py-2.5 text-sm font-medium admin-shell-text transition-colors hover:border-ra-primary-50 hover-bg-ra-primary-10"
      >
        Back to workspace
      </Link>
    </div>
  );
}
