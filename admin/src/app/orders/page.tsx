"use client";

import { useState, useEffect } from "react";
import { Search, Eye } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface Order {
  id: string; orderNumber: string; status: string; totalAmount: number; createdAt: string;
  user: { name: string; email: string };
  orderItems: { quantity: number; unitPrice: number; total: number; product: { name: string } }[];
  payments: { status: string; provider: string }[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  PRESCRIPTION_CHECK: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  PROCESSING: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  SHIPPED: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400",
  OUT_FOR_DELIVERY: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400",
  DELIVERED: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  CANCELLED: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  REFUNDED: "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-400",
};
const STATUS_OPTIONS = ["PENDING", "PRESCRIPTION_CHECK", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUNDED"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => { loadOrders(); }, [statusFilter]);

  async function loadOrders() {
    try { const data = await apiFetch<Order[]>("/orders"); setOrders(data); }
    catch { toast.error("Failed to load orders"); }
    finally { setLoading(false); }
  }

  async function updateStatus(orderId: string, status: string) {
    try {
      await apiFetch(`/orders/${orderId}/status`, { method: "PUT", body: JSON.stringify({ status }) });
      toast.success("Status updated"); loadOrders();
    } catch { toast.error("Failed to update status"); }
  }

  const filtered = orders
    .filter((o) => !statusFilter || o.status === statusFilter)
    .filter((o) => !search || o.orderNumber.toLowerCase().includes(search.toLowerCase()) || o.user.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Order Fulfillment</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">{orders.length} total orders</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setStatusFilter("")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${!statusFilter ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"}`}>All</button>
        {STATUS_OPTIONS.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === s ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"}`}>
            {s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input type="text" placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 outline-none text-sm bg-transparent text-slate-700 dark:text-slate-300 placeholder:text-slate-400" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Order</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Total</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Payment</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">Loading...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">No orders</td></tr>
              : filtered.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="px-4 py-3 font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">{order.orderNumber}</td>
                  <td className="px-4 py-3"><p className="text-sm font-medium text-slate-800 dark:text-slate-200">{order.user.name}</p></td>
                  <td className="px-4 py-3 font-semibold text-sm text-slate-800 dark:text-slate-200">GHS {order.totalAmount.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)}
                      className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[order.status] || "bg-slate-100 text-slate-600"}`}>
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {order.payments[0] ? <span className={`text-xs font-semibold ${order.payments[0].status === "COMPLETED" ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>{order.payments[0].status}</span> : <span className="text-xs text-slate-400">No payment</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
