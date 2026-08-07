"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const BLUR_DATA = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+" ;

interface ViewedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  images?: string[];
  viewedAt: number;
}

const STORAGE_KEY = "jumarald_recently_viewed";
const MAX_ITEMS = 6;

export function RecentlyViewed() {
  const [products, setProducts] = useState<ViewedProduct[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ViewedProduct[];
        setProducts(parsed.slice(0, MAX_ITEMS));
      }
    } catch {}
  }, []);

  if (products.length === 0) return null;

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-10 space-y-6">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-slate-400" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Recently Viewed</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {products.map((p) => (
          <Link key={p.id} href={`/shop/${p.slug}`} className="group">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-3 hover:shadow-lg transition-all">
              <div className="h-24 w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-700 mb-3">
                {p.images?.[0] ? (
                  <Image src={p.images[0]} alt={p.name} width={200} height={96} quality={80} placeholder="blur" blurDataURL={BLUR_DATA} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-300">
                    <Package className="h-6 w-6" />
                  </div>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                {p.name}
              </p>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                {formatCurrency(p.price)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function trackRecentlyViewed(product: { id: string; name: string; slug: string; price: number; images?: string[] }) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const items: ViewedProduct[] = stored ? JSON.parse(stored) : [];
    const filtered = items.filter((i) => i.id !== product.id);
    filtered.unshift({ ...product, viewedAt: Date.now() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_ITEMS)));
  } catch {}
}
