"use client";

import { CustomerProvider } from "@/context/CustomerContext";
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
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default function CustomerLayout({ children }) {
  return (
    <CustomerProvider>
      <div className="customer-theme relative flex min-h-screen flex-col overflow-x-hidden">
        {/* Background blobs */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#FF6B35]/8 blur-3xl" />
          <div className="absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-[#FF9F1C]/6 blur-3xl" />
          <div className="absolute -bottom-40 right-1/3 h-96 w-96 rounded-full bg-[#FF6B35]/5 blur-3xl" />
        </div>

        <CustomerNavbar />

        <main className="relative z-10 flex-1">
          <PageTransition>{children}</PageTransition>
        </main>

        <CustomerFooter />
        <CustomerToasts />
        <OrderTypeModal />
        <CartDrawer />
      </div>
    </CustomerProvider>
  );
}
