"use client";

import { useState, useEffect } from "react";
import {
  Package, AlertTriangle, Clock, TrendingDown, TrendingUp,
  RefreshCw, Search, History, BarChart3, Plus, Minus, CheckCircle,
  XCircle, AlertCircle, Hash, X,
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

// ── Page ───────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);

  // Overview data
  const [report, setReport] = useState<InventoryReport | null>(null);
  const [expiring, setExpiring] = useState<ProductSummary[]>([]);
  const [expired, setExpired] = useState<ProductSummary[]>([]);

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
      const [reportData, expiringData, expiredData, alertData] = await Promise.allSettled([
        apiFetch<InventoryReport>("/inventory/report"),
        apiFetch<ProductSummary[]>("/inventory/expiring"),
        apiFetch<ProductSummary[]>("/inventory/expired"),
        apiFetch<{ alerts: StockAlertItem[] }>("/inventory/alerts"),
      ]);

      if (reportData.status === "fulfilled") setReport(reportData.value);
      if (expiringData.status === "fulfilled") setExpiring(Array.isArray(expiringData.value) ? expiringData.value : []);
      if (expiredData.status === "fulfilled") setExpired(Array.isArray(expiredData.value) ? expiredData.value : []);
      if (alertData.status === "fulfilled") setAlerts(alertData.value?.alerts || []);
    } catch {
      toast.error("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    try {
      const data = await apiFetch<{ data: HistoryEntry[]; pagination: { page: number; pages: number } }>(
        `/inventory/history?page=${historyPage}&limit=20`
      );
      setHistory(data.data || []);
      setHistoryTotalPages(data.pagination?.pages || 1);
    } catch {
      toast.error("Failed to load history");
    }
  }

  // ── Adjust Stock ────────────────────────────────────────────────────────

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault();
    if (!adjustForm.productId || !adjustForm.adjustment) {
      toast.error("Product ID and adjustment amount are required");
      return;
    }
    setAdjustLoading(true);
    try {
      await apiFetch("/inventory/adjust", {
        method: "POST",
        body: JSON.stringify({
          productId: adjustForm.productId,
          adjustment: Number(adjustForm.adjustment),
          reason: adjustForm.reason,
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
    const valid = bulkItems.filter((i) => i.productId && i.stockQuantity);
    if (valid.length === 0) {
      toast.error("Add at least one product with a stock quantity");
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
      toast.success(`${valid.length} product(s) updated`);
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
    const valid = cycleItems.filter((i) => i.productId && i.countedQuantity);
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
      toast.success(`Cycle count for ${valid.length} item(s) submitted`);
      setCycleItems([{ productId: "", countedQuantity: "" }]);
      loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit cycle count");
    } finally {
      setCycleLoading(false);
    }
  }

  // ── Input classes ───────────────────────────────────────────────────────

  const inputClass =
    "w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500";
  const labelClass = "text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block";

  // ── Tab definition ──────────────────────────────────────────────────────

  const tabs: { key: Tab; label: string; icon: typeof Package }[] = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "adjustments", label: "Adjustments", icon: TrendingUp },
    { key: "history", label: "History", icon: History },
    { key: "alerts", label: "Alerts", icon: AlertTriangle },
  ];

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Inventory Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {loading ? "Loading..." : `${report?.totalProducts || 0} products tracked`}
          </p>
        </div>
        <button
          onClick={loadAll}
          className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 mb-6 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { label: "Total Products", value: report?.totalProducts || 0, icon: Package, color: "bg-blue-100 dark:bg-blue-900/30", textColor: "text-blue-600 dark:text-blue-400" },
                  { label: "Stock Value", value: `GHS ${(report?.totalStockValue || 0).toLocaleString()}`, icon: TrendingUp, color: "bg-emerald-100 dark:bg-emerald-900/30", textColor: "text-emerald-600 dark:text-emerald-400" },
                  { label: "Low Stock", value: report?.lowStock || 0, icon: TrendingDown, color: "bg-amber-100 dark:bg-amber-900/30", textColor: "text-amber-600 dark:text-amber-400" },
                  { label: "Out of Stock", value: report?.outOfStock || 0, icon: XCircle, color: "bg-red-100 dark:bg-red-900/30", textColor: "text-red-600 dark:text-red-400" },
                  { label: "Expiring Soon", value: report?.expiringSoon || 0, icon: Clock, color: "bg-purple-100 dark:bg-purple-900/30", textColor: "text-purple-600 dark:text-purple-400" },
                ].map((s) => (
                  <div key={s.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
                    <div className={`p-3 rounded-xl ${s.color} inline-block mb-2`}>
                      <s.icon className={`h-5 w-5 ${s.textColor}`} />
                    </div>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{s.value}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Products table from report */}
              {report?.products && report.products.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">All Products</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-700/50">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Product</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">SKU</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Category</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Stock</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Price</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Expiry</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {report.products.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{p.name}</p>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 font-mono">{p.sku}</td>
                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{p.category?.name || "—"}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                                p.stockQuantity === 0
                                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                  : p.stockQuantity <= 10
                                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                                  : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                              }`}>
                                {p.stockQuantity === 0 ? <XCircle className="h-3 w-3" /> : p.stockQuantity <= 10 ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                                {p.stockQuantity}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200">GHS {p.price.toFixed(2)}</td>
                            <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                              {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Expiring and Expired side-by-side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Expiring Soon */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                      <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100">Expiring Soon</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{expiring.length} products</p>
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
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">{p.sku}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                              {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : "N/A"}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">{p.stockQuantity} in stock</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Expired */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100">Expired Products</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{expired.length} products</p>
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
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">{p.sku}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                              {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : "N/A"}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">{p.stockQuantity} in stock</p>
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
          {/* Adjust Stock */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Adjust Stock</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Add or remove stock for a single product</p>
              </div>
            </div>
            <form onSubmit={handleAdjust} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Product ID *</label>
                  <input
                    placeholder="e.g. prod_abc123"
                    value={adjustForm.productId}
                    onChange={(e) => setAdjustForm({ ...adjustForm, productId: e.target.value })}
                    className={`${inputClass} font-mono`}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Adjustment (+/-) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 50 or -10"
                    value={adjustForm.adjustment}
                    onChange={(e) => setAdjustForm({ ...adjustForm, adjustment: e.target.value })}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Reason</label>
                  <input
                    placeholder="e.g. New shipment received"
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
                {adjustLoading ? "Processing..." : "Apply Adjustment"}
              </button>
            </form>
          </div>

          {/* Bulk Update */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Bulk Update</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Set exact stock quantities for multiple products</p>
              </div>
            </div>
            <form onSubmit={handleBulkUpdate} className="space-y-4">
              <div className="space-y-3">
                {bulkItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div>
                      {idx === 0 && <label className={labelClass}>Product ID</label>}
                      <input
                        placeholder="Product ID"
                        value={item.productId}
                        onChange={(e) => {
                          const next = [...bulkItems];
                          next[idx].productId = e.target.value;
                          setBulkItems(next);
                        }}
                        className={`${inputClass} font-mono`}
                      />
                    </div>
                    <div>
                      {idx === 0 && <label className={labelClass}>New Stock Quantity</label>}
                      <input
                        type="number"
                        min="0"
                        placeholder="Quantity"
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
                            className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                        {idx === bulkItems.length - 1 && (
                          <button
                            type="button"
                            onClick={() => setBulkItems([...bulkItems, { productId: "", stockQuantity: "" }])}
                            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                          >
                            <Plus className="h-4 w-4" />
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
                className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
              >
                {bulkLoading ? "Processing..." : "Update All"}
              </button>
            </form>
          </div>

          {/* Cycle Count */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <Hash className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Cycle Count</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Reconcile physical counts with system stock</p>
              </div>
            </div>
            <form onSubmit={handleCycleCount} className="space-y-4">
              <div className="space-y-3">
                {cycleItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div>
                      {idx === 0 && <label className={labelClass}>Product ID</label>}
                      <input
                        placeholder="Product ID"
                        value={item.productId}
                        onChange={(e) => {
                          const next = [...cycleItems];
                          next[idx].productId = e.target.value;
                          setCycleItems(next);
                        }}
                        className={`${inputClass} font-mono`}
                      />
                    </div>
                    <div>
                      {idx === 0 && <label className={labelClass}>Counted Quantity</label>}
                      <input
                        type="number"
                        min="0"
                        placeholder="Counted qty"
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
                            className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                        {idx === cycleItems.length - 1 && (
                          <button
                            type="button"
                            onClick={() => setCycleItems([...cycleItems, { productId: "", countedQuantity: "" }])}
                            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                          >
                            <Plus className="h-4 w-4" />
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
                className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
              >
                {cycleLoading ? "Processing..." : "Submit Cycle Count"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ━━━ HISTORY TAB ━━━ */}
      {tab === "history" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Inventory History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Product</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Qty Change</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Previous</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">New</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Reason</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">Loading...</td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">No history records</td>
                  </tr>
                ) : (
                  history.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                        {new Date(h.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-200">
                        {h.product?.name || h.productName || h.productId || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          h.type === "ADJUSTMENT" || h.type === "BULK_UPDATE"
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                            : h.type === "CYCLE_COUNT"
                            ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                        }`}>
                          {h.type?.replace(/_/g, " ") || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-semibold ${
                          (h.adjustment || 0) > 0 ? "text-green-600 dark:text-green-400" : (h.adjustment || 0) < 0 ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"
                        }`}>
                          {(h.adjustment || 0) > 0 ? "+" : ""}{h.adjustment ?? h.quantity ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                        {h.previousQuantity ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {h.newQuantity ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                        {h.reason || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                        {h.performedBy || "System"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {historyTotalPages > 1 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Page {historyPage} of {historyTotalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setHistoryPage(Math.max(1, historyPage - 1))}
                  disabled={historyPage === 1}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 text-slate-700 dark:text-slate-300"
                >
                  Previous
                </button>
                <button
                  onClick={() => setHistoryPage(Math.min(historyTotalPages, historyPage + 1))}
                  disabled={historyPage === historyTotalPages}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 text-slate-700 dark:text-slate-300"
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Stock Alerts</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{alerts.length} products need attention</p>
              </div>
            </div>

            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
                <p className="text-sm text-slate-500 dark:text-slate-400">All products are well stocked</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-700/50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Product</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">SKU</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Category</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Current Stock</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Min Alert</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {alerts.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{a.name}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 font-mono">{a.sku}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{a.category || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-bold ${
                            a.stockQuantity === 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-amber-600 dark:text-amber-400"
                          }`}>
                            {a.stockQuantity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{a.minStockAlert}</td>
                        <td className="px-4 py-3">
                          {a.stockQuantity === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                              <XCircle className="h-3 w-3" /> Out of Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                              <AlertCircle className="h-3 w-3" /> Low Stock
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
