"use client";

import { create } from "zustand";

export interface CartProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
  requiresPrescription: boolean;
  images: string[];
  category?: any;
  brand?: any;
  [key: string]: any;
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
}

export function isProductPrescriptionRequired(product: any): boolean {
  if (!product) return false;
  if (product.requiresPrescription === true || String(product.requiresPrescription).toLowerCase() === "true") return true;
  if (product.isPrescription === true || String(product.isPrescription).toLowerCase() === "true") return true;
  if (product.prescriptionRequired === true || String(product.prescriptionRequired).toLowerCase() === "true") return true;
  if (product.prescription === true || String(product.prescription).toLowerCase() === "true") return true;

  const catSlug = typeof product.category === "string" ? product.category.toLowerCase() : product.category?.slug?.toLowerCase() || "";
  const catName = typeof product.category === "string" ? product.category.toLowerCase() : product.category?.name?.toLowerCase() || "";
  if (catSlug.includes("prescription") || catName.includes("prescription")) return true;

  if (Array.isArray(product.tags) && product.tags.some((t: any) => String(t).toLowerCase().includes("prescription") || String(t).toLowerCase() === "rx")) {
    return true;
  }

  return false;
}

const CART_STORAGE_KEY = "jumarald_cart_items_v1";

function loadCartFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (saved) {
      const rawItems: CartItem[] = JSON.parse(saved);
      return rawItems.map((item) => ({
        ...item,
        product: {
          ...item.product,
          requiresPrescription: isProductPrescriptionRequired(item.product),
        },
      }));
    }
  } catch (e) {
    console.error("Failed to load cart from storage", e);
  }
  return [];
}

function saveCartToStorage(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

interface CartStore {
  items: CartItem[];
  isInitialized: boolean;
  initialize: () => void;
  addToCart: (product: CartProduct, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItemCount: () => number;
  subtotalAmount: () => number;
  requiresPrescription: () => boolean;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isInitialized: false,

  initialize: () => {
    if (get().isInitialized) return;
    const items = loadCartFromStorage();
    set({ items, isInitialized: true });
  },

  addToCart: (product, quantity = 1) => {
    const isRx = isProductPrescriptionRequired(product);
    const normalizedProduct: CartProduct = { ...product, requiresPrescription: isRx };

    set((state) => {
      const existing = state.items.find((i) => i.product.id === product.id);
      const newItems = existing
        ? state.items.map((i) => (i.product.id === product.id ? { ...i, product: normalizedProduct, quantity: i.quantity + quantity } : i))
        : [...state.items, { product: normalizedProduct, quantity }];
      saveCartToStorage(newItems);
      return { items: newItems };
    });
  },

  removeFromCart: (productId) => {
    set((state) => {
      const newItems = state.items.filter((i) => i.product.id !== productId);
      saveCartToStorage(newItems);
      return { items: newItems };
    });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }
    set((state) => {
      const newItems = state.items.map((i) => (i.product.id === productId ? { ...i, quantity } : i));
      saveCartToStorage(newItems);
      return { items: newItems };
    });
  },

  clearCart: () => {
    set({ items: [] });
    saveCartToStorage([]);
  },

  totalItemCount: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
  subtotalAmount: () => get().items.reduce((acc, item) => acc + (Number(item.product?.price) || 0) * item.quantity, 0),
  requiresPrescription: () => get().items.some((item) => isProductPrescriptionRequired(item.product)),
}));
