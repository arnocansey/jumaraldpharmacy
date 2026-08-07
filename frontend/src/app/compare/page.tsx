"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { GitCompare, X, ShoppingCart, Star, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  rating: number;
  reviewCount: number;
  stockQuantity: number;
  dosageForm?: string;
  strength?: string;
  activeIngredients?: string;
  images: string[];
  category: { name: string };
  brand?: { name: string };
}

export default function ComparePage() {
  const [items, setItems] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);

  async function searchProducts(q: string) {
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const data = await apiFetch<{ products: Product[] }>(`/products?search=${encodeURIComponent(q)}&limit=5`);
      setSearchResults(data.products.filter((p) => !items.find((i) => i.id === p.id)));
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  function addProduct(product: Product) {
    if (items.length >= 4) { toast.error("Maximum 4 products to compare"); return; }
    setItems([...items, product]);
    setSearchQuery("");
    setSearchResults([]);
  }

  function removeProduct(id: string) {
    setItems(items.filter((i) => i.id !== id));
  }

  const specs = [
    { key: "price", label: "Price", render: (p: Product) => `GHS ${p.price.toFixed(2)}` },
    { key: "rating", label: "Rating", render: (p: Product) => (
      <div className="flex items-center gap-1"><Star className="h-4 w-4 text-yellow-400 fill-yellow-400" /><span>{p.rating.toFixed(1)} ({p.reviewCount})</span></div>
    )},
    { key: "stock", label: "Stock", render: (p: Product) => (
      <span className={`font-semibold ${p.stockQuantity > 0 ? "text-green-600" : "text-red-500"}`}>
        {p.stockQuantity > 0 ? `${p.stockQuantity} in stock` : "Out of stock"}
      </span>
    )},
    { key: "category", label: "Category", render: (p: Product) => p.category?.name || "-" },
    { key: "brand", label: "Brand", render: (p: Product) => p.brand?.name || "-" },
    { key: "dosageForm", label: "Dosage Form", render: (p: Product) => p.dosageForm || "-" },
    { key: "strength", label: "Strength", render: (p: Product) => p.strength || "-" },
    { key: "activeIngredients", label: "Active Ingredients", render: (p: Product) => p.activeIngredients || "-" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="bg-emerald-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <GitCompare className="h-10 w-10 mx-auto mb-3 text-emerald-300" />
          <h1 className="text-3xl font-bold mb-2">Compare Products</h1>
          <p className="text-emerald-200">Add up to 4 products to compare side by side</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-8">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search products to compare..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); searchProducts(e.target.value); }}
              className="flex-1 outline-none text-slate-700 placeholder:text-slate-400"
            />
            {searching && <div className="animate-spin h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full" />}
          </div>
          {searchResults.length > 0 && (
            <div className="mt-3 border-t border-slate-100 pt-3 space-y-2">
              {searchResults.map((p) => (
                <button key={p.id} onClick={() => addProduct(p)}
                  className="w-full text-left p-3 hover:bg-emerald-50 rounded-xl flex items-center gap-3 transition-colors">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                    {p.images[0] ? <Image src={p.images[0]} alt="" width={40} height={40} quality={80} placeholder="blur" blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No img</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{p.name}</p>
                    <p className="text-sm text-slate-500">GHS {p.price.toFixed(2)}</p>
                  </div>
                  <span className="text-emerald-600 text-sm font-semibold">+ Add</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <GitCompare className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600">No products to compare</h3>
            <p className="text-slate-400 mt-2">Search and add products above to start comparing</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-4 w-48"></th>
                  {items.map((p) => (
                    <th key={p.id} className="p-4 text-center">
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative">
                        <button onClick={() => removeProduct(p.id)} className="absolute -top-1 -right-1 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200">
                          <X className="h-3 w-3" />
                        </button>
                        <div className="w-24 h-24 bg-slate-100 rounded-xl mx-auto mb-3 overflow-hidden">
                          {p.images[0] ? <Image src={p.images[0]} alt="" width={96} height={96} quality={80} placeholder="blur" blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No image</div>}
                        </div>
                        <p className="font-bold text-slate-800 text-sm">{p.name}</p>
                      </motion.div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {specs.map((spec, i) => (
                  <tr key={spec.key} className={i % 2 === 0 ? "bg-slate-50" : ""}>
                    <td className="p-4 font-semibold text-slate-600 text-sm">{spec.label}</td>
                    {items.map((p) => (
                      <td key={p.id} className="p-4 text-center text-sm text-slate-700">{spec.render(p)}</td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="p-4"></td>
                  {items.map((p) => (
                    <td key={p.id} className="p-4 text-center">
                      <button className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors inline-flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" /> Add to Cart
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
