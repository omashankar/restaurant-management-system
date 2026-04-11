"use client";

import { useCustomer } from "@/context/CustomerContext";
import { Bike, Check, ConciergeBell, Store, X } from "lucide-react";
import { useRouter } from "next/navigation";

const TYPES = [
  { id: "dine-in",  label: "Dine-In",  desc: "Eat at our restaurant",  Icon: Store },
  { id: "takeaway", label: "Takeaway", desc: "Pick up your order",      Icon: ConciergeBell },
  { id: "delivery", label: "Delivery", desc: "Delivered to your door",  Icon: Bike },
];

function typeCardClass(id, isSelected) {
  if (isSelected) {
    if (id === "dine-in")  return "border-emerald-500/60 bg-emerald-500/10 ring-1 ring-emerald-500/25";
    if (id === "takeaway") return "border-indigo-500/60 bg-indigo-500/10 ring-1 ring-indigo-500/25";
    if (id === "delivery") return "border-sky-500/60 bg-sky-500/10 ring-1 ring-sky-500/25";
  }
  if (id === "dine-in")  return "border-zinc-800 bg-zinc-950/50 hover:border-emerald-500/40 hover:bg-emerald-500/5";
  if (id === "takeaway") return "border-zinc-800 bg-zinc-950/50 hover:border-indigo-500/40 hover:bg-indigo-500/5";
  if (id === "delivery") return "border-zinc-800 bg-zinc-950/50 hover:border-sky-500/40 hover:bg-sky-500/5";
  return "border-zinc-800 bg-zinc-950/50";
}

export default function OrderTypeModal() {
  const { orderTypeModalOpen, setOrderTypeModalOpen, setOrderType, orderType } = useCustomer();
  const router = useRouter();

  if (!orderTypeModalOpen) return null;

  const choose = (type) => {
    setOrderType(type);
    setOrderTypeModalOpen(false);
    router.push("/order/menu");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="cursor-pointer absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => setOrderTypeModalOpen(false)}
        aria-label="Close"
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl shadow-black/60">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-50">How would you like to order?</h2>
            <p className="mt-1 text-xs text-zinc-500">Choose your preferred order method</p>
          </div>
          <button
            type="button"
            onClick={() => setOrderTypeModalOpen(false)}
            className="cursor-pointer rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="mt-5 grid gap-3">
          {TYPES.map(({ id, label, desc, Icon }) => {
            const isSelected = orderType === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => choose(id)}
                className={`cursor-pointer flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200 ${typeCardClass(id, isSelected)}`}
              >
                <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors ${isSelected ? "bg-zinc-700 text-zinc-100" : "bg-zinc-800 text-zinc-300"}`}>
                  <Icon className="size-5" />
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-zinc-100">{label}</p>
                  <p className="text-xs text-zinc-500">{desc}</p>
                </div>
                {isSelected && (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-zinc-950">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
