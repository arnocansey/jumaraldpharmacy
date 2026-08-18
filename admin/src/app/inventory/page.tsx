"use client";

import { useState, useEffect } from "react";
import {
  Package, AlertTriangle, Clock, TrendingDown, TrendingUp,
  RefreshCw, Search, History, BarChart3, Plus, CheckCircle,
  XCircle, Hash, X, Filter,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────

interface InventoryReport {
  totalProducts: number;
  totalStockValue: number;
  lowStock: number;
  outOfStock: number;
  expiringSoon: number;
  products: ProductSummary[];
}

interface ProductSummary {
  id: string;
  name: string;
  sku: string;
  stockQuantity: number;
  price: number;
  category?: { name: string };
  expiryDate?: string;
  batchNumber?: string;
}

interface StockAlertItem {
  id: string;
  name: string;
  sku: string;
  stockQuantity: number;
  minStockAlert: number;
  category?: string;
}

interface HistoryEntry {
  id: string;
  productId?: string;
  productName?: string;
  product?: { name: string; id: string };
  type: string;
  quantity?: number;
  previousQuantity?: number;
  newQuantity?: number;
  adjustment?: number;
  reason?: string;
  performedBy?: string;
  createdAt: string;
}

type Tab = "overview" | "adjustments" | "history" | "alerts";

// ── Product Combobox Component ─────────────────────────────────────────────

function ProductCombobox({
  products,
  value,
  onChange,
  placeholder = "Type to search drug or SKU...",
}: {
  products: ProductSummary[];
  value: string;
  onChange: (productId: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedProduct = products.find((p) => p.id === value);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-full">
      {selectedProduct ? (
        <div className="flex items-center justify-between border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-sm">
          <div className="flex items-center gap-2 overflow-hidden">
            <Package className="h-4 w-4 text-emerald-500 shrink-0" />
            <span className="font-semibold truncate">{selectedProduct.name}</span>
            <span className="text-xs text-slate-400 font-mono">({selectedProduct.sku})</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 ${
              selectedProduct.stockQuantity === 0
                ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400"
                : selectedProduct.stockQuantity <= 10
                ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400"
                : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
            }`}>
              Stock: {selectedProduct.stockQuantity}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange("");
              setSearch("");
              setOpen(true);
            }}
            className="p-1 text-slate-400 hover:text-red-500 rounded-lg transition-colors ml-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            placeholder={placeholder}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
          />
          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute left-0 right-0 top-full mt-1.5 max-h-60 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 divide-y divide-slate-100 dark:divide-slate-700">
                {filtered.length === 0 ? (
                  <div className="p-3 text-xs text-slate-400 text-center">No matching products found</div>
                ) : (
                  filtered.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        onChange(p.id);
                        setOpen(false);
                      }}
                      className="w-full text-left p-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex items-center justify-between gap-2"
                    >
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">{p.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          SKU: {p.sku} &middot; GHS {p.price.toFixed(2)}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          p.stockQuantity === 0
                            ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                            : p.stockQuantity <= 10
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                        }`}
                      >
                        {p.stockQuantity} in stock
                      </span>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);

  // Overview data
  const [report, setReport] = useState<InventoryReport | null>(null);
  const [expiring, setExpiring] = useState<ProductSummary[]>([]);
  const [expired, setExpired] = useState<ProductSummary[]>([]);

  // Search & Filter for Overview Table
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");

  // Alerts
  const [alerts, setAlerts] = useState<StockAlertItem[]>([]);

  // History
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);

  // Adjust stock form
  const [adjustForm, setAdjustForm] = useState({ productId: "", adjustment: "", reason: "" });
  const [adjustLoading, setAdjustLoading] = useState(false);

  // Bulk update form
  const [bulkItems, setBulkItems] = useState<{ productId: string; stockQuantity: string }[]>([
    { productId: "", stockQuantity: "" },
  ]);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Cycle count form
  const [cycleItems, setCycleItems] = useState<{ productId: string; countedQuantity: string }[]>([
    { productId: "", countedQuantity: "" },
  ]);
  const [cycleLoading, setCycleLoading] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (tab === "history") loadHistory();
  }, [tab, historyPage]);

  async function loadAll() {
    setLoading(true);
    try {
      const [reportRes, expiringRes, expiredRes, alertRes] = await Promise.allSettled([
        apiFetch<any>("/inventory/report"),
        apiFetch<any>("/inventory/expiring"),
        apiFetch<any>("/inventory/expired"),
        apiFetch<any>("/inventory/alerts"),
      ]);

      if (reportRes.status === "fulfilled" && reportRes.value) {
        const val = reportRes.value;
        const productsList: ProductSummary[] = val.products || (val.inventory ? val.inventory.map((i: any) => ({
          id: i.product?.id || i.id,
          name: i.product?.name || i.name || "Product",
          sku: i.product?.sku || i.sku || "",
          stockQuantity: i.quantity ?? i.stockQuantity ?? 0,
          price: i.product?.price || i.price || 0,
          category: i.product?.category || i.category,
        })) : []);

        setReport({
          totalProducts: val.totalProducts ?? val.summary?.totalProducts ?? productsList.length,
          totalStockValue: val.totalStockValue ?? val.summary?.totalValue ?? 0,
          lowStock: val.lowStock ?? val.summary?.lowStockCount ?? 0,
          outOfStock: val.outOfStock ?? val.summary?.outOfStockCount ?? 0,
          expiringSoon: val.expiringSoon ?? val.summary?.expiringSoon ?? 0,
          products: productsList,
        });
      }

      if (expiringRes.status === "fulfilled") setExpiring(Array.isArray(expiringRes.value) ? expiringRes.value : []);
      if (expiredRes.status === "fulfilled") setExpired(Array.isArray(expiredRes.value) ? expiredRes.value : []);
      if (alertRes.status === "fulfilled") setAlerts(alertRes.value?.alerts || alertRes.value?.lowStock || []);
    } catch {
      toast.error("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    try {
      const data = await apiFetch<any>(`/inventory/history?page=${historyPage}&limit=20`);
      if (data?.data) {
        setHistory(data.data);
        setHistoryTotalPages(data.pagination?.pages || 1);
      } else if (Array.isArray(data)) {
        setHistory(data.map((l: any) => ({
          id: l.id,
          productId: l.entityId,
          productName: l.details ? l.details.split(".")[0] : "System Update",
          type: l.action,
          reason: l.details || "",
          performedBy: l.user?.name || "Administrator",
          createdAt: l.createdAt,
        })));
        setHistoryTotalPages(1);
      }
    } catch {
      toast.error("Failed to load inventory history");
    }
  }

  // ── Adjust Stock ────────────────────────────────────────────────────────

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault();
    if (!adjustForm.productId || !adjustForm.adjustment) {
      toast.error("Select a product and enter adjustment amount");
      return;
    }
    setAdjustLoading(true);
    try {
      await apiFetch("/inventory/adjust", {
        method: "POST",
        body: JSON.stringify({
          productId: adjustForm.productId,
          adjustment: Number(adjustForm.adjustment),
          reason: adjustForm.reason || "Manual inventory adjustment",
        }),
      });
      toast.success("Stock adjusted successfully");
      setAdjustForm({ productId: "", adjustment: "", reason: "" });
      loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to adjust stock");
    } finally {
      setAdjustLoading(false);
    }
  }

  // ── Bulk Update ─────────────────────────────────────────────────────────

  async function handleBulkUpdate(e: React.FormEvent) {
    e.preventDefault();
    const valid = bulkItems.filter((i) => i.productId && i.stockQuantity !== "");
    if (valid.length === 0) {
      toast.error("Add at least one product with a valid stock quantity");
      return;
    }
    setBulkLoading(true);
    try {
      await apiFetch("/inventory/bulk-update", {
        method: "POST",
        body: JSON.stringify({
          updates: valid.map((i) => ({
            productId: i.productId,
            stockQuantity: Number(i.stockQuantity),
          })),
        }),
      });
      toast.success(`${valid.length} product(s) stock updated`);
      setBulkItems([{ productId: "", stockQuantity: "" }]);
      loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to bulk update");
    } finally {
      setBulkLoading(false);
    }
  }

  // ── Cycle Count ─────────────────────────────────────────────────────────

  async function handleCycleCount(e: React.FormEvent) {
    e.preventDefault();
    const valid = cycleItems.filter((i) => i.productId && i.countedQuantity !== "");
    if (valid.length === 0) {
      toast.error("Add at least one product with a counted quantity");
      return;
    }
    setCycleLoading(true);
    try {
      await apiFetch("/inventory/cycle-count", {
        method: "POST",
        body: JSON.stringify({
          items: valid.map((i) => ({
            productId: i.productId,
            countedQuantity: Number(i.countedQuantity),
          })),
        }),
      });
      toast.success(`Cycle count for ${valid.length} item(s) reconciled`);
      setCycleItems([{ productId: "", countedQuantity: "" }]);
      loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit cycle count");
    } finally {
      setCycleLoading(false);
    }
  }

  // Filter products for overview table
  const filteredProducts = (report?.products || []).filter((p) => {
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (stockFilter === "in_stock") return p.stockQuantity > 10;
    if (stockFilter === "low_stock") return p.stockQuantity > 0 && p.stockQuantity <= 10;
    if (stockFilter === "out_of_stock") return p.stockQuantity === 0;
    return true;
  });

  const inputClass =
    "w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500";
  const labelClass = "text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block";

  const tabs: { key: Tab; label: string; icon: typeof Package }[] = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "adjustments", label: "Adjustments & Reconcile", icon: TrendingUp },
    { key: "history", label: "Audit History", icon: History },
    { key: "alerts", label: "Stock Alerts", icon: AlertTriangle },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Inventory & Stock Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {loading ? "Loading inventory..." : `${report?.totalProducts || 0} pharmaceutical products active`}
          </p>
        </div>
        <button
          onClick={loadAll}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors text-sm shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Sync Inventory
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap ${
              tab === t.key
                ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* ━━━ OVERVIEW TAB ━━━ */}
      {tab === "overview" && (
        <div className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-28 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { label: "Total Products", value: report?.totalProducts || 0, icon: Package, color: "bg-blue-100 dark:bg-blue-900/30", textColor: "text-blue-600 dark:text-blue-400" },
                  { label: "Stock Valuation", value: `GHS ${(report?.totalStockValue || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: "bg-emerald-100 dark:bg-emerald-900/30", textColor: "text-emerald-600 dark:text-emerald-400" },
                  { label: "Low Stock Items", value: report?.lowStock || 0, icon: TrendingDown, color: "bg-amber-100 dark:bg-amber-900/30", textColor: "text-amber-600 dark:text-amber-400" },
                  { label: "Out of Stock", value: report?.outOfStock || 0, icon: XCircle, color: "bg-red-100 dark:bg-red-900/30", textColor: "text-red-600 dark:text-red-400" },
                  { label: "Expiring Batches", value: report?.expiringSoon || 0, icon: Clock, color: "bg-purple-100 dark:bg-purple-900/30", textColor: "text-purple-600 dark:text-purple-400" },
                ].map((s) => (
                  <div key={s.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
                    <div className={`p-2.5 rounded-xl ${s.color} inline-block mb-3`}>
                      <s.icon className={`h-5 w-5 ${s.textColor}`} />
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">{s.value}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Products table with Live Search & Filter */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Stock Catalog</h3>
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    {/* Search input */}
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search drug name or SKU..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    {/* Filter dropdown */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Filter className="h-4 w-4 text-slate-400" />
                      <select
                        value={stockFilter}
                        onChange={(e) => setStockFilter(e.target.value as any)}
                        className="px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-200 font-medium"
                      >
                        <option value="all">All Stock Statuses</option>
                        <option value="in_stock">In Stock (&gt;10)</option>
                        <option value="low_stock">Low Stock (1-10)</option>
                        <option value="out_of_stock">Out of Stock (0)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-700/50">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Product Name</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">SKU Code</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Category</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Stock Level</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Unit Price</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Earliest Expiry</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-10 text-center text-slate-400 dark:text-slate-500">
                            No products matching search query.
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                            <td className="px-5 py-3.5">
                              <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{p.name}</p>
                              <p className="text-[11px] text-slate-400 font-mono">ID: {p.id}</p>
                            </td>
                            <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-400 font-mono">{p.sku}</td>
                            <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-400">{p.category?.name || "General"}</td>
                            <td className="px-5 py-3.5">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                p.stockQuantity === 0
                                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                  : p.stockQuantity <= 10
                                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                                  : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                              }`}>
                                {p.stockQuantity === 0 ? <XCircle className="h-3.5 w-3.5" /> : p.stockQuantity <= 10 ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                                {p.stockQuantity} units
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                              GHS {p.price.toFixed(2)}
                            </td>
                            <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                              {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : "—"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Expiring and Expired side-by-side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Expiring Soon */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                      <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100">Expiring Soon (30 Days)</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{expiring.length} batches</p>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {expiring.length === 0 ? (
                      <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">No products expiring soon</p>
                    ) : (
                      expiring.map((p) => (
                        <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/30">
                          <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{p.name}</p>
                            <p className="text-xs text-slate-400 font-mono">{p.sku}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                              {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : "N/A"}
                            </p>
                            <p className="text-xs text-slate-400">{p.stockQuantity} units</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Expired */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100">Expired Batches</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{expired.length} batches</p>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {expired.length === 0 ? (
                      <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">No expired products</p>
                    ) : (
                      expired.map((p) => (
                        <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/30">
                          <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{p.name}</p>
                            <p className="text-xs text-slate-400 font-mono">{p.sku}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                              {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : "N/A"}
                            </p>
                            <p className="text-xs text-slate-400">{p.stockQuantity} units</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ━━━ ADJUSTMENTS TAB ━━━ */}
      {tab === "adjustments" && (
        <div className="space-y-6">
          {/* Quick Single Adjustment */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Stock Adjustment</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Add or deduct inventory count for a specific medication</p>
              </div>
            </div>
            <form onSubmit={handleAdjust} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Search & Select Product *</label>
                  <ProductCombobox
                    products={report?.products || []}
                    value={adjustForm.productId}
                    onChange={(id) => setAdjustForm({ ...adjustForm, productId: id })}
                    placeholder="Type drug name or SKU..."
                  />
                </div>
                <div>
                  <label className={labelClass}>Adjustment Quantity (+/-) *</label>
                  <input
                    type="number"
                    placeholder="e.g. +50 (restock) or -5 (damaged)"
                    value={adjustForm.adjustment}
                    onChange={(e) => setAdjustForm({ ...adjustForm, adjustment: e.target.value })}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Reason for Adjustment</label>
                  <input
                    placeholder="e.g. Fresh shipment received from distributor"
                    value={adjustForm.reason}
                    onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={adjustLoading}
                className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
              >
                {adjustLoading ? "Applying..." : "Apply Adjustment"}
              </button>
            </form>
          </div>

          {/* Bulk Update */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Bulk Stock Override</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Directly set exact stock levels for multiple items</p>
              </div>
            </div>
            <form onSubmit={handleBulkUpdate} className="space-y-4">
              <div className="space-y-3">
                {bulkItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div>
                      {idx === 0 && <label className={labelClass}>Product</label>}
                      <ProductCombobox
                        products={report?.products || []}
                        value={item.productId}
                        onChange={(id) => {
                          const next = [...bulkItems];
                          next[idx].productId = id;
                          setBulkItems(next);
                        }}
                        placeholder="Search product..."
                      />
                    </div>
                    <div>
                      {idx === 0 && <label className={labelClass}>New Stock Count</label>}
                      <input
                        type="number"
                        min="0"
                        placeholder="Set absolute stock quantity"
                        value={item.stockQuantity}
                        onChange={(e) => {
                          const next = [...bulkItems];
                          next[idx].stockQuantity = e.target.value;
                          setBulkItems(next);
                        }}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      {idx === 0 && <label className="text-xs font-semibold text-transparent block mb-1">Actions</label>}
                      <div className="flex gap-2">
                        {bulkItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setBulkItems(bulkItems.filter((_, i) => i !== idx))}
                            className="p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                        {idx === bulkItems.length - 1 && (
                          <button
                            type="button"
                            onClick={() => setBulkItems([...bulkItems, { productId: "", stockQuantity: "" }])}
                            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-slate-600 hover:text-emerald-600 flex items-center gap-1 text-xs font-bold"
                          >
                            <Plus className="h-4 w-4" /> Add Row
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="submit"
                disabled={bulkLoading}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {bulkLoading ? "Updating..." : "Save Bulk Stock"}
              </button>
            </form>
          </div>

          {/* Cycle Count */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <Hash className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Physical Cycle Audit</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Reconcile physical stock room count with database records</p>
              </div>
            </div>
            <form onSubmit={handleCycleCount} className="space-y-4">
              <div className="space-y-3">
                {cycleItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div>
                      {idx === 0 && <label className={labelClass}>Product</label>}
                      <ProductCombobox
                        products={report?.products || []}
                        value={item.productId}
                        onChange={(id) => {
                          const next = [...cycleItems];
                          next[idx].productId = id;
                          setCycleItems(next);
                        }}
                        placeholder="Search product..."
                      />
                    </div>
                    <div>
                      {idx === 0 && <label className={labelClass}>Physically Counted Qty</label>}
                      <input
                        type="number"
                        min="0"
                        placeholder="Counted quantity"
                        value={item.countedQuantity}
                        onChange={(e) => {
                          const next = [...cycleItems];
                          next[idx].countedQuantity = e.target.value;
                          setCycleItems(next);
                        }}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      {idx === 0 && <label className="text-xs font-semibold text-transparent block mb-1">Actions</label>}
                      <div className="flex gap-2">
                        {cycleItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setCycleItems(cycleItems.filter((_, i) => i !== idx))}
                            className="p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                        {idx === cycleItems.length - 1 && (
                          <button
                            type="button"
                            onClick={() => setCycleItems([...cycleItems, { productId: "", countedQuantity: "" }])}
                            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 text-slate-600 hover:text-purple-600 flex items-center gap-1 text-xs font-bold"
                          >
                            <Plus className="h-4 w-4" /> Add Row
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="submit"
                disabled={cycleLoading}
                className="bg-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                {cycleLoading ? "Reconciling..." : "Submit Reconciliation Audit"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ━━━ HISTORY TAB ━━━ */}
      {tab === "history" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Inventory Audit Log</h3>
            <span className="text-xs text-slate-400">Tracks all manual restocks, bulk updates, & cycle counts</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Date & Time</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Action Type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Details & Reason</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Performed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-slate-400 dark:text-slate-500">No inventory audit history logged yet.</td>
                  </tr>
                ) : (
                  history.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-5 py-3.5 text-xs text-slate-500 font-mono">
                        {new Date(h.createdAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          h.type === "INVENTORY_ADJUSTED" || h.type === "BULK_STOCK_UPDATE"
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                            : h.type === "CYCLE_COUNT"
                            ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                        }`}>
                          {h.type?.replace(/_/g, " ") || "AUDIT"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                        {h.reason || "Inventory record updated"}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {h.performedBy || "System Admin"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {historyTotalPages > 1 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Page {historyPage} of {historyTotalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setHistoryPage(Math.max(1, historyPage - 1))}
                  disabled={historyPage === 1}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-300"
                >
                  Previous
                </button>
                <button
                  onClick={() => setHistoryPage(Math.min(historyTotalPages, historyPage + 1))}
                  disabled={historyPage === historyTotalPages}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-300"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ━━━ ALERTS TAB ━━━ */}
      {tab === "alerts" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Stock Reorder Alerts</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{alerts.length} medications require stock replenishment</p>
              </div>
            </div>

            {alerts.length === 0 ? (
              <div className="text-center py-10">
                <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">All pharmaceutical stock levels optimal</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-700/50">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Product</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">SKU</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Category</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Current Level</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Reorder Threshold</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Alert Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {alerts.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{a.name}</p>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-400 font-mono">{a.sku}</td>
                        <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-400">{a.category || "General"}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-sm font-extrabold ${a.stockQuantity === 0 ? "text-red-600" : "text-amber-600"}`}>
                            {a.stockQuantity} units
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-500">{a.minStockAlert || 10} units</td>
                        <td className="px-5 py-3.5">
                          {a.stockQuantity === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                              <XCircle className="h-3.5 w-3.5" /> Out of Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                              <AlertTriangle className="h-3.5 w-3.5" /> Low Stock
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
