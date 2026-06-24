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
import { isCustomerStorefrontPath } from "@/lib/customerStorefrontPath";
import { usePathname } from "next/navigation";

const KEY = "rms-modules-v3";

const ModuleDataContext = createContext(null);

const AUTH_PATHS = /^\/(login|signup|forgot-password|reset-password|verify-email)(\/|$)/;

function isAuthPath(pathname = "") {
  return AUTH_PATHS.test(pathname);
}

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

function tenantModuleFetchFlags(role) {
  const isChef = role === "chef";
  return {
    menu: true,
    categories: true,
    orders: true,
    tables: !isChef,
    areas: !isChef,
    customers: !isChef,
    reservations: !isChef,
    inventory: role === "admin" || role === "manager",
  };
}

async function optionalFetch(url, fetchOpts, enabled) {
  if (!enabled) return null;
  return fetch(url, fetchOpts);
}

async function optionalJson(res) {
  if (!res) return { success: false };
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    console.warn(
      "[ModuleDataContext] Expected JSON but got",
      res.status,
      contentType || "unknown",
      res.url
    );
    return { success: false };
  }
  return res.json();
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
  const { user, hydrated: authHydrated, clearUser } = useUser();
  const pathname = usePathname();
  /** Staff previewing customer routes (incl. /r/[slug]/…) should see the public storefront APIs */
  const isCustomerFacing = isCustomerStorefrontPath(pathname);
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
        if (!isCustomerStorefrontPath(pathname)) {
          if (d.tableCategories) setTableCategories(d.tableCategories);
          if (d.floorTables) setFloorTables(d.floorTables);
        }
        if (d.staffRows) setStaffRows(d.staffRows);
        if (d.inventoryHistory) setInventoryHistory(d.inventoryHistory);
      }
    } catch {
      sessionStorage.removeItem(KEY);
    }

    if (!authHydrated) return;
    if (isAuthPath(pathname)) {
      setHydrated(true);
      return;
    }

    let cancelled = false;

    async function fetchPublicCustomerStorefront() {
      const [menuRes, catRes, tablesRes, areasRes] = await Promise.all([
        fetch("/api/customer/menu"),
        fetch("/api/customer/categories"),
        fetch("/api/customer/tables?status=all"),
        fetch("/api/customer/table-areas"),
      ]);
      const [menuData, catData, tablesData, areasData] = await Promise.all([
        menuRes.json(),
        catRes.json(),
        tablesRes.json(),
        areasRes.json(),
      ]);
      if (cancelled) return;
      if (menuData.success && Array.isArray(menuData.items)) {
        setMenuItems(menuData.items);
      }
      if (catData.success && Array.isArray(catData.categories)) {
        setCategories(catData.categories);
      }
      if (tablesData.success && Array.isArray(tablesData.tables)) {
        setFloorTables(tablesData.tables);
      }
      if (areasData.success && Array.isArray(areasData.areas)) {
        setTableCategories(areasData.areas);
      }
    }

    async function fetchTenantModuleData() {
      const fetchOpts = { credentials: "include", cache: "no-store" };
      const flags = tenantModuleFetchFlags(user.role);

      const [
        menuRes,
        catRes,
        tablesRes,
        areasRes,
        customersRes,
        reservationsRes,
        ordersRes,
        inventoryRes,
      ] = await Promise.all([
        optionalFetch("/api/menu", fetchOpts, flags.menu),
        optionalFetch("/api/categories", fetchOpts, flags.categories),
        optionalFetch("/api/tables", fetchOpts, flags.tables),
        optionalFetch("/api/table-areas", fetchOpts, flags.areas),
        optionalFetch("/api/customers", fetchOpts, flags.customers),
        optionalFetch("/api/reservations", fetchOpts, flags.reservations),
        optionalFetch("/api/orders", fetchOpts, flags.orders),
        optionalFetch("/api/inventory", fetchOpts, flags.inventory),
      ]);

      const authResponses = [menuRes, catRes, tablesRes, areasRes, customersRes, reservationsRes, ordersRes, inventoryRes].filter(Boolean);
      if (authResponses.some((r) => r.status === 401)) {
        clearUser();
        return;
      }

      const [
        menuData,
        catData,
        tablesData,
        areasData,
        customersData,
        reservationsData,
        ordersData,
        inventoryData,
      ] = await Promise.all([
        optionalJson(menuRes),
        optionalJson(catRes),
        optionalJson(tablesRes),
        optionalJson(areasRes),
        optionalJson(customersRes),
        optionalJson(reservationsRes),
        optionalJson(ordersRes),
        optionalJson(inventoryRes),
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
          if (isCustomerFacing) {
            try {
              await fetchPublicCustomerStorefront();
            } catch (err) {
              console.error("[ModuleDataContext] Failed to fetch customer data:", err.message);
            }
          }
          return;
        }

        if (user.role === "super_admin") {
          if (isCustomerFacing) {
            try {
              await fetchPublicCustomerStorefront();
            } catch (err) {
              console.error("[ModuleDataContext] Failed to fetch customer data:", err.message);
            }
          }
          return;
        }

        if (isCustomerFacing) {
          // Customer storefront: slug-scoped public menu only (matches guest experience).
          try {
            await fetchPublicCustomerStorefront();
          } catch (err) {
            console.error("[ModuleDataContext] Failed to fetch customer menu:", err.message);
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
  }, [authHydrated, user, isCustomerFacing, pathname, clearUser]);

  const refreshMenu = useCallback(async () => {
    const usePublicStorefront = !user || isCustomerFacing;
    const menuUrl = usePublicStorefront ? "/api/customer/menu" : "/api/menu";
    const categoriesUrl = usePublicStorefront ? "/api/customer/categories" : "/api/categories";
    try {
      if (usePublicStorefront) {
        const [menuRes, catRes, tablesRes, areasRes] = await Promise.all([
          fetch(menuUrl),
          fetch(categoriesUrl),
          fetch("/api/customer/tables?status=all"),
          fetch("/api/customer/table-areas"),
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
        return;
      }

      const [menuRes, catRes, tablesRes, areasRes] = await Promise.all([
        fetch(menuUrl),
        fetch(categoriesUrl),
        fetch("/api/tables"),
        fetch("/api/table-areas"),
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
