"use client";

import PhoneInput from "@/components/ui/PhoneInput";
import Modal from "@/components/ui/Modal";
import { adminControl } from "@/config/adminDesignSystem";

export default function PosDeliveryModal({
  open,
  onClose,
  delivery,
  onDeliveryChange,
  onClearFieldError,
  fieldErrors = {},
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delivery details"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="w-full cursor-pointer rounded-xl bg-ra-primary px-4 py-2 text-sm font-semibold text-zinc-950 hover:brightness-110 sm:ml-auto sm:w-auto"
        >
          Done
        </button>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium admin-surface-muted">Customer name *</label>
          <input
            value={delivery.name}
            onChange={(e) => {
              onDeliveryChange?.("name", e.target.value);
              onClearFieldError?.("deliveryName");
            }}
            placeholder="Full name"
            aria-invalid={fieldErrors.deliveryName ? true : undefined}
            className={`${adminControl.input} w-full px-3 py-2 text-sm focus-ra-primary`}
          />
          {fieldErrors.deliveryName && (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.deliveryName}</p>
          )}
        </div>
        <PhoneInput
          id="pos-delivery-phone-modal"
          label="Mobile *"
          labelClassName="mb-1 block text-xs font-medium admin-surface-muted"
          value={delivery.phone}
          onChange={(digits) => {
            onDeliveryChange?.("phone", digits);
            onClearFieldError?.("deliveryPhone");
          }}
          error={fieldErrors.deliveryPhone || undefined}
        />
        <div>
          <label className="mb-1 block text-xs font-medium admin-surface-muted">Delivery address *</label>
          <textarea
            rows={3}
            value={delivery.address}
            onChange={(e) => {
              onDeliveryChange?.("address", e.target.value);
              onClearFieldError?.("deliveryAddress");
            }}
            placeholder="House no., street, landmark, city…"
            maxLength={300}
            aria-invalid={fieldErrors.deliveryAddress ? true : undefined}
            className={`${adminControl.input} w-full resize-none px-3 py-2 text-sm focus-ra-primary`}
          />
          {fieldErrors.deliveryAddress && (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.deliveryAddress}</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
