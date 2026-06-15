"use client";

import { CustomerProvider } from "@/context/CustomerContext";
import { CustomerLocaleProvider } from "@/context/CustomerLocaleContext";
import { CustomerThemeProvider } from "@/context/CustomerThemeContext";
import CartDrawer from "@/components/customer/CartDrawer";
import CustomerFooter from "@/components/customer/CustomerFooter";
import CustomerNavbar from "@/components/customer/CustomerNavbar";
import CustomerToasts from "@/components/customer/CustomerToasts";
import OrderTypeModal from "@/components/customer/OrderTypeModal";
import PlatformFeatureGate from "@/components/customer/PlatformFeatureGate";
import CustomerShellGate from "@/components/customer/CustomerShellGate";
import CustomerThemeBootstrap from "@/components/CustomerThemeBootstrap";
import { isCustomerAuthPath } from "@/lib/customerAuthRoutes";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useRef } from "react";

function PageTransition({ children }) {
  const pathname = usePathname();
  const isFirstRoute = useRef(true);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={isFirstRoute.current ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        onAnimationComplete={() => {
          isFirstRoute.current = false;
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function CustomerShell({ children }) {
  const pathname = usePathname();
  const isAuthPage = isCustomerAuthPath(pathname);

  if (isAuthPage) {
    return (
      <CustomerShellGate>
        <div className="flex min-h-0 w-full max-w-full flex-1 text-[var(--customer-text,#111827)]">
          <PlatformFeatureGate>{children}</PlatformFeatureGate>
        </div>
        <CustomerToasts />
      </CustomerShellGate>
    );
  }

  return (
    <CustomerShellGate>
      <div className="flex min-h-0 flex-1 flex-col text-[var(--customer-text,#111827)]">
        <CustomerNavbar />
        <div className="flex flex-1 flex-col overflow-x-clip">
          <main className="flex-1">
            <PageTransition>
              <PlatformFeatureGate>{children}</PlatformFeatureGate>
            </PageTransition>
          </main>
          <CustomerFooter />
        </div>
        <CustomerToasts />
        <OrderTypeModal />
        <CartDrawer />
      </div>
    </CustomerShellGate>
  );
}

export default function CustomerLayout({ children }) {
  return (
    <CustomerProvider>
      <CustomerThemeBootstrap />
      <CustomerThemeProvider>
        <CustomerLocaleProvider>
          <CustomerShell>{children}</CustomerShell>
        </CustomerLocaleProvider>
      </CustomerThemeProvider>
    </CustomerProvider>
  );
}
