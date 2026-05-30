"use client";

import { saSkeletonBlockCls, saSkeletonCardCls } from "@/config/superAdminTheme";

export default function SuperAdminPageSkeleton({
  rows = 4,
  rowClassName = "h-10",
  cards = 0,
  cardClassName = "h-28",
  cardCols = "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
}) {
  return (
    <div className="space-y-4">
      {cards > 0 ? (
        <div className={cardCols}>
          {Array.from({ length: cards }).map((_, i) => (
            <div key={`card-${i}`} className={`${saSkeletonCardCls} ${cardClassName}`} />
          ))}
        </div>
      ) : null}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={`row-${i}`} className={`${saSkeletonBlockCls} ${rowClassName}`} />
      ))}
    </div>
  );
}
