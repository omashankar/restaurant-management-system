/** Order-type pill styles — single brand palette, dark-mode safe */

export const ORDER_TYPE_CHIP = {
  "dine-in":
    "text-customer-primary bg-customer-primary/10 border-customer-primary/30",
  takeaway:
    "text-customer-primary bg-customer-primary/8 border-customer-primary/28",
  delivery:
    "text-customer-primary bg-customer-primary/12 border-customer-primary/32",
};

export function orderTypeChipClass(type) {
  return (
    ORDER_TYPE_CHIP[type]
    ?? "text-customer-muted border-customer-border bg-[var(--customer-card)]"
  );
}
