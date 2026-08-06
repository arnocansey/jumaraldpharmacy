"use client";

import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Users, Package, DollarSign } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { apiFetch<any>("/analytics/overview").then(setData).catch(() => {}).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="w-full"><div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-2xl" />)}</div></div>;

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Advanced Analytics</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Comprehensive business intelligence</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: DollarSign, label: "Total Revenue", value: `GHS ${(data?.summary?.totalRevenue || 0).toLocaleString()}`, color: "text-emerald-500" },
          { icon: Package, label: "Total Orders", value: data?.summary?.totalOrders || 0, color: "text-blue-500" },
          { icon: Users, label: "Total Users", value: data?.summary?.totalUsers || 0, color: "text-purple-500" },
          { icon: TrendingUp, label: "Pending Actions", value: data?.summary?.pendingPrescriptions || 0, color: "text-amber-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
            <s.icon className={`h-8 w-8 ${s.color} mb-2`} />
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{s.value}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Revenue Trend</h3>
          <div className="space-y-3">
            {data?.chartData?.map((d: any, i: number) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-xs text-slate-500 dark:text-slate-400 w-8">{d.month}</span>
                <div className="flex-1 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-lg" style={{ width: `${Math.min(100, (d.revenue / Math.max(...data.chartData.map((c: any) => c.revenue), 1)) * 100)}%` }} />
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 w-20 text-right">GHS {d.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Orders Trend</h3>
          <div className="space-y-3">
            {data?.chartData?.map((d: any, i: number) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-xs text-slate-500 dark:text-slate-400 w-8">{d.month}</span>
                <div className="flex-1 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg" style={{ width: `${Math.min(100, (d.orders / Math.max(...data.chartData.map((c: any) => c.orders), 1)) * 100)}%` }} />
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 w-20 text-right">{d.orders} orders</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
