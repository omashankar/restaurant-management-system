"use client";

import FoodTypeIndicator from "@/components/customer/FoodTypeIndicator";
import SafeDishImage from "@/components/customer/SafeDishImage";
import { formatCustomerMoney } from "@/lib/customerCurrency";
import { customerClasses, customerOverlay } from "@/lib/customerTheme";
import { motion } from "framer-motion";
import { Clock, Plus, Zap } from "lucide-react";

/**
 * Standard menu grid card — image (badges + price), then name + description + CTA below.
 * Category is not shown (filters already indicate category).
 */
export default function MenuItemCard({
  item,
  inCart,
  addLabel = "Add to Cart",
  inCartLabel = "In Cart",
  onAdd,
  motionProps = {},
  className = "",
}) {
  const isFast = (item.prepTime ?? 99) < 10;

  return (
    <motion.article
      {...motionProps}
      className={`ct-menu-card ct-menu-card--motion group ${className}`.trim()}
    >
      <div className="ct-menu-card__media ct-media-zoom">
        <SafeDishImage
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover"
          iconClassName="size-14 text-customer-primary/20"
        />
        {item.badge ? (
          <span className="absolute left-2.5 top-2.5 z-[1] rounded-full gradient-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
            {item.badge}
          </span>
        ) : null}
        {item.prepTime != null ? (
          <span
            className={`absolute right-2.5 top-2.5 z-[1] inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-sm ${
              isFast ? "bg-amber-400 text-white" : "bg-white/95 text-customer-muted"
            }`}
          >
            {isFast ? <Zap className="size-2.5" /> : <Clock className="size-2.5" />}
            {item.prepTime} min
          </span>
        ) : null}
        <span
          className={`absolute bottom-2.5 right-2.5 z-[1] px-2.5 py-1 text-sm ${customerOverlay.pricePill}`}
        >
          {formatCustomerMoney(item.price)}
        </span>
      </div>

      <div className="ct-menu-card__body">
        <h3 className="ct-menu-card__title">
          <FoodTypeIndicator type={item.itemType} size={14} className="mt-0.5 shrink-0" />
          <span className="ct-menu-card__title-text">{item.name}</span>
        </h3>

        {item.description?.trim() ? (
          <p className="ct-menu-card__desc">{item.description}</p>
        ) : (
          <div className="flex-1 min-h-[2.25rem]" aria-hidden />
        )}

        <button
          type="button"
          onClick={() => onAdd(item)}
          className={`ct-menu-card__btn inline-flex cursor-pointer items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold transition-all ${
            inCart
              ? "border-2 border-customer-primary bg-[var(--customer-card)] text-customer-primary"
              : customerClasses.btnPrimary
          }`}
        >
          <Plus className="size-4 shrink-0" />
          {inCart ? `${inCartLabel} (${inCart.qty})` : addLabel}
        </button>
      </div>
    </motion.article>
  );
}
