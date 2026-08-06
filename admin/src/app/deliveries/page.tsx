"use client";

import { useState, useEffect } from "react";
import { Search, Package, Truck, CheckCircle, Clock, XCircle, User } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface DeliveryStats { total: number; active: number; completed: number; failed: number; recentDeliveries: any[]; }
const STATUS_COLORS: Record<string, string> = {
  PREPARING: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  PACKED: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  ASSIGNED: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  PICKED_UP: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400",
  IN_TRANSIT: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400",
  NEARBY: "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400",
  DELIVERED: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  FAILED: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  CANCELLED: "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-400",
};

export default function DeliveriesPage() {
  const [stats, setStats] = useState<DeliveryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { apiFetch<DeliveryStats>("/deliveries/stats").then(setStats).catch(() => toast.error("Failed to load")).finally(() => setLoading(false)); }, []);

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Delivery Management</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Track and manage all deliveries</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total", value: stats?.total || 0, icon: Package, color: "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300" },
          { label: "Active", value: stats?.active || 0, icon: Truck, color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" },
          { label: "Completed", value: stats?.completed || 0, icon: CheckCircle, color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" },
          { label: "Failed", value: stats?.failed || 0, icon: XCircle, color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-5 ${s.color}`}>
            <s.icon className="h-6 w-6 mb-2 opacity-75" />
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm opacity-75">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Recent Deliveries</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Tracking</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Order</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Driver</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Branch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">Loading...</td></tr>
              ) : !stats?.recentDeliveries.length ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">No deliveries yet</td></tr>
              ) : (
                stats.recentDeliveries.map((d: any) => (
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 font-mono text-sm text-slate-800 dark:text-slate-200">{d.trackingNumber}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{d.order?.orderNumber}</td>
                    <td className="px-4 py-3 text-sm flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <User className="h-4 w-4 text-slate-400" />{d.driver?.name || <span className="text-slate-400">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[d.status] || "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"}`}>{d.status.replace(/_/g, " ")}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{d.branch?.name || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
