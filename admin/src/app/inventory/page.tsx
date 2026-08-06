"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Package, Clock, TrendingDown, Search, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface StockAlert {
  outOfStock: { id: string; name: string; sku: string; stockQuantity: number; images: string[] }[];
  lowStock: { id: string; name: string; sku: string; stockQuantity: number; minStockAlert: number; images: string[] }[];
  expiringIn30: { id: string; quantity: number; expiryDate: string; batchNumber: string; product: { name: string; sku: string } }[];
}

export default function InventoryPage() {
  const [alerts, setAlerts] = useState<StockAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [adjustForm, setAdjustForm] = useState({ productId: "", adjustment: 0, reason: "" });

  useEffect(() => { loadAlerts(); }, []);

  async function loadAlerts() {
    try {
      const data = await apiFetch<StockAlert>("/inventory/alerts");
      setAlerts(data);
    } catch { toast.error("Failed to load inventory alerts"); }
    finally { setLoading(false); }
  }

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault();
    if (!adjustForm.productId || !adjustForm.reason) { toast.error("Fill all fields"); return; }
    try {
      await apiFetch("/inventory/adjust", { method: "POST", body: JSON.stringify(adjustForm) });
      toast.success("Inventory adjusted");
      setAdjustForm({ productId: "", adjustment: 0, reason: "" });
      loadAlerts();
    } catch { toast.error("Failed to adjust inventory"); }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventory Dashboard</h1>
          <p className="text-slate-500 text-sm">Monitor stock levels, expiry dates, and alerts</p>
        </div>
        <button onClick={loadAlerts} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-semibold hover:bg-slate-200 flex items-center gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-xl bg-red-100"><Package className="h-5 w-5 text-red-600" /></div>
            <div><p className="text-2xl font-bold text-slate-800">{alerts?.outOfStock.length || 0}</p><p className="text-sm text-slate-500">Out of Stock</p></div>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {alerts?.outOfStock.map((p) => (
              <div key={p.id} className="flex items-center gap-2 text-xs text-red-600"><AlertTriangle className="h-3 w-3" />{p.name}</div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-xl bg-amber-100"><TrendingDown className="h-5 w-5 text-amber-600" /></div>
            <div><p className="text-2xl font-bold text-slate-800">{alerts?.lowStock.length || 0}</p><p className="text-sm text-slate-500">Low Stock</p></div>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {alerts?.lowStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-xs"><span className="text-slate-600">{p.name}</span><span className="font-semibold text-amber-600">{p.stockQuantity} left</span></div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-xl bg-purple-100"><Clock className="h-5 w-5 text-purple-600" /></div>
            <div><p className="text-2xl font-bold text-slate-800">{alerts?.expiringIn30.length || 0}</p><p className="text-sm text-slate-500">Expiring in 30 Days</p></div>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {alerts?.expiringIn30.map((b) => (
              <div key={b.id} className="flex items-center justify-between text-xs">
                <span className="text-slate-600">{b.product.name}</span>
                <span className="font-semibold text-purple-600">Exp: {new Date(b.expiryDate).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="font-bold text-slate-800 mb-4">Quick Inventory Adjustment</h3>
        <form onSubmit={handleAdjust} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input placeholder="Product ID" value={adjustForm.productId} onChange={(e) => setAdjustForm({ ...adjustForm, productId: e.target.value })}
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
          <input type="number" placeholder="Adjustment (+/-)" value={adjustForm.adjustment || ""} onChange={(e) => setAdjustForm({ ...adjustForm, adjustment: Number(e.target.value) })}
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
          <input placeholder="Reason" value={adjustForm.reason} onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
          <button type="submit" className="bg-emerald-600 text-white py-2.5 rounded-xl font-semibold hover:bg-emerald-700">Adjust</button>
        </form>
      </div>
    </div>
  );
}
