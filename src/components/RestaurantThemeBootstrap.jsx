import { restaurantThemeBootstrapScript } from "@/lib/restaurantThemeStorage";

/** Blocking theme restore from localStorage — prevents default-color flash on reload. */
export default function RestaurantThemeBootstrap() {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: restaurantThemeBootstrapScript() }}
    />
  );
}
