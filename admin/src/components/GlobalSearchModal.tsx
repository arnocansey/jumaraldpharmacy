"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Pill,
  ShoppingCart,
  FileText,
  Users,
  ArrowRight,
  Loader2,
  ExternalLink,
  Clock,
  CheckCircle,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface GlobalSearchResults {
  products: Array<{
    id: string;
    name: string;
    sku: string;
    barcode?: string;
    price: number;
    stockQuantity: number;
    images: string[];
    category?: { name: string };
    manufacturer?: string;
  }>;
  orders: Array<{
    id: string;
    orderNumber: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    user?: { name: string; email: string; phone?: string };
  }>;
  prescriptions: Array<{
    id: string;
    prescriptionNumber: string;
    patientName: string;
    doctorName?: string;
    status: string;
    createdAt: string;
  }>;
  users: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
  }>;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export default function GlobalSearchModal({
  isOpen,
  onClose,
  initialQuery = "",
}: GlobalSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<"all" | "products" | "orders" | "prescriptions" | "users">("all");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GlobalSearchResults>({
    products: [],
    orders: [],
    prescriptions: [],
    users: [],
  });

  const inputRef = useRef<HTMLInputElement | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setTimeout(() => inputRef.current?.focus(), 50);
      if (initialQuery.trim()) {
        performSearch(initialQuery.trim());
      }
    } else {
      setResults({ products: [], orders: [], prescriptions: [], users: [] });
    }
  }, [isOpen, initialQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (!val.trim()) {
      setResults({ products: [], orders: [], prescriptions: [], users: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceTimer.current = setTimeout(() => {
      performSearch(val.trim());
    }, 250);
  };

  const performSearch = async (q: string) => {
    try {
      const data = await apiFetch<GlobalSearchResults>(`/search/global?q=${encodeURIComponent(q)}`);
      setResults(data);
    } catch (err) {
      console.error("[GlobalSearch] error:", err);
    } finally {
      setLoading(false);
    }
  };

  const navigateTo = (path: string) => {
    router.push(path);
    onClose();
  };

  if (!isOpen) return null;

  const totalResultsCount =
    results.products.length + results.orders.length + results.prescriptions.length + results.users.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 sm:pt-16 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-850/50">
          <Search className="h-5 w-5 text-emerald-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder="Search anything (e.g. Paracetamol, ORD-2024, John Doe, Rx-892)..."
            className="flex-1 text-sm sm:text-base bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 font-medium"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-emerald-500 shrink-0" />}
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults({ products: [], orders: [], prescriptions: [], users: [] });
              }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hidden sm:block"
          >
            ESC
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-thin bg-white dark:bg-slate-900 shrink-0">
          {[
            { key: "all", label: `All (${totalResultsCount})` },
            { key: "products", label: `Products (${results.products.length})` },
            { key: "orders", label: `Orders (${results.orders.length})` },
            { key: "prescriptions", label: `Prescriptions (${results.prescriptions.length})` },
            { key: "users", label: `Users (${results.users.length})` },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setActiveFilter(f.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                activeFilter === f.key
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {!query.trim() && (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Search className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold">Type medicine name, SKU, order ID, or customer name</p>
              <p className="text-xs text-slate-400">Quick tip: Press Ctrl + K anywhere to open search</p>
            </div>
          )}

          {query.trim() && !loading && totalResultsCount === 0 && (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <p className="text-sm font-semibold">No matches found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-slate-400">Try searching by generic ingredient, SKU, or manufacturer name</p>
            </div>
          )}

          {/* 1. Products Results */}
          {(activeFilter === "all" || activeFilter === "products") && results.products.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                <span className="flex items-center gap-1.5">
                  <Pill className="h-3.5 w-3.5 text-emerald-500" /> Products ({results.products.length})
                </span>
                <button
                  type="button"
                  onClick={() => navigateTo(`/products?search=${encodeURIComponent(query)}`)}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  View All in Products <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {results.products.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => navigateTo(`/products?search=${encodeURIComponent(p.name)}`)}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 border border-slate-100 dark:border-slate-750 hover:border-emerald-400 dark:hover:border-emerald-600/50 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center shrink-0 overflow-hidden font-bold text-xs">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                        ) : (
                          <Pill className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                          {p.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span className="font-mono">{p.sku}</span>
                          {p.manufacturer && <span className="truncate max-w-[100px]">• {p.manufacturer}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                        GHS {Number(p.price).toFixed(2)}
                      </p>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          p.stockQuantity > 0
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                            : "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300"
                        }`}
                      >
                        {p.stockQuantity > 0 ? `${p.stockQuantity} in stock` : "Out of stock"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Orders Results */}
          {(activeFilter === "all" || activeFilter === "orders") && results.orders.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                <span className="flex items-center gap-1.5">
                  <ShoppingCart className="h-3.5 w-3.5 text-blue-500" /> Orders ({results.orders.length})
                </span>
                <button
                  type="button"
                  onClick={() => navigateTo(`/orders?search=${encodeURIComponent(query)}`)}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  View in Orders <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {results.orders.map((o) => (
                  <div
                    key={o.id}
                    onClick={() => navigateTo(`/orders`)}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 border border-slate-100 dark:border-slate-750 hover:border-blue-400 dark:hover:border-blue-600/50 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
                        <ShoppingCart className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {o.orderNumber}
                        </h4>
                        <p className="text-[10px] text-slate-400 truncate">
                          {o.user?.name || "Guest"} • {new Date(o.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        GHS {Number(o.totalAmount).toFixed(2)}
                      </p>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        {o.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Prescriptions Results */}
          {(activeFilter === "all" || activeFilter === "prescriptions") && results.prescriptions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                <span className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-purple-500" /> Prescriptions ({results.prescriptions.length})
                </span>
                <button
                  type="button"
                  onClick={() => navigateTo(`/prescriptions`)}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  View in Prescriptions <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {results.prescriptions.map((rx) => (
                  <div
                    key={rx.id}
                    onClick={() => navigateTo(`/prescriptions`)}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50/60 dark:hover:bg-purple-950/30 border border-slate-100 dark:border-slate-750 hover:border-purple-400 dark:hover:border-purple-600/50 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                          {rx.patientName}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {rx.prescriptionNumber || "No Rx #"} {rx.doctorName ? `• Dr. ${rx.doctorName}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                        {rx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Users & Staff Results */}
          {(activeFilter === "all" || activeFilter === "users") && results.users.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-amber-500" /> Users &amp; Staff ({results.users.length})
                </span>
                <button
                  type="button"
                  onClick={() => navigateTo(`/users`)}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  View in Users <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {results.users.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => navigateTo(`/users`)}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50/60 dark:hover:bg-amber-950/30 border border-slate-100 dark:border-slate-750 hover:border-amber-400 dark:hover:border-amber-600/50 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center shrink-0 font-bold text-xs">
                        {u.name?.slice(0, 2).toUpperCase() || "US"}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                          {u.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {u.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
