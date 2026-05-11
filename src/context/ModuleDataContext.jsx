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
import { useUser } from "@/context/AuthContext";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";

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
  const { user, hydrated: authHydrated } = useUser();
  const pathname = usePathname();
  /** Staff previewing /home · /order/* · /account/* should see the same public menu as guests */
  const isCustomerFacing =
    typeof pathname === "string" &&
    /^(\/home|\/order|\/account)(\/|$)/.test(pathname);
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
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.tableCategories) setTableCategories(d.tableCategories);
        if (d.floorTables) setFloorTables(d.floorTables);
        if (d.staffRows) setStaffRows(d.staffRows);
        if (d.inventoryHistory) setInventoryHistory(d.inventoryHistory);
      }
    } catch {
      sessionStorage.removeItem(KEY);
    }

    if (!authHydrated) return;

    let cancelled = false;

    async function fetchPublicCustomerMenuCategories() {
      const [menuRes, catRes] = await Promise.all([
        fetch("/api/customer/menu"),
        fetch("/api/customer/categories"),
      ]);
      const [menuData, catData] = await Promise.all([menuRes.json(), catRes.json()]);
      if (cancelled) return;
      if (menuData.success && Array.isArray(menuData.items)) {
        setMenuItems(menuData.items);
      }
      if (catData.success && Array.isArray(catData.categories)) {
        setCategories(catData.categories);
      }
    }

    async function fetchTenantModuleData() {
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
      if (cancelled) return;
      if (menuData.success && Array.isArray(menuData.items)) setMenuItems(menuData.items);
      if (catData.success && Array.isArray(catData.categories)) setCategories(catData.categories);
      if (tablesData.success && Array.isArray(tablesData.tables)) setFloorTables(tablesData.tables);
      if (areasData.success && Array.isArray(areasData.areas)) setTableCategories(areasData.areas);
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
        setKitchenQueue(ordersData.orders.filter((o) => ["new", "preparing", "ready"].includes(o.status)));
      }
    }

    (async () => {
      try {
        if (!user) {
          try {
            await fetchPublicCustomerMenuCategories();
          } catch (err) {
            console.error("[ModuleDataContext] Failed to fetch customer data:", err.message);
          }
          return;
        }

        if (user.role === "super_admin") {
          if (isCustomerFacing) {
            try {
              await fetchPublicCustomerMenuCategories();
            } catch (err) {
              console.error("[ModuleDataContext] Failed to fetch customer data:", err.message);
            }
          }
          return;
        }

        if (isCustomerFacing) {
          try {
            await fetchTenantModuleData();
            await fetchPublicCustomerMenuCategories();
          } catch (err) {
            console.error("[ModuleDataContext] Failed to fetch module/storefront data:", err.message);
          }
          return;
        }

        try {
          await fetchTenantModuleData();
        } catch (err) {
          console.error("[ModuleDataContext] Failed to fetch module data:", err.message);
        }
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authHydrated, user, isCustomerFacing]);

  const refreshMenu = useCallback(async () => {
    const usePublicStorefront = !user || isCustomerFacing;
    const menuUrl = usePublicStorefront ? "/api/customer/menu" : "/api/menu";
    const categoriesUrl = usePublicStorefront ? "/api/customer/categories" : "/api/categories";
    try {
      if (usePublicStorefront && !user) {
        const [menuRes, catRes] = await Promise.all([fetch(menuUrl), fetch(categoriesUrl)]);
        const [menuData, catData] = await Promise.all([menuRes.json(), catRes.json()]);
        if (menuData.success && Array.isArray(menuData.items)) setMenuItems(menuData.items);
        if (catData.success && Array.isArray(catData.categories)) setCategories(catData.categories);
        return;
      }

      const [menuRes, catRes, tablesRes, areasRes] = await Promise.all([
        fetch(menuUrl),
        fetch(categoriesUrl),
        fetch("/api/tables"),
        fetch("/api/tables/areas"),
      ]);
      const [menuData, catData, tablesData, areasData] = await Promise.all([
        menuRes.json(),
        catRes.json(),
        tablesRes.json(),
        areasRes.json(),
      ]);
      if (menuData.success && Array.isArray(menuData.items)) setMenuItems(menuData.items);
      if (catData.success && Array.isArray(catData.categories)) setCategories(catData.categories);
      if (tablesData.success && Array.isArray(tablesData.tables)) setFloorTables(tablesData.tables);
      if (areasData.success && Array.isArray(areasData.areas)) setTableCategories(areasData.areas);
    } catch (err) {
      console.error("[ModuleDataContext] refreshMenu failed:", err.message);
    }
  }, [user, isCustomerFacing]);

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
