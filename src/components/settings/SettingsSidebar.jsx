"use client";

import { AdminSideNav, AdminSideNavItem, AdminSideNavList } from "@/components/ui/AdminSideNav";
import { adminSurface } from "@/config/adminSurfaceClasses";
import { raSideNavActiveCls } from "@/config/restaurantAdminTheme";

export default function SettingsSidebar({ tabs, activeTab, onTabChange }) {
  return (
    <AdminSideNav className="min-w-0 w-full md:sticky md:top-24 md:max-h-[calc(100vh-7rem)] md:overflow-y-auto">
      <p className={`px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide ${adminSurface.muted}`}>
        Settings Menu
      </p>
      <AdminSideNavList className="lg:gap-0.5">
        {tabs.map((tab) => {
          const active = tab.id === activeTab;
          const Icon = tab.Icon;
          return (
            <AdminSideNavItem
              key={tab.id}
              active={active}
              onClick={() => onTabChange(tab.id)}
              icon={Icon}
              activeClassName={active ? raSideNavActiveCls : ""}
            >
              {tab.label}
            </AdminSideNavItem>
          );
        })}
      </AdminSideNavList>
    </AdminSideNav>
  );
}
