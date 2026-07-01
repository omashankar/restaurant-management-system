"use client";

import { restaurantThemeBootstrapScript } from "@/lib/restaurantThemeStorage";
import { useServerInsertedHTML } from "next/navigation";

/** Blocking theme restore from localStorage — prevents default-color flash on reload. */
export default function RestaurantThemeBootstrap() {
  useServerInsertedHTML(() => (
    <script
      id="restaurant-theme-bootstrap"
      dangerouslySetInnerHTML={{ __html: restaurantThemeBootstrapScript() }}
    />
  ));
  return null;
}
