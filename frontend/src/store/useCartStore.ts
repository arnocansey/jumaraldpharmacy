"use client";

import { useState, useEffect } from "react";

export interface CartProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
  requiresPrescription: boolean;
  images: string[];
  category: string | { id?: string; name: string; slug?: string };
  brand?: string | { id?: string; name: string; slug?: string };
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
  
  // Category checks
  const catSlug = typeof product.category === "string" ? product.category.toLowerCase() : product.category?.slug?.toLowerCase() || "";
  const catName = typeof product.category === "string" ? product.category.toLowerCase() : product.category?.name?.toLowerCase() || "";
  if (catSlug.includes("prescription") || catName.includes("prescription")) return true;

  // Tags checks
  if (Array.isArray(product.tags) && product.tags.some((t: any) => String(t).toLowerCase().includes("prescription") || String(t).toLowerCase() === "rx")) {
    return true;
  }

  return false;
}

const CART_STORAGE_KEY = "jumarald_cart_items_v1";

export function useCartStore() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const rawItems: CartItem[] = JSON.parse(saved);
        // Normalize loaded cart items
        const normalized = rawItems.map((item) => ({
          ...item,
          product: {
            ...item.product,
            requiresPrescription: isProductPrescriptionRequired(item.product),
          },
        }));
        setItems(normalized);
      }
    } catch (e) {
      console.error("Failed to load cart from storage", e);
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isInitialized]);

  const addToCart = (product: CartProduct, quantity = 1) => {
    const isRx = isProductPrescriptionRequired(product);
    const normalizedProduct: CartProduct = { ...product, requiresPrescription: isRx };
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) => (i.product.id === product.id ? { ...i, product: normalizedProduct, quantity: i.quantity + quantity } : i));
      }
      return [...prev, { product: normalizedProduct, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) => prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i)));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotalAmount = items.reduce((acc, item) => acc + (Number(item.product?.price) || 0) * item.quantity, 0);
  const requiresPrescription = items.some((item) => isProductPrescriptionRequired(item.product));

  return {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItemCount,
    subtotalAmount,
    requiresPrescription,
    isInitialized,
  };
}
