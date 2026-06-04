import { adminSurface } from "@/config/adminSurfaceClasses";

export default function DataTableShell({ children, className = "" }) {
  return (
    <div className={`${adminSurface.tableShell} ${className}`}>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
