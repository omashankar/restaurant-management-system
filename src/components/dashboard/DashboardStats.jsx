"use client";

import StatsCard from "@/components/rms/StatsCard";
import { formatAdminMoney } from "@/lib/adminCurrency";
import { usePermission } from "@/hooks/usePermission";
import { BookOpen, DollarSign, ShoppingBag, Users } from "lucide-react";
import Link from "next/link";

export default function DashboardStats({
  currency = "INR",
  salesToday = 0,
  ordersToday = 0,
  customerCount = 0,
  reservationsToday = 0,
  reservationsCalendarDate = "",
}) {
  const { hasPermission } = usePermission();

  const showSales = hasPermission("view_sales");

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {showSales && (
        <StatsCard
          title="Sales Today"
          value={formatAdminMoney(salesToday, currency)}
          subtitle="Calendar day · excl. cancelled"
          icon={DollarSign}
        />
      )}

      <StatsCard
        title="Orders Today"
        value={String(ordersToday)}
        subtitle="Calendar day · all statuses"
        icon={ShoppingBag}
      />

      {hasPermission("manage_customers") && (
        <StatsCard
          title="Customers"
          value={String(customerCount)}
          subtitle="Total in directory"
          icon={Users}
        />
      )}

      {hasPermission("view_reservations") && (
        <Link href="/reservations" className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ra-primary-40">
          <StatsCard
            title="Reservations"
            value={String(reservationsToday)}
            subtitle={
              reservationsCalendarDate
                ? `Pending & confirmed · ${reservationsCalendarDate}`
                : "Pending & confirmed for today"
            }
            icon={BookOpen}
            className="h-full"
          />
        </Link>
      )}
    </div>
  );
}
