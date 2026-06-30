import { restaurantThemeBootstrapScript } from "@/lib/restaurantThemeStorage";
import Script from "next/script";

/** Blocking theme restore from localStorage — prevents default-color flash on reload. */
export default function RestaurantThemeBootstrap() {
  return (
    <Script id="restaurant-theme-bootstrap" strategy="beforeInteractive">
      {restaurantThemeBootstrapScript()}
    </Script>
  );
}
