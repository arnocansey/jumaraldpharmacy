"use client";

import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Users, Package, DollarSign } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<any>("/analytics/overview")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8"><div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-slate-200 rounded-2xl" />)}</div></div>;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Advanced Analytics</h1>
        <p className="text-slate-500 text-sm">Comprehensive business intelligence</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <DollarSign className="h-8 w-8 text-emerald-500 mb-2" />
          <p className="text-2xl font-bold text-slate-800">GHS {(data?.summary?.totalRevenue || 0).toLocaleString()}</p>
          <p className="text-sm text-slate-500">Total Revenue</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <Package className="h-8 w-8 text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-slate-800">{data?.summary?.totalOrders || 0}</p>
          <p className="text-sm text-slate-500">Total Orders</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <Users className="h-8 w-8 text-purple-500 mb-2" />
          <p className="text-2xl font-bold text-slate-800">{data?.summary?.totalUsers || 0}</p>
          <p className="text-sm text-slate-500">Total Users</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <TrendingUp className="h-8 w-8 text-amber-500 mb-2" />
          <p className="text-2xl font-bold text-slate-800">{data?.summary?.pendingPrescriptions || 0}</p>
          <p className="text-sm text-slate-500">Pending Actions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="font-bold text-slate-800 mb-4">Revenue Trend</h3>
          <div className="space-y-3">
            {data?.chartData?.map((d: any, i: number) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-xs text-slate-500 w-8">{d.month}</span>
                <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-lg transition-all"
                    style={{ width: `${Math.min(100, (d.revenue / Math.max(...data.chartData.map((c: any) => c.revenue), 1)) * 100)}%` }} />
                </div>
                <span className="text-sm font-semibold text-slate-700 w-20 text-right">GHS {d.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="font-bold text-slate-800 mb-4">Orders Trend</h3>
          <div className="space-y-3">
            {data?.chartData?.map((d: any, i: number) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-xs text-slate-500 w-8">{d.month}</span>
                <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg transition-all"
                    style={{ width: `${Math.min(100, (d.orders / Math.max(...data.chartData.map((c: any) => c.orders), 1)) * 100)}%` }} />
                </div>
                <span className="text-sm font-semibold text-slate-700 w-20 text-right">{d.orders} orders</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
