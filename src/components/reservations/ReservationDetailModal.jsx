"use client";

import Modal from "@/components/ui/Modal";
import { useAdminLocale } from "@/context/RestaurantLocaleContext";
import { getReservationTimeline } from "@/lib/reservationUtils";
import { Check, Circle, X } from "lucide-react";
import StatusBadge from "./StatusBadge";

function dotForTone(tone) {
  if (tone === "done")
    return (
      <span className="flex size-8 items-center justify-center rounded-full bg-ra-primary-20 text-ra-primary ring-2 ring-ra-primary-40">
        <Check className="size-4" strokeWidth={2.5} />
      </span>
    );
  if (tone === "bad")
    return (
      <span className="flex size-8 items-center justify-center rounded-full bg-red-500/20 text-red-400 ring-2 ring-red-500/40">
        <X className="size-4" strokeWidth={2.5} />
      </span>
    );
  if (tone === "skip")
    return (
      <span className="flex size-8 items-center justify-center rounded-full bg-zinc-800 admin-surface-faint ring-2 ring-zinc-700">
        <Circle className="size-4" />
      </span>
    );
  return (
    <span className="flex size-8 items-center justify-center rounded-full bg-amber-500/15 text-amber-400 ring-2 ring-amber-500/35">
      <Circle className="size-4 fill-current" />
    </span>
  );
}

export default function ReservationDetailModal({ open, onClose, reservation }) {
  const { formatReservationDate, formatTimeSlot, formatDateTime } = useAdminLocale();
  if (!reservation) return null;

  const timeline = getReservationTimeline(reservation);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reservation details"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="w-full cursor-pointer rounded-xl border admin-shell-border px-4 py-2 text-sm font-medium admin-surface-body hover:border-zinc-500 sm:ml-auto sm:w-auto"
        >
          Close
        </button>
      }
    >
      <div className="min-w-0 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="break-words admin-surface-title text-lg font-semibold">
              {reservation.customerName}
            </h3>
            <p className="text-xs admin-surface-muted">{reservation.id}</p>
          </div>
          <StatusBadge status={reservation.status} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["Phone", reservation.phone],
            ["Guests", String(reservation.guests)],
            ["Date", formatReservationDate(reservation.date)],
            ["Time", formatTimeSlot(reservation.time)],
            ["Table", reservation.tableNumber],
            ...(reservation.area ? [["Area", reservation.area]] : []),
          ].map(([k, v]) => (
            <div
              key={k}
              className="rounded-xl border admin-shell-border bg-zinc-950/50 px-3 py-3 transition-colors duration-200 hover:border-zinc-700"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider admin-surface-muted">
                {k}
              </p>
              <p className="mt-1 break-words text-sm font-medium admin-shell-text">{v}</p>
            </div>
          ))}
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider admin-surface-muted">
            Notes
          </p>
          <p className="mt-1 break-words text-sm leading-relaxed admin-surface-muted">
            {reservation.notes || "—"}
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider admin-surface-muted">
            Timeline
          </p>
          <ol className="mt-4 space-y-0">
            {timeline.map((step, i) => (
              <li
                key={step.key}
                className="relative flex gap-4 pb-6 last:pb-0 [animation:menu-grid-in_0.35s_ease-out_both]"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {i < timeline.length - 1 ? (
                  <span
                    className="absolute left-[15px] top-8 h-[calc(100%-0.5rem)] w-px bg-zinc-800"
                    aria-hidden
                  />
                ) : null}
                <div className="relative z-10 shrink-0">{dotForTone(step.tone)}</div>
                <div className="min-w-0 pt-1">
                  <p className="font-medium admin-shell-text">{step.label}</p>
                  <p className="text-xs admin-surface-muted">
                    {step.at
                      ? formatDateTime(step.at)
                      : step.tone === "wait"
                        ? "Awaiting…"
                        : "—"}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Modal>
  );
}
