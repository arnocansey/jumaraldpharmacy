"use client";

import { useState, useEffect } from "react";
import { Search, Package, Truck, CheckCircle, XCircle, Clock, Eye, ChevronDown } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  shippingFee: number;
  taxAmount: number;
  createdAt: string;
  user: { name: string; email: string };
  orderItems: { quantity: number; unitPrice: number; total: number; product: { name: string } }[];
  shippingAddress?: { fullAddress: string; city: string; state: string };
  payments: { status: string; provider: string }[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PRESCRIPTION_CHECK: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-purple-100 text-purple-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  OUT_FOR_DELIVERY: "bg-cyan-100 text-cyan-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-slate-100 text-slate-700",
};

const STATUS_OPTIONS = ["", "PENDING", "PRESCRIPTION_CHECK", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUNDED"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => { loadOrders(); }, [statusFilter]);

  async function loadOrders() {
    try {
      const data = await apiFetch<Order[]>("/orders");
      setOrders(data);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(orderId: string, status: string) {
    try {
      await apiFetch(`/orders/${orderId}/status`, { method: "PUT", body: JSON.stringify({ status }) });
      toast.success("Order status updated");
      loadOrders();
      if (selectedOrder?.id === orderId) setSelectedOrder({ ...selectedOrder!, status });
    } catch {
      toast.error("Failed to update status");
    }
  }

  const filtered = orders
    .filter((o) => !statusFilter || o.status === statusFilter)
    .filter((o) => !search || o.orderNumber.toLowerCase().includes(search.toLowerCase()) || o.user.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Order Fulfillment</h1>
        <p className="text-slate-500 text-sm">{orders.length} total orders</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_OPTIONS.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === s ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {s ? s.replace(/_/g, " ") : "All"}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input type="text" placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="flex-1 outline-none text-sm" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Order</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Items</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Total</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Payment</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">Loading orders...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">No orders found</td></tr>
              ) : (
                filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-slate-800">{order.orderNumber}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-800">{order.user.name}</p>
                      <p className="text-xs text-slate-400">{order.user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{order.orderItems.length} items</td>
                    <td className="px-4 py-3 font-semibold text-sm text-slate-800">GHS {order.totalAmount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)}
                        className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[order.status] || "bg-slate-100 text-slate-600"}`}>
                        {STATUS_OPTIONS.filter(Boolean).map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {order.payments[0] ? (
                        <span className={`text-xs font-semibold ${order.payments[0].status === "COMPLETED" ? "text-green-600" : order.payments[0].status === "FAILED" ? "text-red-500" : "text-amber-600"}`}>
                          {order.payments[0].status} ({order.payments[0].provider})
                        </span>
                      ) : <span className="text-xs text-slate-400">No payment</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setSelectedOrder(order)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-emerald-600">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end" onClick={() => setSelectedOrder(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white h-full w-full max-w-md p-6 overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{selectedOrder.orderNumber}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
              <div><p className="text-xs text-slate-500">Customer</p><p className="font-semibold">{selectedOrder.user.name}</p><p className="text-sm text-slate-500">{selectedOrder.user.email}</p></div>
              {selectedOrder.shippingAddress && <div><p className="text-xs text-slate-500">Shipping Address</p><p className="text-sm">{selectedOrder.shippingAddress.fullAddress}, {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}</p></div>}
              <div><p className="text-xs text-slate-500 mb-2">Items</p>
                {selectedOrder.orderItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-t border-slate-100">
                    <span className="text-sm">{item.product.name} x{item.quantity}</span>
                    <span className="text-sm font-semibold">GHS {item.total.toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-2 border-t border-slate-200 mt-2">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="font-bold text-emerald-600">GHS {selectedOrder.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
