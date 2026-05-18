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
