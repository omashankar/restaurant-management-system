"use client";

import { useEffect, useRef } from "react";
import { AdminSideNav, AdminSideNavItem, AdminSideNavList } from "@/components/ui/AdminSideNav";
import { adminSurface } from "@/config/adminSurfaceClasses";
import { raSideNavActiveCls } from "@/config/restaurantAdminTheme";

function NavItems({ tabs, activeTab, onTabChange }) {
  return tabs.map((tab) => {
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
  });
}

export default function SettingsSidebar({ tabs, activeTab, onTabChange }) {
  const mobileNavRef = useRef(null);

  useEffect(() => {
    const activeEl = mobileNavRef.current?.querySelector('[aria-current="page"]');
    activeEl?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [activeTab]);

  return (
    <>
      {/* Mobile / tablet — horizontal section picker */}
      <div className="min-w-0 lg:hidden">
        <p className={`px-1 pb-2 text-xs font-semibold uppercase tracking-wide ${adminSurface.muted}`}>
          Settings Menu
        </p>
        <div ref={mobileNavRef} className="min-w-0">
          <AdminSideNavList className="gap-1.5 pb-1 [scrollbar-width:none]">
            <NavItems tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />
          </AdminSideNavList>
        </div>
      </div>

      {/* Desktop — sticky sidebar; self-start prevents height jump when tab content changes */}
      <aside className="hidden min-w-0 self-start lg:block lg:w-full">
        <AdminSideNav className="sticky top-24 max-h-[calc(100vh-7rem)] w-full overflow-y-auto [scrollbar-width:thin]">
          <p className={`px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide ${adminSurface.muted}`}>
            Settings Menu
          </p>
          <AdminSideNavList className="flex-col gap-0.5 overflow-visible pb-0">
            <NavItems tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />
          </AdminSideNavList>
        </AdminSideNav>
      </aside>
    </>
  );
}
