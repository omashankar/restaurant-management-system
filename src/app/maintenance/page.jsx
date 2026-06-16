import { BHOJDESK_BRAND } from "@/config/bhojdeskBrand";
import { getPublicPlatformConfig } from "@/lib/platformSettings";
import { Wrench } from "lucide-react";

export const metadata = {
  title: `Maintenance · ${BHOJDESK_BRAND.shortName}`,
};

const btnPrimary =
  "inline-flex min-h-[44px] items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500";

const btnSecondary =
  "inline-flex min-h-[44px] items-center justify-center rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500";

export default async function MaintenancePage() {
  const config = await getPublicPlatformConfig();
  const appName = config.appName ?? BHOJDESK_BRAND.fullName;

  return (
    <div className="relative z-[1] flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 text-center text-zinc-100">
      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400">
        <Wrench className="size-8" aria-hidden />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">
        {appName} is under maintenance
      </h1>
      <p className="mt-3 max-w-md text-sm text-zinc-400">
        We are performing scheduled updates. Please check back shortly. Restaurant
        staff and super administrators can still sign in below.
      </p>
      <div className="relative z-[2] mt-8 flex flex-wrap justify-center gap-3">
        <a href="/login" className={btnPrimary}>
          Staff login
        </a>
        <a href="/login?from=/super-admin/settings" className={btnSecondary}>
          Super Admin
        </a>
      </div>
      <p className="mt-6 max-w-sm text-xs text-zinc-500">
        Super Admin: sign in, then open Settings → Advanced → turn off Maintenance Mode.
      </p>
    </div>
  );
}
