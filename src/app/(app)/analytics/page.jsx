"use client";

import RevenueChart from "@/components/rms/RevenueChart";
import StatsCard from "@/components/rms/StatsCard";
import { revenueByDay } from "@/lib/mockData";
import { DollarSign, Percent, ShoppingBag } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Revenue mix and throughput · mock aggregates
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Avg check"
          value="$69.20"
          subtitle="Blended dine-in"
          trend={4.2}
          icon={DollarSign}
        />
        <StatsCard
          title="Table turns"
          value="2.4"
          subtitle="Per table · dinner"
          trend={1.1}
          icon={ShoppingBag}
        />
        <StatsCard
          title="Labor %"
          value="28%"
          subtitle="Target 26–30%"
          trend={-0.8}
          icon={Percent}
        />
      </div>
      <RevenueChart data={revenueByDay} />
    </div>
  );
}
