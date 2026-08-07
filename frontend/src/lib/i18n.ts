export type Locale = "en" | "tw";

export const locales: Record<Locale, { label: string; flag: string }> = {
  en: { label: "English", flag: "🇬🇧" },
  tw: { label: "Twi", flag: "🇬🇭" },
};

export const translations: Record<Locale, Record<string, string>> = {
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.shop": "Shop Medicines",
    "nav.categories": "Categories",
    "nav.health": "Health Conditions",
    "nav.prescription": "Prescription Upload",
    "nav.telehealth": "Telehealth Care",
    "nav.blog": "Health Blog",
    "nav.about": "About Jumarald",

    // Common
    "common.search": "Search medicines, conditions...",
    "common.cart": "Cart",
    "common.login": "Sign In",
    "common.register": "Register",
    "common.dashboard": "Dashboard",
    "common.logout": "Logout",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.loading": "Loading...",
    "common.error": "Something went wrong",
    "common.retry": "Try Again",
    "common.back": "Go Back",
    "common.noResults": "No results found",

    // Shop
    "shop.title": "Shop Medicines",
    "shop.filter": "Filter",
    "shop.sort": "Sort By",
    "shop.addToCart": "Add to Cart",
    "shop.outOfStock": "Out of Stock",
    "shop.inStock": "In Stock",
    "shop.lowStock": "Low Stock",
    "shop.rxRequired": "Prescription Required",
    "shop.otp": "Over the Counter",
    "shop.featured": "Featured",
    "shop.reviews": "reviews",
    "shop.description": "Description",
    "shop.usage": "Usage Instructions",
    "shop.sideEffects": "Side Effects",
    "shop.warnings": "Warnings",

    // Cart
    "cart.title": "Shopping Cart",
    "cart.empty": "Your cart is empty",
    "cart.subtotal": "Subtotal",
    "cart.shipping": "Shipping",
    "cart.tax": "Tax",
    "cart.total": "Total",
    "cart.checkout": "Proceed to Checkout",
    "cart.freeShipping": "Free Shipping",

    // Checkout
    "checkout.title": "Checkout",
    "checkout.address": "Delivery Address",
    "checkout.payment": "Payment",
    "checkout.confirm": "Order Confirmation",
    "checkout.coupon": "Coupon Code",
    "checkout.apply": "Apply",
    "checkout.loyalty": "Use Loyalty Points",
    "checkout.pickup": "Pickup In Store",
    "checkout.delivery": "Home Delivery",
    "checkout.placeOrder": "Place Order",
    "checkout.processing": "Processing...",

    // Dashboard
    "dashboard.welcome": "Welcome back",
    "dashboard.orders": "My Orders",
    "dashboard.prescriptions": "My Prescriptions",
    "dashboard.profile": "My Profile",
    "dashboard.addresses": "My Addresses",
    "dashboard.wishlist": "Wishlist",
    "dashboard.notifications": "Notifications",
    "dashboard.loyalty": "Loyalty Points",

    // Orders
    "orders.title": "Order History",
    "orders.track": "Track Order",
    "orders.reorder": "Reorder",
    "orders.status": "Status",
    "orders.date": "Order Date",
    "orders.total": "Total",

    // Auth
    "auth.login": "Sign In",
    "auth.register": "Create Account",
    "auth.forgotPassword": "Forgot Password?",
    "auth.resetPassword": "Reset Password",
    "auth.email": "Email Address",
    "auth.password": "Password",
    "auth.confirmPassword": "Confirm Password",
    "auth.name": "Full Name",
    "auth.phone": "Phone Number",
    "auth.noAccount": "Don't have an account?",
    "auth.hasAccount": "Already have an account?",

    // Footer
    "footer.about": "About Us",
    "footer.contact": "Contact",
    "footer.faq": "FAQ",
    "footer.privacy": "Privacy Policy",
    "footer.terms": "Terms of Service",
    "footer.copyright": "2024 Jumarald Pharmacy. All rights reserved.",
    "footer.licensed": "Licensed by FDA Ghana & NAFDAC",
  },
  tw: {
    // Navigation
    "nav.home": "Fie",
    "nav.shop": "Twa Nkramo",
    "nav.categories": "Nkyekyewmu",
    "nav.health": "Ayaresabe Nneema",
    "nav.prescription": "Nkrataa Krado",
    "nav.telehealth": "Ayaresabe Online",
    "nav.blog": "Ayaresabe Nsem",
    "nav.about": "Yen Ho Nsem",

    // Common
    "common.search": "Hwehw'e nkramo...",
    "common.cart": "Ketea",
    "common.login": "Bra mu",
    "common.register": "Kyere din",
    "common.dashboard": "Wo Adwuma Beae",
    "common.logout": "Yi mu",
    "common.save": "Kora",
    "common.cancel": "Twa mu",
    "common.delete": "Yi fi hɔ",
    "common.edit": "Sesa",
    "common.loading": "Edor...",
    "common.error": "Nkra bi awu",
    "common.retry": "San yɛhwɛ",
    "common.back": "San kɔ",
    "common.noResults": "Yenhuu biribiara",

    // Shop
    "shop.title": "Twa Nkramo",
    "shop.filter": "Sa mu",
    "shop.sort": "Te abɛn",
    "shop.addToCart": "Fa kɛse mu",
    "shop.outOfStock": "Awu mu",
    "shop.inStock": "Wɔ hɔ",
    "shop.lowStock": "Ketewa",
    "shop.rxRequired": "Nkrataa krado ho hia",
    "shop.otp": "Wɔtwa no nko",
    "shop.featured": "Kɛse",
    "shop.reviews": "nsɛm",
    "shop.description": "Nsɛm",
    "shop.usage": "Ɛde yɛ dɛn",
    "shop.sideEffects": "Nsɛm foforo",
    "shop.warnings": "Nsɛm a ɛhia",

    // Cart
    "cart.title": "Wo Ketea",
    "cart.empty": "Wo ketea abɔ mu",
    "cart.subtotal": "Totol",
    "cart.shipping": "Ade a ɛrebrɛ",
    "cart.tax": "Tax",
    "cart.total": "Ntotol",
    "cart.checkout": "Kɔ so",
    "cart.freeShipping": "Ade a ɛrebrɛ ma wo",

    // Checkout
    "checkout.title": "Twa mu",
    "checkout.address": "Beae a wo pɛ",
    "checkout.payment": "Sika",
    "checkout.confirm": "Nyɛ adze",
    "checkout.coupon": "Coupon nkrataa",
    "checkout.apply": "Fa di dwuma",
    "checkout.loyalty": "Fa wo points",
    "checkout.pickup": "Fa woankɔ hɔ",
    "checkout.delivery": "Fa wo fie",
    "checkout.placeOrder": "Twa mu",
    "checkout.processing": "Ɛredor...",

    // Dashboard
    "dashboard.welcome": "Akwaaba",
    "dashboard.orders": "Wo Order",
    "dashboard.prescriptions": "Wo Nkrataa",
    "dashboard.profile": "Wo Ho Nsem",
    "dashboard.addresses": "Wo Beae",
    "dashboard.wishlist": "Wo Pɛ",
    "dashboard.notifications": "Nsɛm Foforo",
    "dashboard.loyalty": "Wo Points",

    // Auth
    "auth.login": "Bra mu",
    "auth.register": "Kyere din",
    "auth.forgotPassword": "Wobirawo nkapaw?",
    "auth.resetPassword": "San hyɛ nkapaw",
    "auth.email": "Email",
    "auth.password": "Nkapaw",
    "auth.confirmPassword": "San hyɛ nkapaw",
    "auth.name": "Wo Din",
    "auth.phone": "Ahomatrofo",
    "auth.noAccount": "Wonni account?",
    "auth.hasAccount": "Wohunu account?",

    // Footer
    "footer.about": "Yen ho",
    "footer.contact": "Fa wo ho kɔ",
    "footer.faq": "Nsɛm a wɔbisa",
    "footer.privacy": "Wo ho nhyehyɛe",
    "footer.terms": "Nhyehyɛe",
    "footer.copyright": "2024 Jumarald Pharmacy. Wo nyinaa ho ho.",
    "footer.licensed": "FDA Ghana & NAFDAC a wɔde di dwuma",
  },
};

export function t(key: string, locale: Locale = "en"): string {
  return translations[locale]?.[key] || translations.en[key] || key;
}
