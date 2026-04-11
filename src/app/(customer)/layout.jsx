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
      <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
        <CustomerNavbar />
        <main className="flex-1">{children}</main>
        <CustomerFooter />
        <CustomerToasts />
        <OrderTypeModal />
        <CartDrawer />
      </div>
    </CustomerProvider>
  );
}
