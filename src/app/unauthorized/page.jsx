"use client";

import { defaultRedirectForRole } from "@/context/AppProviders";
import { useUser } from "@/context/AuthContext";
import { ShieldX } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function UnauthorizedContent() {
  const { user } = useUser();
  const params   = useSearchParams();
  const path     = params.get("path") ?? "";

  const home = user ? defaultRedirectForRole(user.role) : "/login";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-950 px-4 text-center">
      <span className="flex size-20 items-center justify-center rounded-full bg-red-500/15 ring-1 ring-red-500/25">
        <ShieldX className="size-10 text-red-400" />
      </span>
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Access Denied</h1>
        <p className="mt-2 text-sm text-zinc-400">
          You don&apos;t have permission to access
          {path && <span className="ml-1 font-mono text-zinc-300">{path}</span>}.
        </p>
        {user && (
          <p className="mt-1 text-xs text-zinc-600">
            Logged in as <span className="text-zinc-400">{user.name}</span> · Role:{" "}
            <span className="capitalize text-zinc-400">{user.role}</span>
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <Link href={home}
          className="cursor-pointer rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-bold text-zinc-950 hover:bg-emerald-400">
          Go to Dashboard
        </Link>
        <Link href="/login"
          className="cursor-pointer rounded-xl border border-zinc-700 px-6 py-2.5 text-sm font-medium text-zinc-300 hover:border-zinc-500">
          Login as different user
        </Link>
      </div>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense fallback={null}>
      <UnauthorizedContent />
    </Suspense>
  );
}
