"use client";

import { useState, useEffect } from "react";
import { Truck, Package, CheckCircle, Clock, XCircle, MapPin, User } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface DeliveryStats {
  total: number;
  active: number;
  completed: number;
  failed: number;
  recentDeliveries: any[];
}

const STATUS_COLORS: Record<string, string> = {
  PREPARING: "bg-amber-100 text-amber-700",
  PACKED: "bg-blue-100 text-blue-700",
  ASSIGNED: "bg-purple-100 text-purple-700",
  PICKED_UP: "bg-indigo-100 text-indigo-700",
  IN_TRANSIT: "bg-cyan-100 text-cyan-700",
  NEARBY: "bg-teal-100 text-teal-700",
  DELIVERED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-700",
};

export default function DeliveriesPage() {
  const [stats, setStats] = useState<DeliveryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<DeliveryStats>("/deliveries/stats")
      .then(setStats)
      .catch(() => toast.error("Failed to load delivery stats"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Delivery Management</h1>
        <p className="text-slate-500 text-sm">Track and manage all deliveries</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total", value: stats?.total || 0, icon: Package, color: "bg-slate-100 text-slate-700" },
          { label: "Active", value: stats?.active || 0, icon: Truck, color: "bg-blue-100 text-blue-700" },
          { label: "Completed", value: stats?.completed || 0, icon: CheckCircle, color: "bg-green-100 text-green-700" },
          { label: "Failed", value: stats?.failed || 0, icon: XCircle, color: "bg-red-100 text-red-700" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-5 ${s.color}`}>
            <s.icon className="h-6 w-6 mb-2 opacity-75" />
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm opacity-75">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Recent Deliveries</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Tracking</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Order</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Driver</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Branch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">Loading...</td></tr>
              ) : !stats?.recentDeliveries.length ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">No deliveries yet</td></tr>
              ) : (
                stats.recentDeliveries.map((d: any) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-sm text-slate-800">{d.trackingNumber}</td>
                    <td className="px-4 py-3 text-sm">{d.order?.orderNumber}</td>
                    <td className="px-4 py-3 text-sm flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400" />
                      {d.driver?.name || <span className="text-slate-400">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[d.status] || "bg-slate-100 text-slate-600"}`}>
                        {d.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{d.branch?.name || "-"}</td>
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
