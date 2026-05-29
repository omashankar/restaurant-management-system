import Link from "next/link";
import { getPublicPlatformConfig } from "@/lib/platformSettings";
import { Wrench } from "lucide-react";

export const metadata = {
  title: "Maintenance · RMS",
};

export default async function MaintenancePage() {
  const config = await getPublicPlatformConfig();
  const appName = config.appName ?? "RMS Platform";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 text-center text-zinc-100">
      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400">
        <Wrench className="size-8" aria-hidden />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">
        {appName} is under maintenance
      </h1>
      <p className="mt-3 max-w-md text-sm text-zinc-400">
        We are performing scheduled updates. Please check back shortly. Restaurant
        staff and super administrators can still access the admin panel.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Staff login
        </Link>
        <Link
          href="/super-admin/dashboard"
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
        >
          Super Admin
        </Link>
      </div>
    </div>
  );
}
