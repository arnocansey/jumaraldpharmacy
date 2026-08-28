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
  category: string | { id: string; name: string; slug: string };
  brand?: string | { id: string; name: string; slug: string };
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
}

const CART_STORAGE_KEY = "jumarald_cart_items_v1";

export function useCartStore() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
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
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) => (i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i));
      }
      return [...prev, { product, quantity }];
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
  const requiresPrescription = items.some((item) =>
    Boolean(
      item.product?.requiresPrescription === true ||
      String(item.product?.requiresPrescription).toLowerCase() === "true" ||
      (item.product as any)?.isPrescription === true ||
      (item.product as any)?.requires_prescription === true
    )
  );

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
