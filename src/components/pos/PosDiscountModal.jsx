"use client";

import Modal from "@/components/ui/Modal";
import PosDiscountSection from "@/components/pos/PosDiscountSection";

export default function PosDiscountModal({
  open,
  onClose,
  enabled = true,
  mode,
  value,
  discountAmount,
  currency,
  onModeChange,
  onValueChange,
  onClear,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Apply discount"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {discountAmount > 0 ? (
            <button
              type="button"
              onClick={() => {
                onClear?.();
                onClose?.();
              }}
              className="w-full cursor-pointer rounded-xl border admin-shell-border px-4 py-2 text-sm admin-surface-muted hover:border-red-500/40 hover:text-red-400 sm:w-auto"
            >
              Remove discount
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="w-full cursor-pointer rounded-xl bg-ra-primary px-4 py-2 text-sm font-semibold text-zinc-950 hover:brightness-110 sm:w-auto"
          >
            Done
          </button>
        </div>
      }
    >
      <PosDiscountSection
        enabled={enabled}
        embedded
        mode={mode}
        value={value}
        discountAmount={discountAmount}
        currency={currency}
        onModeChange={onModeChange}
        onValueChange={onValueChange}
        onClear={onClear}
      />
    </Modal>
  );
}
