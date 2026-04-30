"use client";

import { CustomerProvider } from "@/context/CustomerContext";
import CartDrawer from "@/components/customer/CartDrawer";
import CustomerFooter from "@/components/customer/CustomerFooter";
import CustomerNavbar from "@/components/customer/CustomerNavbar";
import CustomerToasts from "@/components/customer/CustomerToasts";
import OrderTypeModal from "@/components/customer/OrderTypeModal";

export default function CustomerLayout({ children }) {
  return (
    <CustomerProvider>
      <div className="relative flex min-h-screen flex-col bg-zinc-50 text-zinc-900">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-sky-300/25 blur-3xl" />
        </div>
        <CustomerNavbar />
        <main className="relative z-10 flex-1">{children}</main>
        <CustomerFooter />
        <CustomerToasts />
        <OrderTypeModal />
        <CartDrawer />
      </div>
    </CustomerProvider>
  );
}
