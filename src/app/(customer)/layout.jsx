"use client";

import { CustomerProvider } from "@/context/CustomerContext";
import { CustomerThemeProvider } from "@/context/CustomerThemeContext";
import CartDrawer from "@/components/customer/CartDrawer";
import CustomerFooter from "@/components/customer/CustomerFooter";
import CustomerNavbar from "@/components/customer/CustomerNavbar";
import CustomerToasts from "@/components/customer/CustomerToasts";
import OrderTypeModal from "@/components/customer/OrderTypeModal";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

function PageTransition({ children }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default function CustomerLayout({ children }) {
  return (
    <CustomerProvider>
      <CustomerThemeProvider>
        <div className="flex min-h-screen flex-col overflow-x-hidden bg-[var(--customer-bg,#fff)] text-[var(--customer-text,#111827)]">
          <CustomerNavbar />
          <main className="flex-1">
            <PageTransition>{children}</PageTransition>
          </main>
          <CustomerFooter />
          <CustomerToasts />
          <OrderTypeModal />
          <CartDrawer />
        </div>
      </CustomerThemeProvider>
    </CustomerProvider>
  );
}
