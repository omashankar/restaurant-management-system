"use client";

import Sidebar from "./Sidebar";

export default function ResponsiveSidebar({
  collapsed,
  onCollapsedChange,
  onNavigate,
}) {
  return (
    <div className="fixed left-0 top-0 z-50 hidden h-screen min-w-0 md:flex">
      <Sidebar
        collapsed={collapsed}
        onCollapsedChange={onCollapsedChange}
        onNavigate={onNavigate}
      />
    </div>
  );
}

