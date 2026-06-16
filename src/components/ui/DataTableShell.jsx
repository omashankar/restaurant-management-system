import { adminSurface } from "@/config/adminSurfaceClasses";

export default function DataTableShell({ children, className = "" }) {
  return (
    <div className={`min-w-0 w-full max-w-full ${adminSurface.tableShell} ${className}`}>
      <div className="min-w-0 w-full max-w-full overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
        {children}
      </div>
    </div>
  );
}
