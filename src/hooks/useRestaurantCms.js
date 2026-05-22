"use client";

import { useEffect, useState } from "react";

const DEFAULTS = {
  hero: {
    badge: "Chef Crafted · Fresh · Premium",
    headline: "Delicious Food, Delivered to Your Door",
    subheadline: "Explore our kitchen specials, book a table, or order for takeaway and delivery.",
    ctaPrimaryLabel: "Order Now",
    ctaSecondaryLabel: "Book a Table",
    imageUrl: "",
  },
  announcement: { enabled: false, text: "", bgColor: "#FF6B35", textColor: "#ffffff", link: "", linkLabel: "" },
  about: { headline: "Our Story", description: "", imageUrl: "", stats: [] },
  gallery: { enabled: false, title: "Our Gallery", images: [] },
  social: { instagram: "", facebook: "", twitter: "", whatsapp: "", youtube: "" },
  banners: [
    { id: 1, title: "Budget Feast",    subtitle: "Best deals of the day — limited time offer",         badge: "Hot Deal",    discount: "20% OFF", bgFrom: "#b45309", bgTo: "#d97706", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1400&q=90", ctaLabel: "Order Now",  ctaLink: "/order/menu" },
    { id: 2, title: "Chef's Special",  subtitle: "Freshly crafted every morning by our head chef",     badge: "Chef's Pick", discount: null,      bgFrom: "#c2410c", bgTo: "#ea580c", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1400&q=90", ctaLabel: "View Menu",  ctaLink: "/order/menu" },
    { id: 3, title: "Free Delivery",   subtitle: "On all orders above ₹299 — order now",               badge: "Free",        discount: "FREE",    bgFrom: "#15803d", bgTo: "#16a34a", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1400&q=90", ctaLabel: "Order Now",  ctaLink: "/order/menu" },
    { id: 4, title: "Book a Table",    subtitle: "Reserve your spot and enjoy a premium dining experience", badge: "Reserve",  discount: null,      bgFrom: "#1d4ed8", bgTo: "#2563eb", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1400&q=90", ctaLabel: "Book Now",   ctaLink: "/order/table-booking" },
    { id: 5, title: "Weekend Special", subtitle: "Extra savings every Saturday & Sunday",               badge: "Weekend",     discount: "25% OFF", bgFrom: "#9f1239", bgTo: "#e11d48", image: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=1400&q=90", ctaLabel: "Grab Deal",  ctaLink: "/order/menu" },
  ],
};

let _cache = null;
let _cacheTime = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

export function useRestaurantCms() {
  const [content, setContent] = useState(_cache ?? DEFAULTS);
  const [loading, setLoading] = useState(!_cache);

  useEffect(() => {
    if (_cache && Date.now() - _cacheTime < CACHE_TTL) {
      setContent(_cache);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch("/api/customer/restaurant-cms", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.success && data.content) {
          _cache = { ...DEFAULTS, ...data.content };
          _cacheTime = Date.now();
          setContent(_cache);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { content, loading };
}

export function invalidateRestaurantCmsCache() {
  _cache = null;
  _cacheTime = 0;
}
