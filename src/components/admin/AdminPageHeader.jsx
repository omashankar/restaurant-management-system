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
      className={`mb-6 sm:mb-8 ${adminSurface.pageHeaderRow} ${className}`.trim()}
    >
      <div className="min-w-0">
        <h1 className={`admin-page-title ${titleClassName}`.trim()}>{title}</h1>
        {description ? (
          <p className={`admin-page-desc ${adminSurface.muted}`}>{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className={adminSurface.pageHeaderActions}>{actions}</div>
      ) : null}
    </div>
  );
}
