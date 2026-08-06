"use client";

import React from "react";
import Link from "next/link";
import { Trash2, Plus, Minus, ShieldAlert, ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { useCartStore } from "@/store/useCartStore";
import { formatCurrency } from "@/lib/utils";

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, subtotalAmount, requiresPrescription, clearCart } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center space-y-4">
        <ShoppingBag className="h-16 w-16 text-slate-300 mx-auto animate-bounce" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Cart is Empty</h2>
        <p className="text-sm text-slate-500">Explore our certified pharmaceutical catalog to add medications.</p>
        <Link href="/shop">
          <Button variant="primary" size="md">Start Shopping</Button>
        </Link>
      </div>
    );
  }

  const shippingFee = 25;
  const grandTotal = subtotalAmount + shippingFee;

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Shopping Cart ({items.length} Items)</h1>
        <Button variant="ghost" size="sm" onClick={clearCart} className="text-red-600">Clear Cart</Button>
      </div>

      {requiresPrescription && (
        <Card glass className="p-4 border-amber-300 dark:border-amber-700 bg-amber-50/50 flex items-center gap-3">
          <ShieldAlert className="h-6 w-6 text-amber-600 shrink-0" />
          <div className="text-xs text-amber-900 dark:text-amber-200">
            <span className="font-bold">Prescription Items Detected:</span> Ensure you have uploaded a valid prescription during checkout.
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {items.map(({ product, quantity }) => (
            <Card key={product.id} className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <img src={product.images[0]} alt={product.name} className="h-20 w-20 rounded-xl object-cover" />
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">{product.name}</h3>
                  <p className="text-xs text-slate-500">{product.brand}</p>
                  {product.requiresPrescription && <Badge variant="amber" className="mt-1">Rx Required</Badge>}
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(product.price)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                <div className="flex items-center border rounded-xl p-1 bg-slate-50 dark:bg-slate-800">
                  <button onClick={() => updateQuantity(product.id, quantity - 1)} className="p-1"><Minus className="h-3.5 w-3.5" /></button>
                  <span className="w-8 text-center font-bold text-xs">{quantity}</span>
                  <button onClick={() => updateQuantity(product.id, quantity + 1)} className="p-1"><Plus className="h-3.5 w-3.5" /></button>
                </div>

                <span className="font-extrabold text-base min-w-[80px] text-right">{formatCurrency(product.price * quantity)}</span>

                <button onClick={() => removeFromCart(product.id)} className="text-slate-400 hover:text-red-600">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">Order Summary</h3>
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotalAmount)}</span></div>
              <div className="flex justify-between"><span>Cold-Chain Express Delivery</span><span>{formatCurrency(shippingFee)}</span></div>
              <div className="pt-3 border-t font-extrabold text-base text-slate-900 dark:text-white flex justify-between">
                <span>Grand Total</span><span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <Link href="/checkout" className="block pt-2">
              <Button variant="primary" size="lg" className="w-full">
                Proceed to Checkout <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
