"use client";

import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  RefreshCw,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  Settings2,
  Database,
  ArrowUpDown,
  BookOpen,
  HelpCircle,
  Layers,
  ChevronRight,
  ShieldCheck,
  Zap,
  ShoppingBag,
  PackageCheck,
  FileText,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface QuickbooksConfig {
  syncEnabled: boolean;
  qbwcUsername: string;
  salesAccount: string;
  inventoryAssetAccount: string;
  cogsAccount: string;
  accountsPayableAccount: string;
  momoClearingAccount: string;
  cashClearingAccount: string;
  cardClearingAccount: string;
  defaultTaxCode: string;
  autoSyncInventory: boolean;
  lastInventorySync?: string;
  lastSalesSync?: string;
}

interface SyncStats {
  totalProducts: number;
  inStockCount: number;
  outOfStockCount: number;
  totalOrders: number;
  lastInventorySync: string | null;
  lastSalesSync: string | null;
}

interface TransactionItem {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  itemCount: number;
  paymentMethod: string;
  status: string;
  qbStatus: "SYNCED" | "PENDING" | "FAILED";
  createdAt: string;
}

export default function QuickBooksSyncPage() {
  const [activeTab, setActiveTab] = useState<"inventory" | "sales" | "settings" | "iif" | "guide">("inventory");
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<QuickbooksConfig | null>(null);
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [savingSettings, setSavingSettings] = useState(false);
  const [syncingNow, setSyncingNow] = useState(false);

  // Manual Item File Upload state
  const [importingFile, setImportingFile] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  // IIF Export state
  const [iifDateRange, setIifDateRange] = useState("30d");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await apiFetch<any>("/quickbooks/sync-status");
      setConfig(data.config);
      setStats(data.stats);
      setTransactions(data.transactions || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load QuickBooks status");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!config) return;

    setSavingSettings(true);
    try {
      const res = await apiFetch<any>("/quickbooks/settings", {
        method: "PUT",
        body: JSON.stringify(config),
      });
      toast.success(res.message || "QuickBooks settings saved!");
      setConfig(res.config);
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleTriggerSync() {
    setSyncingNow(true);
    try {
      const res = await apiFetch<any>("/quickbooks/sync-now", { method: "POST" });
      toast.success(res.message);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to trigger sync");
    } finally {
      setSyncingNow(false);
    }
  }

  function handleDownloadQwc() {
    const token = typeof window !== "undefined" ? localStorage.getItem("jumarald_admin_token") : "";
    const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/quickbooks/qwc`;
    
    // Direct browser download
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = "jumarald_quickbooks.qwc";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Downloaded jumarald_quickbooks.qwc configuration file");
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingFile(true);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const res = await apiFetch<any>("/quickbooks/import-items", {
          method: "POST",
          body: JSON.stringify({
            fileContent: content,
            filename: file.name,
          }),
        });

        toast.success(res.message || "QuickBooks inventory imported!");
        setImportResult(res.result);
        loadData();
      } catch (err: any) {
        toast.error(err.message || "Failed to import items");
      } finally {
        setImportingFile(false);
      }
    };
    reader.readAsText(file);
  }

  function handleDownloadIif() {
    let startDate = "";
    const endDate = new Date().toISOString().split("T")[0];

    const d = new Date();
    if (iifDateRange === "today") {
      startDate = endDate;
    } else if (iifDateRange === "7d") {
      d.setDate(d.getDate() - 7);
      startDate = d.toISOString().split("T")[0];
    } else if (iifDateRange === "30d") {
      d.setDate(d.getDate() - 30);
      startDate = d.toISOString().split("T")[0];
    }

    const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/quickbooks/export-iif?startDate=${startDate}&endDate=${endDate}`;
    window.open(downloadUrl, "_blank");
    toast.success("Downloading .IIF file for QuickBooks Desktop");
  }

  const inputClass =
    "w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500";
  const labelClass = "text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block";

  return (
    <div className="w-full space-y-6">
      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100">
              QuickBooks Desktop 19.0 Integration
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              Master Inventory
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5">
            QuickBooks Desktop is your primary inventory master &amp; per-transaction sales accounting ledger.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleDownloadQwc}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-sm transition-all"
            title="Download .qwc configuration file for QuickBooks Web Connector"
          >
            <Download className="h-3.5 w-3.5 text-emerald-500" />
            <span>Download .QWC</span>
          </button>

          <button
            type="button"
            onClick={handleTriggerSync}
            disabled={syncingNow || loading}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncingNow ? "animate-spin" : ""}`} />
            <span>{syncingNow ? "Queuing..." : "Sync Now"}</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Master Products</span>
            <Database className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100">
              {stats?.totalProducts || 0}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              {stats?.inStockCount || 0} in stock
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Sales Receipts</span>
            <ShoppingBag className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100">
              {stats?.totalOrders || 0}
            </p>
            <p className="text-[11px] text-slate-400 font-medium">Per-transaction sync</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Last Inventory Pull</span>
            <Clock className="h-4 w-4 text-purple-500" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
              {stats?.lastInventorySync ? new Date(stats.lastInventorySync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Not yet synced"}
            </p>
            <p className="text-[10px] text-slate-400">
              {stats?.lastInventorySync ? new Date(stats.lastInventorySync).toLocaleDateString() : "QB ➜ Web"}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">QBWC Protocol</span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
              qbXML 13.0 Active
            </p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              QB Desktop 19.0 (2019)
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl overflow-x-auto scrollbar-thin">
        {[
          { key: "inventory", label: "Master Inventory Sync", icon: PackageCheck },
          { key: "sales", label: "Per-Transaction Sales Queue", icon: ShoppingBag },
          { key: "settings", label: "GL Account Mappings", icon: Settings2 },
          { key: "iif", label: "1-Click .IIF Exporter", icon: FileSpreadsheet },
          { key: "guide", label: "Setup Guide (QBWC)", icon: HelpCircle },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                isActive
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-emerald-500" : "text-slate-400"}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: MASTER INVENTORY SYNC ── */}
      {activeTab === "inventory" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <PackageCheck className="h-5 w-5 text-emerald-500" />
                  QuickBooks Master Inventory Pull
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  When QuickBooks Web Connector runs, all product items, stock quantities (QuantityOnHand), and prices are fetched and updated on the website.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTriggerSync}
                  disabled={syncingNow}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${syncingNow ? "animate-spin" : ""}`} />
                  <span>Fetch via QBWC</span>
                </button>
              </div>
            </div>

            {/* Instant Manual Item List Upload Dropzone */}
            <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded-3xl bg-slate-50/50 dark:bg-slate-900/30 text-center transition-all">
              <Upload className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                1-Click Manual Inventory File Refresh
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-4">
                Export your Item Listing from QuickBooks Desktop (as <strong>.CSV</strong> or <strong>.IIF</strong>) and drop it here to update all website stock quantities immediately without waiting for QBWC.
              </p>

              <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer shadow-md shadow-emerald-600/20 transition-all">
                <span>{importingFile ? "Processing Inventory..." : "Choose QuickBooks Item File"}</span>
                <input
                  type="file"
                  accept=".csv,.iif,.txt"
                  onChange={handleFileUpload}
                  disabled={importingFile}
                  className="hidden"
                />
              </label>

              {importResult && (
                <div className="mt-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 max-w-md mx-auto text-left text-xs">
                  <p className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Import Complete!
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                    Updated {importResult.updated} existing items, added {importResult.created} new items from QuickBooks.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: PER-TRANSACTION SALES QUEUE ── */}
      {activeTab === "sales" && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-emerald-500" />
                Per-Transaction Sales Receipts Queue
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Each completed website or counter order generates an individual Sales Receipt in QuickBooks Desktop.
              </p>
            </div>

            <button
              type="button"
              onClick={handleTriggerSync}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
              <span>Refresh Queue</span>
            </button>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-750 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                  <th className="px-6 py-3.5 text-left">Order #</th>
                  <th className="px-6 py-3.5 text-left">Customer / Patient</th>
                  <th className="px-6 py-3.5 text-left">Payment</th>
                  <th className="px-6 py-3.5 text-left">Total (GHS)</th>
                  <th className="px-6 py-3.5 text-left">QB Sync Status</th>
                  <th className="px-6 py-3.5 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-750 text-xs">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      No sales transactions in queue
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {tx.orderNumber}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                        {tx.customerName}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                        GHS {Number(tx.totalAmount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.qbStatus === "SYNCED"
                              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                              : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                          }`}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          {tx.qbStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-400">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                    {tx.orderNumber}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                    {tx.qbStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">{tx.customerName}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">GHS {Number(tx.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: GL ACCOUNT MAPPINGS ── */}
      {activeTab === "settings" && (
        <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-emerald-500" />
              QuickBooks Chart of Accounts Mapping
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ensure account names match your General Ledger names inside QuickBooks Desktop 19.0 exactly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className={labelClass}>Sales Income Account *</label>
              <input
                type="text"
                value={config?.salesAccount || ""}
                onChange={(e) => setConfig({ ...config!, salesAccount: e.target.value })}
                placeholder="e.g. Sales:Pharmaceuticals"
                className={inputClass}
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Account credited on customer sales</span>
            </div>

            <div>
              <label className={labelClass}>Inventory Asset Account *</label>
              <input
                type="text"
                value={config?.inventoryAssetAccount || ""}
                onChange={(e) => setConfig({ ...config!, inventoryAssetAccount: e.target.value })}
                placeholder="e.g. Inventory Asset"
                className={inputClass}
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Master Inventory balance sheet account</span>
            </div>

            <div>
              <label className={labelClass}>MTN Mobile Money Clearing Account</label>
              <input
                type="text"
                value={config?.momoClearingAccount || ""}
                onChange={(e) => setConfig({ ...config!, momoClearingAccount: e.target.value })}
                placeholder="e.g. MTN Mobile Money Clearing"
                className={inputClass}
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Deposits for online MoMo sales</span>
            </div>

            <div>
              <label className={labelClass}>Cash on Hand / Register Account</label>
              <input
                type="text"
                value={config?.cashClearingAccount || ""}
                onChange={(e) => setConfig({ ...config!, cashClearingAccount: e.target.value })}
                placeholder="e.g. Cash on Hand"
                className={inputClass}
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Counter physical cash sales</span>
            </div>

            <div>
              <label className={labelClass}>Accounts Payable (Distributor Bills)</label>
              <input
                type="text"
                value={config?.accountsPayableAccount || ""}
                onChange={(e) => setConfig({ ...config!, accountsPayableAccount: e.target.value })}
                placeholder="e.g. Accounts Payable"
                className={inputClass}
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Wholesaler invoices (Ernest Chemists, etc.)</span>
            </div>

            <div>
              <label className={labelClass}>Default Tax Code</label>
              <input
                type="text"
                value={config?.defaultTaxCode || ""}
                onChange={(e) => setConfig({ ...config!, defaultTaxCode: e.target.value })}
                placeholder="e.g. Exempt / VAT"
                className={inputClass}
              />
              <span className="text-[11px] text-slate-400 mt-1 block">QuickBooks sales tax code</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
            >
              {savingSettings ? "Saving Settings..." : "Save Chart of Accounts Mapping"}
            </button>
          </div>
        </form>
      )}

      {/* ── TAB 4: 1-CLICK .IIF EXPORTER ── */}
      {activeTab === "iif" && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
              1-Click .IIF Transaction Exporter
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Download standard QuickBooks Intuit Interchange Format (.IIF) files for instant manual import via <em>File &gt; Utilities &gt; Import &gt; IIF Files</em>.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 max-w-xl space-y-4">
            <div>
              <label className={labelClass}>Select Sales Period</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "today", label: "Today's Sales" },
                  { key: "7d", label: "Last 7 Days" },
                  { key: "30d", label: "Last 30 Days" },
                ].map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setIifDateRange(p.key)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      iifDateRange === p.key
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadIif}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
            >
              <Download className="h-4 w-4" />
              <span>Download .IIF File for QuickBooks Desktop</span>
            </button>
          </div>
        </div>
      )}

      {/* ── TAB 5: 3-STEP SETUP GUIDE ── */}
      {activeTab === "guide" && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-emerald-500" />
              QuickBooks Web Connector (QBWC) Setup in 3 Simple Steps
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              QuickBooks Web Connector is Intuit's official free Windows utility that connects QuickBooks Desktop 19.0 to your cloud store.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="h-8 w-8 rounded-xl bg-emerald-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-emerald-600/30">
                1
              </div>
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                Download .QWC File
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click the <strong>Download .QWC</strong> button above to save the <code>jumarald_quickbooks.qwc</code> profile to your computer.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="h-8 w-8 rounded-xl bg-emerald-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-emerald-600/30">
                2
              </div>
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                Open in Web Connector
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Open <strong>QuickBooks Web Connector</strong> on your Windows PC (under <em>File &gt; Update Web Services</em> in QuickBooks), click <strong>Add an Application</strong>, and select the file.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="h-8 w-8 rounded-xl bg-emerald-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-emerald-600/30">
                3
              </div>
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                Authorize &amp; Auto-Sync
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Check the box next to <strong>Jumarald Pharmacy QB Sync</strong>, set the interval to 15 mins, and click <strong>Update Selected</strong>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
