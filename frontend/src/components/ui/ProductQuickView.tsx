"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Star, ShoppingCart, AlertCircle, CheckCircle } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

const BLUR_DATA = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+" ;

interface Product {
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
  category: { name: string };
  brand?: { name: string };
}

export function ProductQuickView({ product, open, onClose }: { product: Product; open: boolean; onClose: () => void }) {
  const [currentImage, setCurrentImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const inStock = product.stockQuantity > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogTitle className="sr-only">{product.name}</DialogTitle>
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="bg-slate-50 p-6">
            <div className="aspect-square rounded-xl overflow-hidden mb-3">
              {product.images[currentImage] ? (
                <Image src={product.images[currentImage]} alt={product.name} fill sizes="(max-width: 768px) 100vw, 50vw" quality={85} placeholder="blur" blurDataURL={BLUR_DATA} className="object-contain p-2" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">No image</div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, i) => (
                  <button key={i} onClick={() => setCurrentImage(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 bg-white ${i === currentImage ? "border-emerald-500" : "border-slate-200"}`}>
                    <Image src={img} alt="" fill sizes="64px" quality={80} placeholder="blur" blurDataURL={BLUR_DATA} className="object-contain p-1" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-6">
            <div className="mb-1">
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{product.category?.name}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">{product.name}</h2>

            {product.brand && <p className="text-sm text-slate-500 mb-3">{product.brand.name}</p>}

            <div className="flex items-center gap-2 mb-3">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`h-4 w-4 ${s <= product.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-200"}`} />
                ))}
              </div>
              <span className="text-sm text-slate-500">({product.reviewCount} reviews)</span>
            </div>

            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-2xl font-bold text-emerald-600">GHS {product.price.toFixed(2)}</span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-lg text-slate-400 line-through">GHS {product.compareAtPrice.toFixed(2)}</span>
              )}
            </div>

            <div className="space-y-2 mb-4 text-sm">
              {product.dosageForm && <p><span className="text-slate-500">Form:</span> <span className="font-medium">{product.dosageForm}</span></p>}
              {product.strength && <p><span className="text-slate-500">Strength:</span> <span className="font-medium">{product.strength}</span></p>}
              {product.activeIngredients && <p><span className="text-slate-500">Active:</span> <span className="font-medium">{product.activeIngredients}</span></p>}
            </div>

            {product.requiresPrescription && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center gap-2 text-sm text-amber-700">
                <AlertCircle className="h-4 w-4" /> Prescription required
              </div>
            )}

            <div className="mb-4">
              {inStock ? (
                <div className="flex items-center gap-2 text-sm text-green-600"><CheckCircle className="h-4 w-4" /> In Stock ({product.stockQuantity} available)</div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-red-500"><AlertCircle className="h-4 w-4" /> Out of Stock</div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2 hover:bg-slate-50">-</button>
                <span className="px-4 py-2 text-sm font-semibold">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-2 hover:bg-slate-50">+</button>
              </div>
              <button disabled={!inStock} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                <ShoppingCart className="h-4 w-4" /> Add to Cart
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
