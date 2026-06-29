"use client";

import FoodTypeIndicator from "@/components/customer/FoodTypeIndicator";
import SafeDishImage from "@/components/customer/SafeDishImage";
import { formatCustomerMoney } from "@/lib/customerCurrency";
import { formatMenuPriceRange, itemHasSizes } from "@/lib/menuItemSizes";
import { customerClasses, customerMotion, customerOverlay } from "@/lib/customerTheme";
import { motion } from "framer-motion";
import Link from "next/link";
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
  detailHref,
  motionProps = {},
  className = "",
}) {
  const isFast = (item.prepTime ?? 99) < 10;
  const stock = item.stock != null ? Number(item.stock) : null;
  const soldOut = item.status !== "active" || stock === 0;
  const cartQty =
    inCart && typeof inCart === "object" ? Math.max(0, Number(inCart.qty) || 0) : inCart ? 1 : 0;
  const showInCart = cartQty > 0;

  const media = (
      <div className={`ct-menu-card__media ct-media-zoom ${soldOut ? "opacity-60" : ""}`}>
        <SafeDishImage
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover"
          iconClassName="size-14 text-customer-primary/20"
        />
        {item.badge ? (
          <span className="absolute left-2.5 top-2.5 z-[1] rounded-full gradient-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            {item.badge}
          </span>
        ) : null}
        {item.prepTime != null ? (
          <span
            className={`absolute right-2.5 top-2.5 z-[1] inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              isFast ? "gradient-primary text-[var(--customer-btn-primary-fg)]" : "bg-[var(--customer-elevated)]/95 text-customer-muted"
            }`}
          >
            {isFast ? <Zap className="size-2.5" /> : <Clock className="size-2.5" />}
            {item.prepTime} min
          </span>
        ) : null}
        {soldOut ? (
          <span className={`absolute bottom-2.5 right-2.5 z-[1] rounded-full px-2.5 py-1 text-[10px] font-bold ${customerClasses.alertError}`}>Sold out</span>
        ) : (
          <span className={`absolute bottom-2.5 right-2.5 z-[1] px-2.5 py-1 text-sm ${customerOverlay.pricePill}`}>
            {formatMenuPriceRange(item, formatCustomerMoney)}
          </span>
        )}
      </div>
  );

  const articleMotion = {
    whileHover: customerMotion.cardHoverSm,
    whileTap: customerMotion.tapSm,
    ...motionProps,
  };

  return (
    <motion.article
      {...articleMotion}
      className={`ct-menu-card ct-menu-card--motion group ${className}`.trim()}
    >
      {detailHref ? (
        <Link href={detailHref} className="block">{media}</Link>
      ) : media}

      <div className="ct-menu-card__body">
        <h3 className="ct-menu-card__title">
          <FoodTypeIndicator type={item.itemType} size={14} className="mt-0.5 shrink-0" />
          {detailHref ? (
            <Link href={detailHref} className="ct-menu-card__title-text hover:text-customer-primary">{item.name}</Link>
          ) : (
            <span className="ct-menu-card__title-text">{item.name}</span>
          )}
        </h3>

        {item.description?.trim() ? (
          <p className="ct-menu-card__desc">{item.description}</p>
        ) : (
          <div className="flex-1 min-h-[2.25rem]" aria-hidden />
        )}

        <button
          type="button"
          disabled={soldOut}
          onClick={() => onAdd(item)}
          className={`ct-menu-card__btn inline-flex cursor-pointer items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
            showInCart
              ? "border-2 border-customer-primary bg-[var(--customer-card)] text-customer-primary"
              : customerClasses.btnPrimary
          }`}
        >
          <Plus className="size-4 shrink-0" />
          {soldOut ? "Unavailable" : showInCart ? `${inCartLabel} (${cartQty})` : addLabel}
        </button>
      </div>
    </motion.article>
  );
}
