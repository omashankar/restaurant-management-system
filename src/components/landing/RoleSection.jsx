import SectionTitle from "./SectionTitle";
import { ROLES } from "./data";

const ROLE_COLORS = {
  Admin:   { bg: "bg-indigo-50",  icon: "bg-indigo-100 text-indigo-700",  hover: "hover:border-indigo-300 hover:bg-indigo-50/80"  },
  Manager: { bg: "bg-emerald-50", icon: "bg-emerald-100 text-emerald-700",hover: "hover:border-emerald-300 hover:bg-emerald-50/80" },
  Waiter:  { bg: "bg-sky-50",     icon: "bg-sky-100 text-sky-700",        hover: "hover:border-sky-300 hover:bg-sky-50/80"         },
  Chef:    { bg: "bg-amber-50",   icon: "bg-amber-100 text-amber-700",    hover: "hover:border-amber-300 hover:bg-amber-50/80"     },
};

const ROLE_PERMISSIONS = {
  Admin:   ["Full system access", "Manage staff & roles", "View all reports", "Configure settings"],
  Manager: ["Daily operations", "Staff supervision", "Sales reports", "Inventory oversight"],
  Waiter:  ["Take & manage orders", "Table service", "Customer requests", "Order status updates"],
  Chef:    ["Kitchen display queue", "Mark orders ready", "Prep time tracking", "Recipe access"],
};

export default function RoleSection() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Role-Based Access"
          title="Right tools for every team member"
          subtext="Keep workflows focused and secure with role-based dashboards and permissions."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {ROLES.map(({ role, desc, Icon }) => {
            const c    = ROLE_COLORS[role] ?? ROLE_COLORS.Admin;
            const perms = ROLE_PERMISSIONS[role] ?? [];
            return (
              <article
                key={role}
                className={`group flex flex-col rounded-2xl border border-slate-200 p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${c.hover}`}
              >
                <span className={`inline-flex size-12 items-center justify-center rounded-xl ${c.icon} transition-all duration-200`}>
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-bold text-slate-900">{role}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{desc}</p>
                <ul className="mt-4 flex-1 space-y-1.5 border-t border-slate-100 pt-4">
                  {perms.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="size-1 shrink-0 rounded-full bg-slate-400" />
                      {p}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
