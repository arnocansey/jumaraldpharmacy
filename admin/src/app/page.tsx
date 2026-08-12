"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, ShoppingCart, Users, FileText, Package, Truck, DollarSign,
  AlertTriangle, Activity, BarChart3, Star, Clock, RefreshCw, ArrowUpRight,
  ArrowDownRight, Eye, ChevronRight, Heart, Zap, Shield, Calendar, MapPin
} from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

interface DashboardData {
  summary: {
    totalOrders: number;
    totalRevenue: number;
    pendingPrescriptions: number;
    lowStockProducts: number;
    totalUsers: number;
    totalProducts: number;
    totalBranches: number;
    activeBranches: number;
    pendingDeliveries: number;
    deliveredOrders: number;
    processingOrders: number;
    cancelledOrders: number;
    outOfStockProducts: number;
    expiringProducts: number;
    totalReviews: number;
    avgOrderValue: number;
  };
  chartData: { month: string; revenue: number; orders: number }[];
  topProducts: { id: string; name: string; category: string; totalSold: number; totalReviews: number; price: number }[];
  recentOrders: { id: string; orderNumber: string; customer: string; total: number; status: string; items: number; createdAt: string }[];
  prescriptionStats: { submitted: number; reviewing: number; approved: number; fulfilled: number; rejected: number };
  lowStockAlerts: { id: string; name: string; stock: number; sku: string; category: string; status: string }[];
  deliveryStats: { pending: number; assigned: number; inTransit: number; delivered: number; failed: number; total: number };
  branchPerformance: { id: string; name: string; code: string; staff: number; products: number; orders: number; revenue: number }[];
  expiringBatches: { id: string; productName: string; batchNumber: string; quantity: number; expiryDate: string; daysLeft: number }[];
  userGrowth: { month: string; users: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  PROCESSING: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  SHIPPED: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  DELIVERED: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  CANCELLED: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  OUT_FOR_DELIVERY: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400",
};

const PRESCRIPTION_COLORS: Record<string, string> = {
  submitted: "bg-amber-500",
  reviewing: "bg-blue-500",
  approved: "bg-emerald-500",
  fulfilled: "bg-purple-500",
  rejected: "bg-red-500",
};

function MiniStat({ label, value, icon: Icon, color, href }: { label: string; value: string | number; icon: any; color: string; href?: string }) {
  const Content = (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="glass-panel glass-panel-hover rounded-2xl p-4.5 group cursor-pointer">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${color} shadow-lg shadow-emerald-500/10`}><Icon className="h-4 w-4 text-white" /></div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">{label}</p>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-0.5">{value}</p>
        </div>
        {href && <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-emerald-500 transition-colors" />}
      </div>
    </motion.div>
  );
  return href ? <Link href={href}>{Content}</Link> : Content;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [dateRange, setDateRange] = useState<"today" | "7d" | "30d" | "90d" | "all">("all");

  const loadDashboard = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [overview, topProducts, recentOrders, prescriptionStats, lowStockAlerts, deliveryStats, branchPerformance, expiringBatches, userGrowth] = await Promise.all([
        apiFetch<any>("/analytics/overview"),
        apiFetch<any>("/analytics/top-products"),
        apiFetch<any>("/analytics/recent-orders"),
        apiFetch<any>("/analytics/prescriptions"),
        apiFetch<any>("/analytics/low-stock"),
        apiFetch<any>("/analytics/deliveries"),
        apiFetch<any>("/analytics/branches"),
        apiFetch<any>("/analytics/expiring-batches"),
        apiFetch<any>("/analytics/user-growth"),
      ]);
      setData({ ...overview, topProducts, recentOrders, prescriptionStats, lowStockAlerts, deliveryStats, branchPerformance, expiringBatches, userGrowth });
      setLastUpdated(new Date());
    } catch { }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  if (loading) return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-5 animate-pulse">
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl h-64 animate-pulse" />)}
      </div>
    </div>
  );

  if (!data) return null;

  const s = data.summary;
  const maxRevenue = Math.max(...data.chartData.map((c) => c.revenue), 1);
  const maxOrders = Math.max(...data.chartData.map((c) => c.orders), 1);
  const totalPrescriptions = data.prescriptionStats.submitted + data.prescriptionStats.reviewing + data.prescriptionStats.approved + data.prescriptionStats.fulfilled + data.prescriptionStats.rejected;
  const prescriptionCompletionRate = totalPrescriptions > 0 ? Math.round((data.prescriptionStats.fulfilled / totalPrescriptions) * 100) : 0;
  const deliverySuccessRate = data.deliveryStats.total > 0 ? Math.round((data.deliveryStats.delivered / data.deliveryStats.total) * 100) : 0;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Executive Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Real-time pharmacy operations overview</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
            {([
              { key: "today" as const, label: "Today" },
              { key: "7d" as const, label: "7D" },
              { key: "30d" as const, label: "30D" },
              { key: "90d" as const, label: "90D" },
              { key: "all" as const, label: "All" },
            ]).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setDateRange(opt.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  dateRange === opt.key
                    ? "bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {lastUpdated && <span className="text-xs text-slate-400 dark:text-slate-500">Updated {lastUpdated.toLocaleTimeString()}</span>}
          <button onClick={() => loadDashboard(true)} disabled={refreshing}
            className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Row 1: Core KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        <MiniStat label="Total Revenue" value={`GHS ${s.totalRevenue.toLocaleString()}`} icon={DollarSign} color="bg-emerald-500" href="/analytics" />
        <MiniStat label="Total Orders" value={s.totalOrders.toLocaleString()} icon={ShoppingCart} color="bg-blue-500" href="/orders" />
        <MiniStat label="Avg Order Value" value={`GHS ${s.avgOrderValue.toLocaleString()}`} icon={TrendingUp} color="bg-indigo-500" />
        <MiniStat label="Active Users" value={s.totalUsers.toLocaleString()} icon={Users} color="bg-purple-500" />
        <MiniStat label="Products" value={s.totalProducts.toLocaleString()} icon={Package} color="bg-cyan-500" href="/products" />
        <MiniStat label="Active Branches" value={`${s.activeBranches}/${s.totalBranches}`} icon={MapPin} color="bg-teal-500" href="/branches" />
        <MiniStat label="Reviews" value={s.totalReviews.toLocaleString()} icon={Star} color="bg-yellow-500" />
        <MiniStat label="Delivery Rate" value={`${deliverySuccessRate}%`} icon={Truck} color="bg-rose-500" href="/deliveries" />
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Revenue Trend</h3>
            <span className="text-xs text-slate-400 dark:text-slate-500">Last 6 months</span>
          </div>
          <div className="space-y-3">
            {data.chartData.map((d, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-xs text-slate-500 dark:text-slate-400 w-8">{d.month}</span>
                <div className="flex-1 h-7 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (d.revenue / maxRevenue) * 100)}%` }}
                    transition={{ delay: i * 0.08, duration: 0.5 }} className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-lg" />
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 w-24 text-right">GHS {d.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Order Volume */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Order Volume</h3>
            <span className="text-xs text-slate-400 dark:text-slate-500">Last 6 months</span>
          </div>
          <div className="space-y-3">
            {data.chartData.map((d, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-xs text-slate-500 dark:text-slate-400 w-8">{d.month}</span>
                <div className="flex-1 h-7 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (d.orders / maxOrders) * 100)}%` }}
                    transition={{ delay: i * 0.08, duration: 0.5 }} className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg" />
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 w-12 text-right">{d.orders}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Orders + Prescriptions + Deliveries Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders by Status */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Orders by Status</h3>
            <Link href="/orders" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {[
              { label: "Pending", count: s.pendingDeliveries, color: "bg-amber-500" },
              { label: "Processing", count: s.processingOrders, color: "bg-blue-500" },
              { label: "Delivered", count: s.deliveredOrders, color: "bg-emerald-500" },
              { label: "Cancelled", count: s.cancelledOrders, color: "bg-red-500" },
            ].map((item) => {
              const pct = s.totalOrders > 0 ? Math.round((item.count / s.totalOrders) * 100) : 0;
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                      <span className="text-sm text-slate-600 dark:text-slate-400">{item.label}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.count} <span className="font-normal text-slate-400 dark:text-slate-500">({pct}%)</span></span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className={`h-full rounded-full ${item.color}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Prescription Pipeline */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Prescription Pipeline</h3>
            <Link href="/prescriptions" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {[
              { label: "Submitted", count: data.prescriptionStats.submitted, color: "bg-amber-500" },
              { label: "Under Review", count: data.prescriptionStats.reviewing, color: "bg-blue-500" },
              { label: "Approved", count: data.prescriptionStats.approved, color: "bg-emerald-500" },
              { label: "Fulfilled", count: data.prescriptionStats.fulfilled, color: "bg-purple-500" },
              { label: "Rejected", count: data.prescriptionStats.rejected, color: "bg-red-500" },
            ].map((item) => {
              const pct = totalPrescriptions > 0 ? Math.round((item.count / totalPrescriptions) * 100) : 0;
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                      <span className="text-sm text-slate-600 dark:text-slate-400">{item.label}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className={`h-full rounded-full ${item.color}`} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">Completion Rate</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{prescriptionCompletionRate}%</span>
          </div>
        </div>

        {/* Delivery Status */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Delivery Status</h3>
            <Link href="/deliveries" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {[
              { label: "Pending", count: data.deliveryStats.pending, color: "bg-amber-500" },
              { label: "Assigned", count: data.deliveryStats.assigned, color: "bg-blue-500" },
              { label: "In Transit", count: data.deliveryStats.inTransit, color: "bg-purple-500" },
              { label: "Delivered", count: data.deliveryStats.delivered, color: "bg-emerald-500" },
              { label: "Failed", count: data.deliveryStats.failed, color: "bg-red-500" },
            ].map((item) => {
              const pct = data.deliveryStats.total > 0 ? Math.round((item.count / data.deliveryStats.total) * 100) : 0;
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                      <span className="text-sm text-slate-600 dark:text-slate-400">{item.label}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className={`h-full rounded-full ${item.color}`} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">Success Rate</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{deliverySuccessRate}%</span>
          </div>
        </div>
      </div>

      {/* Row 4: Top Products + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Top Selling Products</h3>
            <Link href="/products" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {data.topProducts.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">No product data yet. Add products via the Products page.</p>
            ) : data.topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <span className="text-lg font-bold text-slate-300 dark:text-slate-600 w-6">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{p.name}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{p.category} &middot; {p.totalSold} sold</p>
                </div>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">GHS {p.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Recent Orders</h3>
            <Link href="/orders" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">View All</Link>
          </div>
          <div className="space-y-2">
            {data.recentOrders.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">No orders yet.</p>
            ) : data.recentOrders.map((o) => (
              <div key={o.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{o.orderNumber}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[o.status] || "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"}`}>{o.status}</span>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{o.customer} &middot; {o.items} items &middot; {new Date(o.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">GHS {o.total.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 5: Alerts + Branches + User Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Alerts */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Low Stock Alerts</h3>
            <Link href="/inventory" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">Manage</Link>
          </div>
          <div className="space-y-2">
            {data.lowStockAlerts.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">All stock levels OK</p>
            ) : data.lowStockAlerts.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className={`p-1.5 rounded-lg ${p.status === "OUT_OF_STOCK" ? "bg-red-100 dark:bg-red-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}>
                  {p.status === "OUT_OF_STOCK"
                    ? <AlertTriangle className="h-4 w-4 text-red-500" />
                    : <Package className="h-4 w-4 text-amber-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{p.name}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{p.sku}</p>
                </div>
                <span className={`text-sm font-bold ${p.stock === 0 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>{p.stock} left</span>
              </div>
            ))}
          </div>
        </div>

        {/* Expiring Batches */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Expiring Soon</h3>
            <Link href="/inventory" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">View</Link>
          </div>
          <div className="space-y-2">
            {data.expiringBatches.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">No expiring batches in next 30 days</p>
            ) : data.expiringBatches.map((b) => (
              <div key={b.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className={`p-1.5 rounded-lg ${b.daysLeft <= 7 ? "bg-red-100 dark:bg-red-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}>
                  <Clock className={`h-4 w-4 ${b.daysLeft <= 7 ? "text-red-500" : "text-amber-500"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{b.productName}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Batch: {b.batchNumber}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${b.daysLeft <= 7 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>{b.daysLeft}d left</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{b.quantity} units</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Branch Performance */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Branch Performance</h3>
            <Link href="/branches" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {data.branchPerformance.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">No branch data yet</p>
            ) : data.branchPerformance.map((b) => {
              const maxBranchRevenue = Math.max(...data.branchPerformance.map((x) => x.revenue), 1);
              return (
                <div key={b.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded text-xs font-bold">{b.code}</span>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{b.name}</span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{b.staff} staff &middot; {b.orders} orders</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (b.revenue / maxBranchRevenue) * 100)}%` }}
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full" />
                  </div>
                  <p className="text-xs text-right text-slate-500 dark:text-slate-400">GHS {b.revenue.toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 6: User Growth Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">User Growth</h3>
          <span className="text-xs text-slate-400 dark:text-slate-500">Last 6 months</span>
        </div>
        <div className="flex items-end gap-3 h-40">
          {data.userGrowth.map((d, i) => {
            const maxUsers = Math.max(...data.userGrowth.map((x) => x.users), 1);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{d.users}</span>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-t-lg overflow-hidden" style={{ height: "100%" }}>
                  <motion.div initial={{ height: 0 }} animate={{ height: `${Math.min(100, (d.users / maxUsers) * 100)}%` }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                    className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-lg mt-auto" />
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">{d.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 7: Quick Actions */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Products", href: "/products", icon: Package, color: "hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400" },
            { label: "Orders", href: "/orders", icon: ShoppingCart, color: "hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400" },
            { label: "Prescriptions", href: "/prescriptions", icon: FileText, color: "hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400" },
            { label: "Deliveries", href: "/deliveries", icon: Truck, color: "hover:bg-cyan-50 dark:hover:bg-cyan-900/30 hover:text-cyan-600 dark:hover:text-cyan-400" },
            { label: "Inventory", href: "/inventory", icon: AlertTriangle, color: "hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-600 dark:hover:text-amber-400" },
            { label: "Analytics", href: "/analytics", icon: BarChart3, color: "hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-600 dark:hover:text-rose-400" },
          ].map((action) => (
            <Link key={action.href} href={action.href}
              className={`flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl transition-colors group ${action.color}`}>
              <action.icon className="h-5 w-5 text-slate-400 dark:text-slate-500 group-hover:currentColor" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:currentColor">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Row 8: System Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-emerald-500"><Shield className="h-5 w-5 text-white" /></div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">System Health</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between"><span className="text-sm text-slate-600 dark:text-slate-400">API Status</span><span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Healthy</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-slate-600 dark:text-slate-400">Database</span><span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Connected</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-slate-600 dark:text-slate-400">Last Deploy</span><span className="text-xs text-slate-500 dark:text-slate-400">{new Date().toLocaleDateString()}</span></div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-blue-500"><Zap className="h-5 w-5 text-white" /></div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Performance</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between"><span className="text-sm text-slate-600 dark:text-slate-400">Avg Order Value</span><span className="text-xs font-bold text-slate-700 dark:text-slate-300">GHS {s.avgOrderValue.toLocaleString()}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-slate-600 dark:text-slate-400">Completion Rate</span><span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{prescriptionCompletionRate}%</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-slate-600 dark:text-slate-400">Delivery Success</span><span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{deliverySuccessRate}%</span></div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-amber-500"><Heart className="h-5 w-5 text-white" /></div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Alerts Summary</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between"><span className="text-sm text-slate-600 dark:text-slate-400">Low Stock Items</span><span className={`text-xs font-bold ${s.lowStockProducts > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>{s.lowStockProducts}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-slate-600 dark:text-slate-400">Out of Stock</span><span className={`text-xs font-bold ${s.outOfStockProducts > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>{s.outOfStockProducts}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-slate-600 dark:text-slate-400">Expiring Soon</span><span className={`text-xs font-bold ${s.expiringProducts > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>{s.expiringProducts}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
