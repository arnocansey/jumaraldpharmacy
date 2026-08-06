"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Filter, Star, Plus, ArrowUpDown, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { toast } from "sonner";
import { API_URL } from "@/lib/api";

export default function ShopPage() {
  const { addToCart } = useCartStore();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [rxOnly, setRxOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetch(`${API_URL}/products/categories`)
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "12", sortBy });
      if (search) params.set("search", search);
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      if (rxOnly) params.set("requiresPrescription", "true");

      const res = await fetch(`${API_URL}/products?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (e) {
      toast.error("Could not load products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, search, selectedCategory, rxOnly]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedCategory, rxOnly, sortBy]);

  useEffect(() => {
    const t = setTimeout(fetchProducts, 300);
    return () => clearTimeout(t);
  }, [fetchProducts]);

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-10 space-y-8">
      {/* Header Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 to-emerald-950 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <Badge variant="emerald">Pharmacy Catalog</Badge>
          <h1 className="text-3xl font-extrabold">All Prescription & OTC Medications</h1>
          <p className="text-slate-300 text-sm">Certified pharmaceuticals with full batch traceability and cold-chain guarantee.</p>
        </div>
        <Link href="/prescriptions/upload">
          <Button variant="glass" size="md">Upload Rx Document</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="space-y-6">
          <Card className="p-5 space-y-5">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Filter className="h-4 w-4 text-emerald-600" /> Filters & Categories
            </h3>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-slate-400">Category</label>
              <div className="space-y-1 text-sm">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${selectedCategory === "all" ? "bg-emerald-600 text-white font-bold" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100"}`}
                >
                  All Products
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`w-full text-left px-3 py-2 rounded-xl transition-colors flex items-center justify-between ${selectedCategory === cat.slug ? "bg-emerald-600 text-white font-bold" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100"}`}
                  >
                    <span>{cat.name}</span>
                    {cat._count?.products !== undefined && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${selectedCategory === cat.slug ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                        {cat._count.products}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={rxOnly} onChange={(e) => setRxOnly(e.target.checked)} className="h-4 w-4 rounded accent-emerald-600" />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Prescription Required Only</span>
              </label>
            </div>
          </Card>
        </div>

        {/* Product Grid */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by drug name or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 w-full sm:w-auto justify-end">
              <ArrowUpDown className="h-4 w-4" />
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="featured">Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="name">Name A–Z</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4 text-slate-400">
              <Package className="h-12 w-12 text-slate-300" />
              <p className="text-sm font-semibold">No products found matching your criteria.</p>
              <button onClick={() => { setSearch(""); setSelectedCategory("all"); setRxOnly(false); }} className="text-xs text-emerald-600 font-bold hover:underline">
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Card key={product.id} hoverEffect className="flex flex-col justify-between p-5 space-y-4">
                    <div className="space-y-3">
                      <div className="relative h-44 w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-slate-300">
                            <Package className="h-10 w-10" />
                          </div>
                        )}
                        {product.requiresPrescription && (
                          <div className="absolute top-2 left-2"><Badge variant="amber">Rx Required</Badge></div>
                        )}
                        {product.isFeatured && (
                          <div className="absolute top-2 right-2"><Badge variant="emerald">Featured</Badge></div>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 font-mono">{product.sku}</div>

                      <Link href={`/shop/${product.slug}`}>
                        <h3 className="font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-emerald-600 transition-colors text-sm">
                          {product.name}
                        </h3>
                      </Link>

                      {product.brand && <p className="text-xs text-emerald-600 font-semibold">{product.brand.name}</p>}
                      <p className="text-xs text-slate-500 line-clamp-2">{product.description}</p>

                      {product.rating > 0 && (
                        <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                          <Star className="h-3.5 w-3.5 fill-amber-400" />
                          <span>{product.rating.toFixed(1)}</span>
                          <span className="text-slate-400 font-normal">({product.reviewCount})</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-base font-extrabold text-slate-900 dark:text-white">{formatCurrency(product.price)}</span>
                        {product.compareAtPrice && (
                          <span className="ml-1.5 text-xs text-slate-400 line-through">{formatCurrency(product.compareAtPrice)}</span>
                        )}
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => { addToCart(product, 1); toast.success(`${product.name} added to cart!`); }}
                      >
                        <Plus className="h-4 w-4" /> Add
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-xl text-sm font-bold border border-slate-200 disabled:opacity-40 hover:bg-slate-100">
                    Previous
                  </button>
                  <span className="text-sm text-slate-500 font-medium">Page {page} of {totalPages}</span>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 rounded-xl text-sm font-bold border border-slate-200 disabled:opacity-40 hover:bg-slate-100">
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
