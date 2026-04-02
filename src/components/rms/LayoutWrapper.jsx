"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import MobileDrawer from "./MobileDrawer";
import ResponsiveSidebar from "./ResponsiveSidebar";
import TopNavbar from "./TopNavbar";
import Sidebar from "./Sidebar";

const SIDEBAR_STATE_KEY = "sidebarCollapsed";

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const raw = window.localStorage.getItem(SIDEBAR_STATE_KEY);
      if (raw === "true") return true;
      if (raw === "false") return false;
      // Default collapsed on tablet + laptop.
      return window.innerWidth >= 768;
    } catch {
      return window.innerWidth >= 768;
    }
  });
  const [mdUp, setMdUp] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 768px)").matches;
  });

  const touchRef = useRef({
    active: false,
    x: 0,
    y: 0,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const mqMd = window.matchMedia("(min-width: 768px)");
    const sync = () => {
      setMdUp(mqMd.matches);
    };
    sync();
    mqMd.addEventListener("change", sync);
    return () => {
      mqMd.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_STATE_KEY, String(collapsed));
    } catch {}
  }, [collapsed]);

  useEffect(() => {
    // Auto-close the mobile drawer on route change.
    setIsSidebarOpen(false);
  }, [pathname]);

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const onTouchStart = (e) => {
    if (mdUp) return;
    const t = e.touches?.[0];
    if (!t) return;
    touchRef.current = { active: true, x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e) => {
    if (mdUp) return;
    if (!touchRef.current.active) return;
    const t = e.changedTouches?.[0];
    if (!t) return;
    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;
    touchRef.current.active = false;

    // Horizontal swipe detection (ignore mostly vertical gestures).
    if (Math.abs(dx) < 70 || Math.abs(dy) > 60) return;

    // Swipe right from left edge to open.
    if (!isSidebarOpen && touchRef.current.x < 24 && dx > 0) {
      setIsSidebarOpen(true);
      return;
    }
    // Swipe left to close when open.
    if (isSidebarOpen && dx < 0) {
      setIsSidebarOpen(false);
    }
  };

  const contentOffset = mdUp ? (collapsed ? 80 : 256) : 0;

  // Prevents hydration flicker between server/default and stored client state.
  if (!mounted) {
    return <div className="h-screen bg-zinc-950" />;
  }

  return (
    <div
      className="h-screen overflow-hidden bg-zinc-950"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex h-full">
        <ResponsiveSidebar
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
          onNavigate={closeSidebar}
        />

        <MobileDrawer open={isSidebarOpen} onClose={closeSidebar}>
          <Sidebar
            collapsed={false}
            allowCollapse={false}
            onNavigate={closeSidebar}
          />
        </MobileDrawer>

        <div
          className="flex min-w-0 flex-1 flex-col transition-[margin] duration-300 ease-out"
          style={{ marginLeft: contentOffset }}
        >
          <TopNavbar
            onOpenSidebar={openSidebar}
            onToggleSidebar={toggleSidebar}
          />
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

