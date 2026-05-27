"use client";

import StatsCard from "@/components/rms/StatsCard";
import { formatAdminMoney } from "@/lib/adminCurrency";
import { usePermission } from "@/hooks/usePermission";
import { BookOpen, DollarSign, ShoppingBag, Users } from "lucide-react";

export default function DashboardStats({
  currency = "INR",
  salesToday = 0,
  ordersToday = 0,
  customerCount = 0,
  reservationsToday = 0,
}) {
  const { hasPermission } = usePermission();

  const showSales = hasPermission("view_sales");

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
        <StatsCard
          title="Reservations"
          value={String(reservationsToday)}
          subtitle="Active for today"
          icon={BookOpen}
        />
      )}
    </div>
  );
}
