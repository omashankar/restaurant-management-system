/**
 * Standard admin data tables — header row + icon action column alignment.
 */

const TH = "admin-table-th px-4 py-3";
const TD = "admin-table-td px-4 py-3";

const alignTh = {
  left: "text-left",
  center: "text-center admin-table-th--center",
  right: "text-right admin-table-th--right",
  actions: "admin-table-th--actions text-right",
};

const alignTd = {
  left: "text-left",
  center: "text-center",
  right: "text-right tabular-nums",
  actions: "admin-table-td--actions",
};

const hiddenMap = {
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
};

export function AdminTable({ children, className = "" }) {
  return (
    <table className={`admin-table min-w-full border-collapse text-left text-sm ${className}`}>
      {children}
    </table>
  );
}

export function AdminTableHead({ children }) {
  return <thead className="admin-table-head">{children}</thead>;
}

export function AdminTableHeadRow({ children, className = "" }) {
  return <tr className={`admin-table-head-row ${className}`}>{children}</tr>;
}

export function AdminTableTh({
  children,
  align = "left",
  hidden,
  className = "",
  scope = "col",
}) {
  const hiddenCls = hidden ? hiddenMap[hidden] ?? "" : "";
  return (
    <th scope={scope} className={`${TH} ${alignTh[align] ?? alignTh.left} ${hiddenCls} ${className}`}>
      {children}
    </th>
  );
}

/** Actions column — label aligns with icon buttons in body rows */
export function AdminTableThActions({ label = "Actions" }) {
  return (
    <th scope="col" className={`${TH} ${alignTh.actions}`}>
      {label}
    </th>
  );
}

export function AdminTableBody({ children, className = "" }) {
  return <tbody className={className}>{children}</tbody>;
}

export function AdminTableRow({ children, className = "" }) {
  return (
    <tr className={`admin-table-row transition-colors hover:admin-shell-hover ${className}`}>
      {children}
    </tr>
  );
}

export function AdminTableTd({
  children,
  align = "left",
  hidden,
  className = "",
}) {
  const hiddenCls = hidden ? hiddenMap[hidden] ?? "" : "";
  return (
    <td className={`${TD} ${alignTd[align] ?? alignTd.left} ${hiddenCls} ${className}`}>
      {children}
    </td>
  );
}

export function AdminTableActionsCell({ children, className = "" }) {
  return (
    <td className={`${TD} ${alignTd.actions} ${className}`}>
      <div className="admin-table-actions flex items-center justify-end gap-1">{children}</div>
    </td>
  );
}

export function AdminTableIconButton({
  children,
  className = "",
  variant = "default",
  ...props
}) {
  const variantCls =
    variant === "danger"
      ? "admin-icon-hover-danger"
      : variant === "primary"
        ? "admin-icon-hover-edit"
        : variant === "sky"
          ? "admin-icon-hover-view"
          : "admin-icon-hover-edit";
  return (
    <button
      type="button"
      className={`admin-table-icon-btn cursor-pointer rounded-lg p-2 admin-surface-muted transition-colors ${variantCls} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
