"use client";

import FoodTypeIndicator from "@/components/customer/FoodTypeIndicator";
import SafeDishImage from "@/components/customer/SafeDishImage";
import { useCustomer } from "@/context/CustomerContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { formatCustomerMoney } from "@/lib/customerCurrency";
import { customerClasses, customerPage, customerType } from "@/lib/customerTheme";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Loader2, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function MenuItemDetailPage() {
  const params = useParams();
  const id = params?.id;
  const { link } = useRestaurantSlug();
  const { tryAddToCart, authUser, showToast } = useCustomer();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/customer/menu/${id}`, { cache: "no-store" });
        const data = await res.json();
        if (!cancelled && res.ok && data?.success) {
          setItem(data.item);
          if (data.item.sizes?.length) setSelectedSize(data.item.sizes[0]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!authUser || !id) return;
    fetch("/api/customer/favorites", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.favoriteIds)) {
          setFavorited(data.favoriteIds.includes(String(id)));
        }
      })
      .catch(() => {});
  }, [authUser, id]);

  const unitPrice = useMemo(() => {
    if (!item) return 0;
    const base = selectedSize ? Number(selectedSize.price) : Number(item.price);
    const addOnTotal = selectedAddOns.reduce((s, a) => s + Number(a.price ?? 0), 0);
    return base + addOnTotal;
  }, [item, selectedSize, selectedAddOns]);

  const toggleAddOn = (addon) => {
    setSelectedAddOns((prev) => {
      const exists = prev.find((a) => a.id === addon.id);
      if (exists) return prev.filter((a) => a.id !== addon.id);
      return [...prev, addon];
    });
  };

  const toggleFavorite = async () => {
    if (!authUser) {
      showToast("Login to save favorites.", "error");
      return;
    }
    try {
      const res = await fetch(
        favorited ? `/api/customer/favorites?itemId=${encodeURIComponent(id)}` : "/api/customer/favorites",
        { method: favorited ? "DELETE" : "POST", headers: { "Content-Type": "application/json" }, body: favorited ? undefined : JSON.stringify({ itemId: id }) }
      );
      const data = await res.json();
      if (res.ok && data?.success) {
        setFavorited(!favorited);
        showToast(favorited ? "Removed from favorites." : "Saved to favorites.");
      }
    } catch {
      showToast("Could not update favorite.", "error");
    }
  };

  const addToCart = () => {
    if (!item || item.soldOut) return;
    const nameParts = [item.name];
    if (selectedSize?.label) nameParts.push(`(${selectedSize.label})`);
    if (selectedAddOns.length) nameParts.push(`+ ${selectedAddOns.map((a) => a.name).join(", ")}`);
    tryAddToCart({
      id: `${item.id}-${selectedSize?.id ?? "base"}-${selectedAddOns.map((a) => a.id).join("-")}`,
      name: nameParts.join(" "),
      price: unitPrice,
      image: item.image,
      itemType: item.itemType,
      prepTime: item.prepTime,
      qty,
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-customer-primary" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-customer-muted">Item not found.</p>
        <Link href={link("/order/menu")} className="mt-4 inline-block text-customer-primary hover:underline">Back to menu</Link>
      </div>
    );
  }

  return (
    <div className={`${customerPage.shell} ${customerPage.narrow}`}>
      <Link href={link("/order/menu")} className="mb-4 inline-flex items-center gap-1.5 text-sm text-customer-muted hover:text-customer-primary">
        <ArrowLeft className="size-4" /> Back to menu
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden ct-surface-card rounded-3xl">
        <div className="relative aspect-[16/10]">
          <SafeDishImage src={item.image} alt={item.name} className="h-full w-full object-cover" />
          {item.soldOut && (
            <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-bold ${customerClasses.alertError}`}>Sold out</span>
          )}
          <button
            type="button"
            onClick={toggleFavorite}
            aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={favorited}
            className="absolute right-4 top-4 flex size-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-customer-border bg-[var(--customer-elevated)]/95 transition-colors hover:border-customer-primary/40"
          >
            <Heart className={`size-5 ${favorited ? "fill-customer-primary text-customer-primary" : "text-customer-muted"}`} />
          </button>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div>
            <div className="flex items-start gap-2">
              <FoodTypeIndicator type={item.itemType} size={18} />
              <h1 className={`${customerType.cardTitle} text-2xl`}>{item.name}</h1>
            </div>
            {item.description && <p className="mt-2 text-sm leading-relaxed text-customer-muted">{item.description}</p>}
            <p className="mt-3 font-poppins text-xl font-bold text-customer-primary">{formatCustomerMoney(unitPrice)}</p>
          </div>

          {item.sizes?.length > 0 && (
            <div>
              <p className={`mb-2 ${customerPage.label}`}>Size</p>
              <div className="flex flex-wrap gap-2">
                {item.sizes.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSize(s)}
                    className={selectedSize?.id === s.id ? customerClasses.chipActive : customerClasses.chip}
                  >
                    {s.label} · {formatCustomerMoney(s.price)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {item.addOns?.length > 0 && (
            <div>
              <p className={`mb-2 ${customerPage.label}`}>Add-ons</p>
              <div className="space-y-2">
                {item.addOns.map((a) => {
                  const on = selectedAddOns.some((x) => x.id === a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggleAddOn(a)}
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm ${on ? "border-customer-primary bg-customer-primary/5" : "border-customer-border"}`}
                    >
                      <span>{a.name}</span>
                      <span className="font-semibold">+{formatCustomerMoney(a.price)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-customer-border pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-center justify-center gap-3 rounded-full border border-customer-border px-2 py-1 sm:justify-start">
              <button type="button" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))} className="ct-hover-surface flex size-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-full"><Minus className="size-4" /></button>
              <span className="w-8 text-center font-bold" aria-live="polite">{qty}</span>
              <button type="button" aria-label="Increase quantity" onClick={() => setQty((q) => q + 1)} className="ct-hover-surface flex size-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-full"><Plus className="size-4" /></button>
            </div>
            <button
              type="button"
              disabled={item.soldOut}
              onClick={addToCart}
              className={`${customerClasses.btnPrimary} w-full justify-center py-3.5 text-sm disabled:opacity-50 sm:flex-1`}
              aria-disabled={item.soldOut}
            >
              {item.soldOut ? "Unavailable" : (
                <>
                  <span className="sm:hidden">Add to cart · {formatCustomerMoney(unitPrice * qty)}</span>
                  <span className="hidden sm:inline">Add {qty} to cart · {formatCustomerMoney(unitPrice * qty)}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
