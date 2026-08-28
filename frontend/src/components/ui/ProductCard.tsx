"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Star, ShoppingCart, Heart, Eye, AlertCircle, CheckCircle } from "lucide-react";
import Image from "next/image";
import { ProductQuickView } from "./ProductQuickView";

const BLUR_DATA = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+" ;

interface ProductProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  rating: number;
  reviewCount: number;
  stockQuantity: number;
  requiresPrescription: boolean;
  images: string[];
  description: string;
  dosageForm?: string;
  strength?: string;
  activeIngredients?: string;
  category: { id?: string; name: string; slug?: string } | string;
  brand?: { id?: string; name: string; slug?: string } | string;
}

import { useCartStore } from "@/store/useCartStore";
import { toast } from "sonner";

export function ProductCard({ product }: { product: ProductProps }) {
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const { addToCart } = useCartStore();

  const inStock = product.stockQuantity > 0;
  const lowStock = product.stockQuantity > 0 && product.stockQuantity <= 10;
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPct = hasDiscount ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100) : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        stockQuantity: product.stockQuantity,
        requiresPrescription: Boolean(
          product.requiresPrescription === true ||
          String(product.requiresPrescription).toLowerCase() === "true" ||
          (product as any).isPrescription === true
        ),
        images: product.images || [],
        category: typeof product.category === "string" ? product.category : product.category?.name || "General",
        brand: typeof product.brand === "string" ? product.brand : product.brand?.name || "",
      },
      1
    );
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        className="bg-white rounded-2xl border border-slate-100 overflow-hidden group hover:shadow-lg transition-all"
      >
        <div className="relative aspect-square bg-slate-50 overflow-hidden">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              quality={80}
              placeholder="blur"
              blurDataURL={BLUR_DATA}
              className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <ShoppingCart className="h-12 w-12" />
            </div>
          )}

          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {hasDiscount && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">-{discountPct}%</span>
            )}
            {product.requiresPrescription && (
              <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-lg">Rx</span>
            )}
          </div>

          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); setWishlisted(!wishlisted); }}
              className={`p-2 rounded-full shadow-md transition-colors ${wishlisted ? "bg-red-500 text-white" : "bg-white text-slate-600 hover:text-red-500"}`}
            >
              <Heart className={`h-4 w-4 ${wishlisted ? "fill-white" : ""}`} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setQuickViewOpen(true); }}
              className="p-2 rounded-full bg-white text-slate-600 shadow-md hover:text-emerald-600 transition-colors"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>

          <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleAddToCart}
              disabled={!inStock}
              className="w-full bg-emerald-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
            >
              <ShoppingCart className="h-4 w-4" />
              {inStock ? "Add to Cart" : "Out of Stock"}
            </button>
          </div>
        </div>

        <div className="p-4">
          <p className="text-xs text-emerald-600 font-medium mb-1">
            {typeof product.category === "string" ? product.category : product.category?.name}
          </p>
          <h3 className="font-bold text-slate-800 mb-1 line-clamp-2 group-hover:text-emerald-700 transition-colors">
            {product.name}
          </h3>

          {product.brand && (
            <p className="text-xs text-slate-500 mb-2">
              {typeof product.brand === "string" ? product.brand : product.brand?.name}
            </p>
          )}

          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={`h-3.5 w-3.5 ${s <= product.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-200"}`} />
            ))}
            <span className="text-xs text-slate-500 ml-1">({product.reviewCount})</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-emerald-600">GHS {product.price.toFixed(2)}</span>
            {hasDiscount && (
              <span className="text-sm text-slate-400 line-through">GHS {product.compareAtPrice!.toFixed(2)}</span>
            )}
          </div>

          <div className="mt-2">
            {inStock ? (
              lowStock ? (
                <span className="text-xs text-amber-600 font-medium">Only {product.stockQuantity} left</span>
              ) : (
                <span className="text-xs text-green-600 font-medium flex items-center gap-1"><CheckCircle className="h-3 w-3" /> In Stock</span>
              )
            ) : (
              <span className="text-xs text-red-500 font-medium flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Out of Stock</span>
            )}
          </div>
        </div>
      </motion.div>

      <ProductQuickView product={product} open={quickViewOpen} onClose={() => setQuickViewOpen(false)} />
    </>
  );
}
