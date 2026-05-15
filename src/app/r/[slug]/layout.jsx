/**
 * /r/[slug]/* layout
 *
 * Yeh layout middleware ke rewrite ke baad kaam karta hai.
 * Middleware /r/pizza-palace/home ko /home pe rewrite karta hai
 * aur x-restaurant-slug header set karta hai.
 *
 * Isliye yahan koi extra wrapping nahi chahiye —
 * customer layout already (customer)/layout.jsx mein hai.
 */

export default function RestaurantSlugLayout({ children }) {
  return children;
}
