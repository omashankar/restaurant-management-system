/** Extended CMS defaults — home sections, contact, booking, menu labels */

const H = (badge, title, subtitle, actionLabel = "") => ({
  badge,
  title,
  subtitle,
  actionLabel,
});

export const DEFAULT_HOME_SECTIONS = {
  sectionHeaders: {
    orderTypes: H("How You Dine", "Choose Your Order Style", "Pick one — you can change it anytime before checkout."),
    categories: H("Browse", "Explore Your Dish", "Browse by category and find exactly what you're craving.", "View full menu"),
    featured: H("Chef's Pick", "Chef's Favorite", "Handpicked by our chef — fresh, bold, and unforgettable.", "View All"),
    menuPreview: H("Explore", "Our Delicious Menu", "Fresh ingredients, authentic flavors — crafted with love.", "View Full Menu"),
    steps: H("Simple Process", "How It Works", "From browsing to enjoying — quick and clear."),
    reviews: H("Reviews", "Voices of Our Food Lovers", "See why our guests keep coming back for more."),
  },
  orderTypes: [
    { id: "dine-in", title: "Dine-In", description: "Reserve your table and enjoy warm hospitality in our restaurant." },
    { id: "takeaway", title: "Takeaway", description: "Order ahead and pick up fresh meals right from our counter." },
    { id: "delivery", title: "Delivery", description: "Get restaurant-quality food delivered quickly to your doorstep." },
  ],
  steps: [
    { n: "01", title: "Choose Order Type", text: "Choose Dine-In, Takeaway, or Delivery for your restaurant experience.", icon: "layout-grid" },
    { n: "02", title: "Browse the Menu", text: "Explore chef-crafted starters, mains, beverages, and desserts.", icon: "credit-card" },
    { n: "03", title: "Add to Cart", text: "Pick your dishes, customize quantity, and review your order.", icon: "package-search" },
    { n: "04", title: "Place Your Order", text: "Confirm details and place order - our kitchen starts preparing instantly.", icon: "chef-hat" },
    { n: "05", title: "Enjoy Your Meal", text: "Sit back and enjoy fresh, hot food prepared by our team.", icon: "bar-chart-3" },
  ],
  reviews: [
    { name: "Aisha Khan", role: "Weekend Diner", quote: "Food is always fresh and delivery is super fast. Love the online ordering!" },
    { name: "Rohan Sharma", role: "Family Guest", quote: "Table booking was seamless and the staff was very welcoming." },
    { name: "Priya Nair", role: "Takeaway Guest", quote: "Order was ready exactly on time. The app makes it so easy to order ahead." },
  ],
  cta: {
    title: "Ready to Order?",
    subtitle: "Fresh food, seamless checkout, and real-time updates you can trust.",
    primaryLabel: "Order Now",
    primaryLink: "",
    primaryOpensModal: true,
    secondaryLabel: "Book Table",
    secondaryLink: "/order/table-booking",
  },
};

export const DEFAULT_ABOUT_EXTRAS = {
  featuresHeader: H("Why Choose Us", "What Makes Us Special", "We go above and beyond to make every visit memorable."),
  features: [
    { title: "Quality First", description: "Every dish is crafted with premium ingredients sourced from local farms and trusted suppliers." },
    { title: "Fast Service", description: "We respect your time. Most orders are ready in under 20 minutes — fresh and hot." },
    { title: "Made with Love", description: "Our dining experience is more than a meal — it's warm hospitality in every plate." },
  ],
  visitHeader: H("Find Us", "Visit Us", ""),
  bottomCta: {
    title: "Ready to Taste the Difference?",
    subtitle: "Order online or visit us — we're always ready to serve you.",
    primaryLabel: "Order Now",
    primaryLink: "/order/menu",
    secondaryLabel: "Contact Us",
    secondaryLink: "/order/contact",
  },
};

export const DEFAULT_CONTACT_PAGE = {
  eyebrow: "Get in Touch",
  title: "Contact Us",
  subtitle: "Have a question, feedback, or just want to say hello? We'd love to hear from you.",
  formTitle: "Send us a message",
  submitLabel: "Send Message",
  successTitle: "Message sent!",
  successMessage: "Thanks for reaching out. We'll get back to you soon.",
};

export const DEFAULT_BOOKING_PAGE = {
  pageTitle: "Book a Table",
  pageSubtitle: "Reserve your spot - we'll confirm within 30 minutes.",
  detailsTitle: "Your Details",
  areaTitle: "Select Seating Area",
  tableTitleSuffix: "Tables",
  confirmTitle: "Confirm Your Booking",
  successTitle: "Booking Request Sent!",
  successSubtitle: "We'll confirm your table shortly.",
  noAreasLabel: "No seating areas available yet.",
  noTablesLabel: "No tables match this filter.",
  clearFilterLabel: "Clear filter",
};

export const DEFAULT_MENU_LABELS = {
  titlePrefix: "Explore Our Delicious",
  titleHighlight: "Foods Menu",
  subtitleSuffix: "fresh dishes crafted with love",
  searchPlaceholder: "Ex: Search for food",
  selectOrderType: "Select Order Type",
  changeOrderType: "Change",
  allCategoryLabel: "All",
  allTypesLabel: "All Types",
  fastFilterLabel: "Fast (<10 min)",
  clearAllLabel: "Clear All",
  emptyMenuTitle: "Menu coming soon",
  emptyMenuSubtitle:
    "This restaurant hasn't published dishes yet. Please check back later or contact the team.",
  emptyMenuCta: "Contact restaurant",
  emptyStateTitle: "No items match your filters",
  emptyStateSubtitle: "Try adjusting your filters or search term.",
  clearFiltersLabel: "Clear Filters",
  addToCartLabel: "Add to Cart",
  inCartLabel: "In Cart",
  viewCartLabel: "View Cart",
};
