"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  DollarSign, ShoppingCart, TrendingUp, Package, Download, Calendar,
  RefreshCw, BarChart3, ArrowUpRight, ArrowDownRight, ChevronDown,
  FileText, Filter
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface SalesData {
  date: string;
  revenue: number;
  orders: number;
  itemsSold: number;
  avgOrderValue: number;
}

interface RevenueChartData {
  date: string;
  revenue: number;
  orders: number;
}

interface CategoryBreakdown {
  category: string;
  revenue: number;
  count: number;
  percentage: number;
}

interface TopProduct {
  id: string;
  name: string;
  category: string;
  totalSold: number;
  revenue: number;
  avgPrice: number;
}

interface SalesReportData {
  salesData: SalesData[];
  summary: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    totalItemsSold: number;
    revenueChange: number;
    ordersChange: number;
  };
}

interface RevenueChartDataFull {
  data: RevenueChartData[];
}

interface CategoryData {
  categories: CategoryBreakdown[];
}

interface TopProductsData {
  products: TopProduct[];
}

type DatePreset = "today" | "7d" | "30d" | "thisMonth" | "lastMonth" | "custom";
type GroupBy = "day" | "week" | "month";

const CATEGORY_COLORS = [
  "from-emerald-400 to-emerald-600",
  "from-blue-400 to-blue-600",
  "from-indigo-400 to-indigo-600",
  "from-purple-400 to-purple-600",
  "from-pink-400 to-pink-600",
  "from-amber-400 to-amber-600",
  "from-cyan-400 to-cyan-600",
  "from-rose-400 to-rose-600",
  "from-teal-400 to-teal-600",
  "from-orange-400 to-orange-600",
];

const PIE_COLORS = [
  "#10b981", "#3b82f6", "#6366f1", "#a855f7", "#ec4899",
  "#f59e0b", "#06b6d4", "#f43f5e", "#14b8a6", "#f97316",
];

function getDateRange(preset: DatePreset): { startDate: string; endDate: string } {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  switch (preset) {
    case "today":
      return { startDate: today, endDate: today };
    case "7d": {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      return { startDate: d.toISOString().split("T")[0], endDate: today };
    }
    case "30d": {
      const d = new Date(now);
      d.setDate(d.getDate() - 29);
      return { startDate: d.toISOString().split("T")[0], endDate: today };
    }
    case "thisMonth": {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: d.toISOString().split("T")[0], endDate: today };
    }
    case "lastMonth": {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: first.toISOString().split("T")[0], endDate: last.toISOString().split("T")[0] };
    }
    default:
      return { startDate: today, endDate: today };
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatMonth(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function downloadCSV(data: Record<string, any>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map((row) => headers.map((h) => `"${String(row[h] ?? "")}"`).join(","))
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function ReportsPage() {
  const [datePreset, setDatePreset] = useState<DatePreset>("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [groupBy, setGroupBy] = useState<GroupBy>("day");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [salesReport, setSalesReport] = useState<SalesReportData | null>(null);
  const [revenueChart, setRevenueChart] = useState<RevenueChartDataFull | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryData | null>(null);
  const [topProducts, setTopProducts] = useState<TopProductsData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { startDate, endDate } = useMemo(() => {
    if (datePreset === "custom") {
      return { startDate: customStart || new Date().toISOString().split("T")[0], endDate: customEnd || new Date().toISOString().split("T")[0] };
    }
    return getDateRange(datePreset);
  }, [datePreset, customStart, customEnd]);

  const daysInRange = useMemo(() => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    return Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  }, [startDate, endDate]);

  const loadReports = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [sales, revenue, categories, products] = await Promise.all([
        apiFetch<any>(`/reports/sales?startDate=${startDate}&endDate=${endDate}&groupBy=${groupBy}`),
        apiFetch<any>(`/reports/revenue-chart?days=${daysInRange}`),
        apiFetch<any>(`/reports/category-breakdown?startDate=${startDate}&endDate=${endDate}`),
        apiFetch<any>(`/reports/top-products?startDate=${startDate}&endDate=${endDate}`),
      ]);
      setSalesReport(sales);
      setRevenueChart(revenue);
      setCategoryData(categories);
      setTopProducts(products);
      setLastUpdated(new Date());
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [startDate, endDate, groupBy, daysInRange]);

  useEffect(() => {
    setLoading(true);
    loadReports();
  }, [loadReports]);

  const maxChartRevenue = useMemo(() => {
    if (!revenueChart) return 1;
    return Math.max(...revenueChart.data.map((d) => d.revenue), 1);
  }, [revenueChart]);

  const maxSalesRevenue = useMemo(() => {
    if (!salesReport) return 1;
    return Math.max(...salesReport.salesData.map((d) => d.revenue), 1);
  }, [salesReport]);

  const handleExportSales = () => {
    if (!salesReport) return;
    downloadCSV(
      salesReport.salesData.map((d) => ({
        Date: d.date,
        Revenue: d.revenue,
        Orders: d.orders,
        "Items Sold": d.itemsSold,
        "Avg Order Value": d.avgOrderValue,
      })),
      `sales-report-${startDate}-to-${endDate}.csv`
    );
  };

  const handleExportProducts = () => {
    if (!topProducts) return;
    downloadCSV(
      topProducts.products.map((p) => ({
        Product: p.name,
        Category: p.category,
        "Units Sold": p.totalSold,
        Revenue: p.revenue,
        "Avg Price": p.avgPrice,
      })),
      `top-products-${startDate}-to-${endDate}.csv`
    );
  };

  const handleExportAll = () => {
    if (!salesReport) return;
    handleExportSales();
  };

  const s = salesReport?.summary;

  const pieSegments = useMemo(() => {
    if (!categoryData || categoryData.categories.length === 0) return [];
    const total = categoryData.categories.reduce((sum, c) => sum + c.revenue, 0);
    let cumulative = 0;
    return categoryData.categories.map((cat, i) => {
      const start = cumulative;
      const pct = total > 0 ? (cat.revenue / total) * 100 : 0;
      cumulative += pct;
      return { ...cat, startPct: start, endPct: cumulative, color: PIE_COLORS[i % PIE_COLORS.length] };
    });
  }, [categoryData]);

  const pieGradient = useMemo(() => {
    if (pieSegments.length === 0) return "conic-gradient(#e2e8f0 0deg 360deg)";
    const stops = pieSegments.map((s) => `${s.color} ${s.startPct * 3.6}deg ${s.endPct * 3.6}deg`).join(", ");
    return `conic-gradient(${stops})`;
  }, [pieSegments]);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Sales Reports</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Comprehensive sales analytics and performance insights</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && <span className="text-xs text-slate-400 dark:text-slate-500">Updated {lastUpdated.toLocaleTimeString()}</span>}
          <button
            onClick={() => loadReports(true)}
            disabled={refreshing}
            className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Date Range Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Date Range</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {([
              { key: "today" as const, label: "Today" },
              { key: "7d" as const, label: "Last 7 Days" },
              { key: "30d" as const, label: "Last 30 Days" },
              { key: "thisMonth" as const, label: "This Month" },
              { key: "lastMonth" as const, label: "Last Month" },
              { key: "custom" as const, label: "Custom" },
            ]).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setDatePreset(opt.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  datePreset === opt.key
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {datePreset === "custom" && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-400 dark:text-slate-500">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Group By</span>
          </div>
          <div className="flex items-center gap-2">
            {([
              { key: "day" as const, label: "Day" },
              { key: "week" as const, label: "Week" },
              { key: "month" as const, label: "Month" },
            ]).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setGroupBy(opt.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  groupBy === opt.key
                    ? "bg-slate-800 dark:bg-slate-600 text-white shadow-md"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="ml-auto">
            <button
              onClick={handleExportAll}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-600/30"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
          Showing data from {startDate} to {endDate}
        </p>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 animate-pulse">
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-3" />
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl h-64 animate-pulse" />)}
          </div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500"><DollarSign className="h-5 w-5 text-white" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total Revenue</p>
                  <p className="text-xl font-bold text-slate-800 dark:text-slate-100">GHS {(s?.totalRevenue ?? 0).toLocaleString()}</p>
                </div>
              </div>
              {s && s.revenueChange !== 0 && (
                <div className="mt-2 flex items-center gap-1">
                  {s.revenueChange > 0
                    ? <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                    : <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />}
                  <span className={`text-xs font-bold ${s.revenueChange > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                    {Math.abs(s.revenueChange).toFixed(1)}%
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">vs prev period</span>
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500"><ShoppingCart className="h-5 w-5 text-white" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total Orders</p>
                  <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{(s?.totalOrders ?? 0).toLocaleString()}</p>
                </div>
              </div>
              {s && s.ordersChange !== 0 && (
                <div className="mt-2 flex items-center gap-1">
                  {s.ordersChange > 0
                    ? <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                    : <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />}
                  <span className={`text-xs font-bold ${s.ordersChange > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                    {Math.abs(s.ordersChange).toFixed(1)}%
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">vs prev period</span>
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500"><TrendingUp className="h-5 w-5 text-white" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Avg Order Value</p>
                  <p className="text-xl font-bold text-slate-800 dark:text-slate-100">GHS {(s?.avgOrderValue ?? 0).toLocaleString()}</p>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500"><Package className="h-5 w-5 text-white" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total Items Sold</p>
                  <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{(s?.totalItemsSold ?? 0).toLocaleString()}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Over Time */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Sales Over Time</h3>
                <span className="text-xs text-slate-400 dark:text-slate-500 capitalize">By {groupBy}</span>
              </div>
              <div className="space-y-2">
                {salesReport && salesReport.salesData.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-12">No sales data for this period</p>
                ) : (
                  (salesReport?.salesData ?? []).slice(0, 15).map((d, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 dark:text-slate-400 w-16 text-right">{formatDate(d.date)}</span>
                      <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (d.revenue / maxSalesRevenue) * 100)}%` }}
                          transition={{ delay: i * 0.05, duration: 0.5 }}
                          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-lg"
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 w-20 text-right">GHS {d.revenue.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 dark:text-slate-100">By Category</h3>
              </div>
              {!categoryData || categoryData.categories.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-12">No category data</p>
              ) : (
                <>
                  {/* CSS Pie Chart */}
                  <div className="flex justify-center mb-4">
                    <div
                      className="w-36 h-36 rounded-full shadow-inner"
                      style={{ background: pieGradient }}
                    />
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {categoryData.categories.map((cat, i) => (
                      <div key={cat.category} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-xs text-slate-600 dark:text-slate-400 flex-1 truncate">{cat.category}</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{cat.percentage.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Revenue Trend</h3>
              <span className="text-xs text-slate-400 dark:text-slate-500">Last {daysInRange} days</span>
            </div>
            <div className="flex items-end gap-1.5 h-48">
              {revenueChart && revenueChart.data.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500 text-center w-full py-12">No revenue data</p>
              ) : (
                (revenueChart?.data ?? []).map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 opacity-0 hover:opacity-100 transition-opacity">
                      GHS {d.revenue.toLocaleString()}
                    </span>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-t-md overflow-hidden" style={{ height: "100%" }}>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.min(100, (d.revenue / maxChartRevenue) * 100)}%` }}
                        transition={{ delay: i * 0.02, duration: 0.4 }}
                        className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-md mt-auto hover:from-emerald-600 hover:to-emerald-500 transition-colors"
                      />
                    </div>
                    {i % Math.max(1, Math.floor((revenueChart?.data.length ?? 1) / 8)) === 0 && (
                      <span className="text-[9px] text-slate-400 dark:text-slate-500">{formatDate(d.date)}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Products + Export */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Top Selling Products</h3>
                <button
                  onClick={handleExportProducts}
                  className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export
                </button>
              </div>
              {!topProducts || topProducts.products.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-12">No product data for this period</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-700">
                        <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 pb-2">#</th>
                        <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 pb-2">Product</th>
                        <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 pb-2">Category</th>
                        <th className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400 pb-2">Sold</th>
                        <th className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400 pb-2">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                      {topProducts.products.slice(0, 10).map((p, i) => (
                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="py-2.5 text-sm font-bold text-slate-300 dark:text-slate-600">{i + 1}</td>
                          <td className="py-2.5">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[160px]">{p.name}</p>
                          </td>
                          <td className="py-2.5">
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                              {p.category}
                            </span>
                          </td>
                          <td className="py-2.5 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">{p.totalSold}</td>
                          <td className="py-2.5 text-right text-sm font-bold text-emerald-600 dark:text-emerald-400">GHS {p.revenue.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Sales by Period (Orders) */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Orders by Period</h3>
              </div>
              <div className="space-y-2">
                {salesReport && salesReport.salesData.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-12">No order data</p>
                ) : (
                  (salesReport?.salesData ?? []).slice(0, 15).map((d, i) => {
                    const maxOrders = Math.max(...(salesReport?.salesData ?? []).map((x) => x.orders), 1);
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 dark:text-slate-400 w-16 text-right">{formatDate(d.date)}</span>
                        <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (d.orders / maxOrders) * 100)}%` }}
                            transition={{ delay: i * 0.05, duration: 0.5 }}
                            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg"
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 w-12 text-right">{d.orders}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Daily Detail Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Detailed Breakdown</h3>
              <button
                onClick={handleExportSales}
                className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <Download className="h-3.5 w-3.5" />
                Export All
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 pb-2">Date</th>
                    <th className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400 pb-2">Revenue</th>
                    <th className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400 pb-2">Orders</th>
                    <th className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400 pb-2">Items Sold</th>
                    <th className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400 pb-2">Avg Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                  {(salesReport?.salesData ?? []).map((d, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200">{d.date}</td>
                      <td className="py-2.5 text-right text-sm font-bold text-emerald-600 dark:text-emerald-400">GHS {d.revenue.toLocaleString()}</td>
                      <td className="py-2.5 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">{d.orders}</td>
                      <td className="py-2.5 text-right text-sm text-slate-600 dark:text-slate-400">{d.itemsSold}</td>
                      <td className="py-2.5 text-right text-sm text-slate-600 dark:text-slate-400">GHS {d.avgOrderValue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                {salesReport && salesReport.salesData.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-slate-200 dark:border-slate-600 font-bold">
                      <td className="py-2.5 text-sm text-slate-800 dark:text-slate-200">Total</td>
                      <td className="py-2.5 text-right text-sm text-emerald-600 dark:text-emerald-400">GHS {(s?.totalRevenue ?? 0).toLocaleString()}</td>
                      <td className="py-2.5 text-right text-sm text-slate-800 dark:text-slate-200">{(s?.totalOrders ?? 0).toLocaleString()}</td>
                      <td className="py-2.5 text-right text-sm text-slate-700 dark:text-slate-300">{(s?.totalItemsSold ?? 0).toLocaleString()}</td>
                      <td className="py-2.5 text-right text-sm text-slate-700 dark:text-slate-300">GHS {(s?.avgOrderValue ?? 0).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
