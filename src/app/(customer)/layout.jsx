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
      <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-zinc-50 text-zinc-900">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-emerald-100/70 to-transparent" />
          <div className="absolute left-[-80px] top-[-80px] h-80 w-80 rounded-full bg-emerald-300/25 blur-3xl" />
          <div className="absolute bottom-[-120px] right-[-80px] h-96 w-96 rounded-full bg-sky-300/20 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(16,185,129,0.08),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(14,165,233,0.08),transparent_42%)]" />
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
