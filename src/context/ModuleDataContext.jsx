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
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const KEY = "rms-modules-v2";

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
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.categories) setCategories(d.categories);
        if (d.tableCategories) setTableCategories(d.tableCategories);
        if (d.menuItems) setMenuItems(d.menuItems);
        if (d.recipes) setRecipes(d.recipes);
        if (d.floorTables) setFloorTables(d.floorTables);
        if (d.staffRows) setStaffRows(d.staffRows);
        if (d.customerRows) setCustomerRows(d.customerRows);
        if (d.reservationRows) setReservationRows(d.reservationRows);
        if (d.inventoryRows) setInventoryRows(d.inventoryRows);
        if (d.inventoryHistory) setInventoryHistory(d.inventoryHistory);
        if (d.orderRows) setOrderRows(d.orderRows);
        if (d.kitchenQueue) setKitchenQueue(d.kitchenQueue);
      }
    } catch {
      sessionStorage.removeItem(KEY);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(
      KEY,
      JSON.stringify({
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
      })
    );
  }, [
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
