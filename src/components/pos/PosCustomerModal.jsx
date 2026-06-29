"use client";

import CustomerSearch from "@/components/pos/CustomerSearch";
import Modal from "@/components/ui/Modal";

export default function PosCustomerModal({
  open,
  onClose,
  selectedCustomer,
  onCustomerSelect,
  onClearFieldError,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Select customer"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {selectedCustomer ? (
            <button
              type="button"
              onClick={() => {
                onCustomerSelect?.(null);
                onClearFieldError?.("customer");
                onClose?.();
              }}
              className="w-full cursor-pointer rounded-xl border admin-shell-border px-4 py-2 text-sm admin-surface-muted hover:border-red-500/40 hover:text-red-400 sm:w-auto"
            >
              Remove customer
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
      <CustomerSearch
        embedded
        selectedCustomer={selectedCustomer}
        onCustomerSelect={(customer) => {
          onCustomerSelect?.(customer);
          onClearFieldError?.("customer");
        }}
        onSelectComplete={onClose}
      />
    </Modal>
  );
}
