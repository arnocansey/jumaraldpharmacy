"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Database,
  Download,
  RefreshCw,
  Trash2,
  RotateCcw,
  PlusCircle,
  FileSpreadsheet,
  HardDrive,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  X,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface BackupItem {
  filename: string;
  timestamp: string;
  sizeBytes: number;
  sizeFormatted: string;
  totalRecords: number;
}

export default function AdminBackupsPage() {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoringFile, setRestoringFile] = useState<string | null>(null);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);

  const fetchBackups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ status: string; backups: BackupItem[] }>("/backups/list");
      setBackups(res.backups || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch backups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const handleCreateBackup = async () => {
    setCreating(true);
    toast.info("Generating full database snapshot...");
    try {
      const res = await apiFetch<{ status: string; message: string; data: any }>("/backups/create", {
        method: "POST",
      });
      toast.success(`Backup created: ${res.data.filename} (${res.data.sizeFormatted})`);
      fetchBackups();
    } catch (err: any) {
      toast.error(err.message || "Failed to create backup");
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      const token = localStorage.getItem("jumarald_token") || "";
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/backups/download/${filename}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Downloaded ${filename}`);
    } catch {
      toast.error("Failed to download backup file");
    }
  };

  const handleRestore = async (filename: string) => {
    setRestoringFile(filename);
    toast.info("Restoring database state...");
    try {
      await apiFetch(`/backups/restore/${filename}`, {
        method: "POST",
      });
      toast.success(`Database successfully restored from ${filename}!`);
      setConfirmRestore(null);
      fetchBackups();
    } catch (err: any) {
      toast.error(err.message || "Database restoration failed");
    } finally {
      setRestoringFile(null);
    }
  };

  const handleDelete = async (filename: string) => {
    setDeletingFile(filename);
    try {
      await apiFetch(`/backups/${filename}`, {
        method: "DELETE",
      });
      toast.success("Backup snapshot deleted");
      fetchBackups();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete backup");
    } finally {
      setDeletingFile(null);
    }
  };

  const handleExportCSV = async (table: string) => {
    try {
      const token = localStorage.getItem("jumarald_token") || "";
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/backups/export/${table}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${table}_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Exported ${table} table to CSV!`);
    } catch {
      toast.error(`Failed to export ${table} CSV`);
    }
  };

  const totalStorageBytes = backups.reduce((acc, b) => acc + b.sizeBytes, 0);
  const totalStorageFormatted = (totalStorageBytes / (1024 * 1024)).toFixed(2);

  return (
    <div className="w-full max-w-6xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Database Backup Vault</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Live Protection
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage data backups, system snapshots, and table CSV exports for Jumarald Pharmacy.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchBackups}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Refresh Backups"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleCreateBackup}
            disabled={creating}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
            <span>{creating ? "Creating..." : "Backup Database Now"}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Backups</p>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{backups.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <HardDrive className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Storage</p>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{totalStorageFormatted} MB</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Latest Backup</p>
            <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
              {backups[0] ? new Date(backups[0].timestamp).toLocaleDateString() + " " + new Date(backups[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "None"}
            </p>
          </div>
        </div>
      </div>

      {/* CSV Quick Exporters Section */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Export Specific Table Data (CSV)</h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Download spreadsheets for auditing, offline accounting, or report preparation:
        </p>

        <div className="flex flex-wrap gap-3">
          {[
            { id: "orders", label: "Orders & Payments" },
            { id: "users", label: "Registered Patients & Staff" },
            { id: "products", label: "Product Catalog & Prices" },
            { id: "prescriptions", label: "Prescriptions History" },
            { id: "audit_logs", label: "System Audit Logs" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => handleExportCSV(t.id)}
              className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 transition-all flex items-center gap-2"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export {t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Backups Table */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Available Database Snapshots</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Full database JSON backups stored securely in server volume.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-600" />
            <p className="text-sm">Loading backup archives...</p>
          </div>
        ) : backups.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Database className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold">No backup snapshots found</p>
            <p className="text-xs max-w-sm mx-auto text-slate-400">
              Click &quot;Backup Database Now&quot; above to create your first backup.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-700/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
                  <th className="px-6 py-3.5">Filename</th>
                  <th className="px-6 py-3.5">Date Created</th>
                  <th className="px-6 py-3.5">Size</th>
                  <th className="px-6 py-3.5">Total Records</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
                {backups.map((b) => (
                  <tr key={b.filename} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 font-mono font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                      <Database className="h-4 w-4 shrink-0 text-slate-400" />
                      {b.filename}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(b.timestamp).toLocaleDateString()} {new Date(b.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{b.sizeFormatted}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {b.totalRecords} records
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                      <button
                        onClick={() => handleDownload(b.filename)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors font-semibold flex items-center gap-1 inline-flex"
                        title="Download Backup JSON"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download</span>
                      </button>

                      <button
                        onClick={() => setConfirmRestore(b.filename)}
                        disabled={restoringFile === b.filename}
                        className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors font-semibold flex items-center gap-1 inline-flex disabled:opacity-50"
                        title="Restore Database from this file"
                      >
                        {restoringFile === b.filename ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                        <span>Restore</span>
                      </button>

                      <button
                        onClick={() => handleDelete(b.filename)}
                        disabled={deletingFile === b.filename}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors inline-flex"
                        title="Delete Backup"
                      >
                        {deletingFile === b.filename ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Restore */}
      {confirmRestore && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-7 w-7" />
                <h3 className="text-lg font-extrabold text-slate-800 dark:text-white">Confirm Database Restore</h3>
              </div>
              <button
                onClick={() => setConfirmRestore(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to restore the database from snapshot:
              <br />
              <strong className="font-mono text-emerald-600 dark:text-emerald-400">{confirmRestore}</strong>?
            </p>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300">
              ⚠️ Warning: Restoring will overwrite all current database entries with the contents of this snapshot.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmRestore(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRestore(confirmRestore)}
                disabled={restoringFile === confirmRestore}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2 shadow-lg shadow-amber-600/20"
              >
                {restoringFile === confirmRestore ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                <span>Confirm Restoration</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
