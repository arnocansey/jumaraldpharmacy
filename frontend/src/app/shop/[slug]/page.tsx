"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Star, ShieldAlert, CheckCircle, Truck, Heart, ArrowLeft, UploadCloud, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { MOCK_PRODUCTS } from "@/lib/mockData";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { toast } from "sonner";

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const product = MOCK_PRODUCTS.find((p) => p.slug === slug) || MOCK_PRODUCTS[0];

  const { addToCart } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"details" | "warnings" | "reviews">("details");

  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast.success(`${quantity}x ${product.name} added to cart!`);
  };

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-10 space-y-10">
      {/* Back Link */}
      <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" /> Back to Shop Catalog
      </Link>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Product Gallery */}
        <div className="lg:col-span-5 space-y-4">
          <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
            <img src={product.images[0]} alt={product.name} className="h-96 w-full object-cover" />
          </div>
        </div>

        {/* Product Info */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Badge variant="emerald">{product.brand}</Badge>
              {product.requiresPrescription && <Badge variant="amber">Prescription Required</Badge>}
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">{product.name}</h1>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center text-amber-400">
                <Star className="h-4 w-4 fill-amber-400" />
                <span className="ml-1 font-bold text-slate-900 dark:text-white">{product.rating}</span>
              </div>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">{product.reviewCount} Verified Reviews</span>
              <span className="text-slate-400">•</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle className="h-4 w-4" /> In Stock ({product.stockQuantity} available)
              </span>
            </div>
          </div>

          {/* Pricing */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold">Unit Price</p>
              <span className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(product.price)}</span>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1.5">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-bold text-slate-900 dark:text-white">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Rx Warning Banner if Rx required */}
          {product.requiresPrescription && (
            <Card glass className="p-4 border-amber-300 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/30 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1 text-amber-900 dark:text-amber-200">
                <p className="font-bold">Doctor&apos;s Prescription Required</p>
                <p>This medication requires verification by our pharmacist before fulfillment.</p>
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button variant="primary" size="lg" className="flex-1" onClick={handleAddToCart}>
              Add to Cart ({formatCurrency(product.price * quantity)})
            </Button>
            {product.requiresPrescription && (
              <Link href="/prescriptions/upload">
                <Button variant="glass" size="lg">
                  <UploadCloud className="h-5 w-5 text-brand-600" /> Upload Rx
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="space-y-6">
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-8 text-sm font-bold">
          <button
            onClick={() => setActiveTab("details")}
            className={`pb-3 ${activeTab === "details" ? "border-b-2 border-brand-600 text-brand-600" : "text-slate-400"}`}
          >
            Clinical Specifications & Dosage
          </button>
          <button
            onClick={() => setActiveTab("warnings")}
            className={`pb-3 ${activeTab === "warnings" ? "border-b-2 border-brand-600 text-brand-600" : "text-slate-400"}`}
          >
            Contraindications & Side Effects
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`pb-3 ${activeTab === "reviews" ? "border-b-2 border-brand-600 text-brand-600" : "text-slate-400"}`}
          >
            Patient Reviews ({product.reviewCount})
          </button>
        </div>

        <Card className="p-6">
          {activeTab === "details" && (
            <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">Active Ingredients</h4>
                <p className="mt-1">{product.activeIngredients}</p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">Usage Instructions</h4>
                <p className="mt-1">{product.usageInstructions}</p>
              </div>
            </div>
          )}

          {activeTab === "warnings" && (
            <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
              <div>
                <h4 className="font-bold text-red-600">Warnings & Contraindications</h4>
                <p className="mt-1">{product.warnings}</p>
              </div>
              <div>
                <h4 className="font-bold text-amber-600">Possible Side Effects</h4>
                <p className="mt-1">{product.sideEffects}</p>
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm font-semibold">
                ⭐️ 4.9 out of 5 based on verified customer orders.
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
