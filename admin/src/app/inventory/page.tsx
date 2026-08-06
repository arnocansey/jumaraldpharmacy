"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Package, Clock, TrendingDown, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface StockAlert { outOfStock: any[]; lowStock: any[]; expiringIn30: any[]; }

export default function InventoryPage() {
  const [alerts, setAlerts] = useState<StockAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [adjustForm, setAdjustForm] = useState({ productId: "", adjustment: 0, reason: "" });

  useEffect(() => { loadAlerts(); }, []);

  async function loadAlerts() {
    try { const data = await apiFetch<StockAlert>("/inventory/alerts"); setAlerts(data); }
    catch { toast.error("Failed to load alerts"); }
    finally { setLoading(false); }
  }

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault();
    try { await apiFetch("/inventory/adjust", { method: "POST", body: JSON.stringify(adjustForm) }); toast.success("Inventory adjusted"); setAdjustForm({ productId: "", adjustment: 0, reason: "" }); loadAlerts(); }
    catch { toast.error("Failed to adjust"); }
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Inventory Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Monitor stock levels and alerts</p>
        </div>
        <button onClick={loadAlerts} className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Refresh</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30"><Package className="h-5 w-5 text-red-600 dark:text-red-400" /></div>
            <div><p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{alerts?.outOfStock.length || 0}</p><p className="text-sm text-slate-500 dark:text-slate-400">Out of Stock</p></div>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">{alerts?.outOfStock.map((p) => <div key={p.id} className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400"><AlertTriangle className="h-3 w-3" />{p.name}</div>)}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30"><TrendingDown className="h-5 w-5 text-amber-600 dark:text-amber-400" /></div>
            <div><p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{alerts?.lowStock.length || 0}</p><p className="text-sm text-slate-500 dark:text-slate-400">Low Stock</p></div>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">{alerts?.lowStock.map((p) => <div key={p.id} className="flex items-center justify-between text-xs"><span className="text-slate-600 dark:text-slate-400">{p.name}</span><span className="font-semibold text-amber-600 dark:text-amber-400">{p.stockQuantity} left</span></div>)}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30"><Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" /></div>
            <div><p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{alerts?.expiringIn30.length || 0}</p><p className="text-sm text-slate-500 dark:text-slate-400">Expiring in 30 Days</p></div>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">{alerts?.expiringIn30.map((b) => <div key={b.id} className="flex items-center justify-between text-xs"><span className="text-slate-600 dark:text-slate-400">{b.product.name}</span><span className="font-semibold text-purple-600 dark:text-purple-400">{new Date(b.expiryDate).toLocaleDateString()}</span></div>)}</div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Quick Inventory Adjustment</h3>
        <form onSubmit={handleAdjust} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input placeholder="Product ID" value={adjustForm.productId} onChange={(e) => setAdjustForm({ ...adjustForm, productId: e.target.value })} className="border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200" />
          <input type="number" placeholder="Adjustment (+/-)" value={adjustForm.adjustment || ""} onChange={(e) => setAdjustForm({ ...adjustForm, adjustment: Number(e.target.value) })} className="border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200" />
          <input placeholder="Reason" value={adjustForm.reason} onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })} className="border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200" />
          <button type="submit" className="bg-emerald-600 text-white py-2.5 rounded-xl font-semibold hover:bg-emerald-700">Adjust</button>
        </form>
      </div>
    </div>
  );
}
