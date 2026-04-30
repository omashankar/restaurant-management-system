"use client";

import {
  INITIAL_CATEGORIES,
  INITIAL_CUSTOMERS,
  INITIAL_FLOOR_TABLES,
  INITIAL_INVENTORY_HISTORY,
  INITIAL_INVENTORY_ITEMS,
  INITIAL_MENU_ITEMS,
  INITIAL_RECIPES,
  INITIAL_RESERVATIONS,
  INITIAL_STAFF,
  INITIAL_TABLE_CATEGORIES,
} from "@/lib/modulesData";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const KEY = "rms-modules-v3";

const ModuleDataContext = createContext(null);

function normalizeCustomer(row) {
  return {
    id: row.id,
    name: row.name ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    notes: row.notes ?? "",
    visits: Number(row.visits ?? 0),
    lastVisit: row.lastVisit ?? null,
    orderHistory: Array.isArray(row.orderHistory) ? row.orderHistory : [],
  };
}

function normalizeReservation(row) {
  return {
    id: row.id,
    customerName: row.customerName ?? "",
    phone: row.phone ?? "",
    date: row.date ?? "",
    time: row.time ?? "",
    guests: Number(row.guests ?? 2),
    tableNumber: row.tableNumber ?? "TBD",
    area: row.area ?? "",
    notes: row.notes ?? "",
    status: row.status ?? "pending",
    createdAt: row.createdAt ?? null,
    confirmedAt: row.confirmedAt ?? null,
    completedAt: row.completedAt ?? null,
    cancelledAt: row.cancelledAt ?? null,
  };
}

function normalizeInventoryItem(row) {
  return {
    id: row.id,
    name: row.name ?? "",
    category: row.category ?? "Other",
    quantity: Number(row.quantity ?? 0),
    unit: row.unit ?? "unit",
    reorderLevel: Number(row.reorderLevel ?? 0),
    maxLevel: row.maxLevel ?? "",
    supplier: row.supplier ?? "",
    notes: row.notes ?? "",
  };
}

export function ModuleDataProvider({ children }) {
  const [hydrated, setHydrated] = useState(false);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [tableCategories, setTableCategories] = useState(INITIAL_TABLE_CATEGORIES);
  const [menuItems, setMenuItems] = useState(INITIAL_MENU_ITEMS);
  const [recipes, setRecipes] = useState(INITIAL_RECIPES);
  const [floorTables, setFloorTables] = useState(INITIAL_FLOOR_TABLES);
  const [staffRows, setStaffRows] = useState(INITIAL_STAFF);
  const [customerRows, setCustomerRows] = useState(INITIAL_CUSTOMERS);
  const [reservationRows, setReservationRows] = useState(
    INITIAL_RESERVATIONS
  );
  const [inventoryRows, setInventoryRows] = useState(INITIAL_INVENTORY_ITEMS);
  const [inventoryHistory, setInventoryHistory] = useState(
    INITIAL_INVENTORY_HISTORY
  );
  const [orderRows, setOrderRows] = useState([]);
  const [kitchenQueue, setKitchenQueue] = useState([]);

  useEffect(() => {
    // Restore non-API session state (optional floor/staff fallback only)
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (d.tableCategories) setTableCategories(d.tableCategories);
        if (d.floorTables)     setFloorTables(d.floorTables);
        if (d.staffRows)       setStaffRows(d.staffRows);
        if (d.inventoryHistory) setInventoryHistory(d.inventoryHistory);
      }
    } catch {
      sessionStorage.removeItem(KEY);
    }

    // Fetch API-backed module data.
    async function fetchModuleData() {
      try {
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json().catch(() => null);
        // Tenant module APIs (/api/menu, /api/orders, etc.) are for restaurant roles only.
        // Avoid noisy 401/403 calls for super_admin or unauthenticated sessions.
        if (!meData?.success || meData.user?.role === "super_admin") {
          return;
        }

        const [
          menuRes,
          catRes,
          tablesRes,
          areasRes,
          customersRes,
          reservationsRes,
          inventoryRes,
          ordersRes,
        ] = await Promise.all([
          fetch("/api/menu"),
          fetch("/api/categories"),
          fetch("/api/tables"),
          fetch("/api/tables/areas"),
          fetch("/api/customers"),
          fetch("/api/reservations"),
          fetch("/api/inventory"),
          fetch("/api/orders"),
        ]);
        const [
          menuData,
          catData,
          tablesData,
          areasData,
          customersData,
          reservationsData,
          inventoryData,
          ordersData,
        ] = await Promise.all([
          menuRes.json(),
          catRes.json(),
          tablesRes.json(),
          areasRes.json(),
          customersRes.json(),
          reservationsRes.json(),
          inventoryRes.json(),
          ordersRes.json(),
        ]);
        if (menuData.success   && Array.isArray(menuData.items))        setMenuItems(menuData.items);
        if (catData.success    && Array.isArray(catData.categories))    setCategories(catData.categories);
        if (tablesData.success && Array.isArray(tablesData.tables))     setFloorTables(tablesData.tables);
        if (areasData.success  && Array.isArray(areasData.areas))       setTableCategories(areasData.areas);
        if (customersData.success && Array.isArray(customersData.customers)) {
          setCustomerRows(customersData.customers.map(normalizeCustomer));
        }
        if (reservationsData.success && Array.isArray(reservationsData.reservations)) {
          setReservationRows(reservationsData.reservations.map(normalizeReservation));
        }
        if (inventoryData.success && Array.isArray(inventoryData.items)) {
          setInventoryRows(inventoryData.items.map(normalizeInventoryItem));
        }
        if (ordersData.success && Array.isArray(ordersData.orders)) {
          setOrderRows(ordersData.orders);
          setKitchenQueue(
            ordersData.orders.filter((o) => ["new", "preparing", "ready"].includes(o.status))
          );
        }
      } catch (err) {
        console.error("[ModuleDataContext] Failed to fetch module data:", err.message);
      }
    }

    fetchModuleData().finally(() => setHydrated(true));
  }, []);

  const refreshMenu = useCallback(async () => {
    try {
      const [menuRes, catRes, tablesRes, areasRes] = await Promise.all([
        fetch("/api/menu"),
        fetch("/api/categories"),
        fetch("/api/tables"),
        fetch("/api/tables/areas"),
      ]);
      const [menuData, catData, tablesData, areasData] = await Promise.all([
        menuRes.json(),
        catRes.json(),
        tablesRes.json(),
        areasRes.json(),
      ]);
      if (menuData.success   && Array.isArray(menuData.items))     setMenuItems(menuData.items);
      if (catData.success    && Array.isArray(catData.categories)) setCategories(catData.categories);
      if (tablesData.success && Array.isArray(tablesData.tables))  setFloorTables(tablesData.tables);
      if (areasData.success  && Array.isArray(areasData.areas))    setTableCategories(areasData.areas);
    } catch (err) {
      console.error("[ModuleDataContext] refreshMenu failed:", err.message);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(
      KEY,
      JSON.stringify({
        staffRows,
        inventoryHistory,
      })
    );
  }, [
    hydrated,
    staffRows,
    inventoryHistory,
  ]);

  useEffect(() => {
    if (!hydrated) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCategories((cats) =>
      cats.map((c) => ({
        ...c,
        itemCount: menuItems.filter((m) => m.categoryId === c.id).length,
      }))
    );
  }, [hydrated, menuItems]);

  const value = useMemo(
    () => ({
      hydrated,
      categories,
      setCategories,
      tableCategories,
      setTableCategories,
      menuItems,
      setMenuItems,
      recipes,
      setRecipes,
      floorTables,
      setFloorTables,
      staffRows,
      setStaffRows,
      customerRows,
      setCustomerRows,
      reservationRows,
      setReservationRows,
      inventoryRows,
      setInventoryRows,
      inventoryHistory,
      setInventoryHistory,
      orderRows,
      setOrderRows,
      kitchenQueue,
      setKitchenQueue,
      refreshMenu,
    }),
    [
      hydrated,
      categories,
      tableCategories,
      menuItems,
      recipes,
      floorTables,
      staffRows,
      customerRows,
      reservationRows,
      inventoryRows,
      inventoryHistory,
      orderRows,
      kitchenQueue,
      refreshMenu,
    ]
  );

  return (
    <ModuleDataContext.Provider value={value}>
      {children}
    </ModuleDataContext.Provider>
  );
}

export function useModuleData() {
  const ctx = useContext(ModuleDataContext);
  if (!ctx) throw new Error("useModuleData requires ModuleDataProvider");
  return ctx;
}
