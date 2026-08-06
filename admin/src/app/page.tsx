"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, ShoppingCart, Users, FileText, Package, Truck, DollarSign, AlertTriangle } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Analytics {
  summary: {
    totalOrders: number;
    totalRevenue: number;
    pendingPrescriptions: number;
    lowStockProducts: number;
    totalUsers: number;
  };
  chartData: { month: string; revenue: number; orders: number }[];
}

function StatsCard({ icon: Icon, title, value, change, color }: { icon: any; title: string; value: string; change?: string; color: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
          {change && <p className={`text-xs mt-1 ${change.startsWith("+") ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>{change}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Analytics>("/analytics/overview")
      .then(setAnalytics)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 animate-pulse">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-3" />
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Executive Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Welcome back. Here&apos;s your pharmacy overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard icon={DollarSign} title="Total Revenue" value={`GHS ${(analytics?.summary.totalRevenue || 0).toLocaleString()}`} change="+12.5% this month" color="bg-emerald-500" />
        <StatsCard icon={ShoppingCart} title="Total Orders" value={(analytics?.summary.totalOrders || 0).toLocaleString()} change="+8.2% this month" color="bg-blue-500" />
        <StatsCard icon={Users} title="Active Users" value={(analytics?.summary.totalUsers || 0).toLocaleString()} change="+5.1% this month" color="bg-purple-500" />
        <StatsCard icon={AlertTriangle} title="Pending Actions" value={String((analytics?.summary.pendingPrescriptions || 0) + (analytics?.summary.lowStockProducts || 0))} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Revenue Overview</h3>
          <div className="space-y-3">
            {analytics?.chartData?.map((d, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-xs text-slate-500 dark:text-slate-400 w-8">{d.month}</span>
                <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (d.revenue / Math.max(...(analytics.chartData.map((c) => c.revenue)), 1)) * 100)}%` }}
                    transition={{ delay: i * 0.1 }} className="h-full bg-emerald-500 rounded-full" />
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 w-24 text-right">GHS {d.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Orders by Status</h3>
          <div className="space-y-4">
            {[
              { status: "Pending", count: analytics?.summary.pendingPrescriptions || 0, color: "bg-amber-500" },
              { status: "Processing", count: Math.floor((analytics?.summary.totalOrders || 0) * 0.15), color: "bg-blue-500" },
              { status: "Shipped", count: Math.floor((analytics?.summary.totalOrders || 0) * 0.25), color: "bg-purple-500" },
              { status: "Delivered", count: Math.floor((analytics?.summary.totalOrders || 0) * 0.5), color: "bg-green-500" },
              { status: "Cancelled", count: Math.floor((analytics?.summary.totalOrders || 0) * 0.05), color: "bg-red-500" },
            ].map((item) => (
              <div key={item.status} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                <span className="text-sm text-slate-600 dark:text-slate-400 flex-1">{item.status}</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Manage Products", href: "/products", icon: Package },
            { label: "Order Queue", href: "/orders", icon: ShoppingCart },
            { label: "Prescriptions", href: "/prescriptions", icon: FileText },
            { label: "Deliveries", href: "/deliveries", icon: Truck },
          ].map((action) => (
            <a key={action.href} href={action.href}
              className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors group">
              <action.icon className="h-5 w-5 text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{action.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
