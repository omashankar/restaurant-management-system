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
    // Restore non-API session state (orders, kitchen queue, floor state)
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.tableCategories) setTableCategories(d.tableCategories);
        if (d.floorTables)     setFloorTables(d.floorTables);
        if (d.staffRows)       setStaffRows(d.staffRows);
        if (d.customerRows)    setCustomerRows(d.customerRows);
        if (d.reservationRows) setReservationRows(d.reservationRows);
        if (d.inventoryRows)   setInventoryRows(d.inventoryRows);
        if (d.inventoryHistory) setInventoryHistory(d.inventoryHistory);
        if (d.orderRows)       setOrderRows(d.orderRows);
        if (d.kitchenQueue)    setKitchenQueue(d.kitchenQueue);
      }
    } catch {
      sessionStorage.removeItem(KEY);
    }

    // Fetch menu + categories from real API
    async function fetchMenuData() {
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
        if (menuData.success   && Array.isArray(menuData.items))        setMenuItems(menuData.items);
        if (catData.success    && Array.isArray(catData.categories))    setCategories(catData.categories);
        if (tablesData.success && Array.isArray(tablesData.tables))     setFloorTables(tablesData.tables);
        if (areasData.success  && Array.isArray(areasData.areas))       setTableCategories(areasData.areas);
      } catch (err) {
        console.error("[ModuleDataContext] Failed to fetch menu data:", err.message);
      }
    }

    fetchMenuData().finally(() => setHydrated(true));
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
  }, []);  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(
      KEY,
      JSON.stringify({
        staffRows,
        customerRows,
        reservationRows,
        inventoryRows,
        inventoryHistory,
        orderRows,
        kitchenQueue,
      })
    );
  }, [
    hydrated,
    staffRows,
    customerRows,
    reservationRows,
    inventoryRows,
    inventoryHistory,
    orderRows,
    kitchenQueue,
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
