"use client";

import Modal from "@/components/ui/Modal";
import {
  formatReservationDate,
  formatTimeSlot,
  getReservationTimeline,
} from "@/lib/reservationUtils";
import { Check, Circle, X } from "lucide-react";
import StatusBadge from "./StatusBadge";

function dotForTone(tone) {
  if (tone === "done")
    return (
      <span className="flex size-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/40">
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
      <span className="flex size-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-600 ring-2 ring-zinc-700">
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
          className="cursor-pointer rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-500"
        >
          Close
        </button>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-zinc-50">
              {reservation.customerName}
            </h3>
            <p className="text-xs text-zinc-500">{reservation.id}</p>
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
              className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-3 py-3 transition-colors duration-200 hover:border-zinc-700"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                {k}
              </p>
              <p className="mt-1 text-sm font-medium text-zinc-200">{v}</p>
            </div>
          ))}
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Notes
          </p>
          <p className="mt-1 text-sm leading-relaxed text-zinc-400">
            {reservation.notes || "—"}
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
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
                  <p className="font-medium text-zinc-200">{step.label}</p>
                  <p className="text-xs text-zinc-500">
                    {step.at
                      ? new Date(step.at).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
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
