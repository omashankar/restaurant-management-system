import { adminSurface } from "@/config/adminSurfaceClasses";
import { Inbox } from "lucide-react";

export default function EmptyState({ title, description, action }) {
  return (
    <div className={adminSurface.empty}>
      <span className={adminSurface.emptyIcon}>
        <Inbox className="size-7" aria-hidden />
      </span>
      <p className={`mt-4 text-base font-medium ${adminSurface.body}`}>{title}</p>
      {description ? (
        <p className={`mt-2 max-w-sm text-sm ${adminSurface.muted}`}>{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
