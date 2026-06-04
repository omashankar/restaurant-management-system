import { adminSurface } from "@/config/adminSurfaceClasses";

/**
 * Consistent page title block for Restaurant Admin + Super Admin.
 */
export default function AdminPageHeader({
  title,
  description,
  actions,
  className = "",
  titleClassName = "",
}) {
  return (
    <div
      className={`mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between ${className}`}
    >
      <div className="min-w-0">
        <h1 className={`admin-page-title ${titleClassName}`.trim()}>{title}</h1>
        {description ? (
          <p className={`admin-page-desc mt-1 text-sm ${adminSurface.muted}`}>{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
