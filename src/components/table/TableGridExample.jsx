"use client";

import { useState } from "react";
import TableCard from "./TableCard";

const SAMPLE_TABLES = [
  { id: "t-1", tableNumber: "1", capacity: 2, status: "available" },
  { id: "t-2", tableNumber: "2", capacity: 4, status: "occupied" },
  { id: "t-3", tableNumber: "3", capacity: 6, status: "reserved" },
  { id: "t-4", tableNumber: "4", capacity: 8, status: "available" },
  { id: "t-5", tableNumber: "5", capacity: 10, status: "available" },
];

export default function TableGridExample() {
  const [selectedId, setSelectedId] = useState(null);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {SAMPLE_TABLES.map((table) => (
        <TableCard
          key={table.id}
          table={table}
          selected={selectedId === table.id}
          onSelect={() => setSelectedId(table.id)}
        />
      ))}
    </div>
  );
}
