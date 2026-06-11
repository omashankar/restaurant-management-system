"use client";

import { useEffect, useRef } from "react";
import { AdminSideNav, AdminSideNavItem, AdminSideNavList } from "@/components/ui/AdminSideNav";
import { adminSurface } from "@/config/adminSurfaceClasses";
import { raSideNavActiveCls } from "@/config/restaurantAdminTheme";

function NavItems({ tabs, activeTab, onTabChange }) {
  return tabs.map((tab) => {
    const active = tab.id === activeTab;
    return (
      <AdminSideNavItem
        key={tab.id}
        active={active}
        onClick={() => onTabChange(tab.id)}
        icon={tab.Icon}
        activeClassName={active ? raSideNavActiveCls : ""}
      >
        {tab.label}
      </AdminSideNavItem>
    );
  });
}

export default function SettingsSidebar({ tabs, activeTab, onTabChange }) {
  const navRef = useRef(null);

  useEffect(() => {
    const activeEl = navRef.current?.querySelector('[aria-current="page"]');
    if (!activeEl || typeof window === "undefined") return;
    // Horizontal section picker only (mobile/tablet) — avoid shifting desktop sidebar
    if (!window.matchMedia("(min-width: 1024px)").matches) {
      activeEl.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    }
  }, [activeTab]);

  return (
    <AdminSideNav className="settings-side-nav min-w-0 w-full shrink-0 lg:w-52">
      <p className={`px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide ${adminSurface.muted}`}>
        Settings Menu
      </p>
      <div ref={navRef} className="min-w-0 overflow-visible px-0.5">
        <AdminSideNavList className="gap-1.5 pb-1 lg:gap-0.5 lg:overflow-visible lg:pb-0 [scrollbar-width:none]">
          <NavItems tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />
        </AdminSideNavList>
      </div>
    </AdminSideNav>
  );
}
