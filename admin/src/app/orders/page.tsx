"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Truck, RefreshCw, Loader2, Package, Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { API_URL } from "@/lib/api";

function getToken() {
  try { return localStorage.getItem("jumarald_admin_token") || localStorage.getItem("jumarald_token") || ""; }
  catch { return ""; }
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-600",
  PRESCRIPTION_CHECK: "bg-purple-50 text-purple-700 border border-purple-200",
  PROCESSING: "bg-blue-50 text-blue-700 border border-blue-200",
  DISPATCHED: "bg-amber-50 text-amber-700 border border-amber-200",
  SHIPPED: "bg-cyan-50 text-cyan-700 border border-cyan-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 border border-red-200",
  REFUNDED: "bg-slate-100 text-slate-500",
};

const ALL_STATUSES = ["PENDING", "PRESCRIPTION_CHECK", "PROCESSING", "DISPATCHED", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  shippingFee: number;
  createdAt: string;
  user?: { name: string; email: string };
  shippingAddress?: { fullAddress: string; city: string };
  orderItems?: { id: string }[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/orders/all`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Unauthorized or error fetching orders");
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`${API_URL}/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
      toast.success(`Order status updated to ${newStatus}`);
    } catch (e: any) {
      toast.error(e.message || "Status update failed");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = orders.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.user?.name.toLowerCase().includes(q) ||
      o.user?.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Order Fulfillment Workflow</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track and update dispatch statuses for all pharmacy deliveries.</p>
        </div>
        <button onClick={fetchOrders} className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors" title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search order number or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
            <span className="text-sm font-medium">Loading orders from database...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3 text-slate-400">
            <Package className="h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium">{search ? "No orders match your search." : "No orders in the database yet."}</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="p-4">Order / Customer</th>
                <th className="p-4">Delivery Address</th>
                <th className="p-4">Items</th>
                <th className="p-4">Total</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4">
                    <div className="font-extrabold text-slate-900 text-sm">{order.orderNumber}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{order.user?.name || "—"}</div>
                    <div className="text-[11px] text-slate-400">{order.user?.email || ""}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString("en-GH", { day: "2-digit", month: "short", year: "numeric" })}</div>
                  </td>
                  <td className="p-4 text-xs text-slate-600">
                    {order.shippingAddress ? `${order.shippingAddress.fullAddress}, ${order.shippingAddress.city}` : "—"}
                  </td>
                  <td className="p-4 text-xs font-semibold text-slate-700">{order.orderItems?.length ?? 0} item{(order.orderItems?.length ?? 0) !== 1 ? "s" : ""}</td>
                  <td className="p-4 font-extrabold text-slate-900 text-sm">{formatCurrency(order.totalAmount)}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[order.status] || "bg-slate-100 text-slate-500"}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {updatingId === order.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-600 inline" />
                    ) : (
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className="h-8 px-2 rounded-lg bg-slate-50 text-xs font-medium border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        {ALL_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
