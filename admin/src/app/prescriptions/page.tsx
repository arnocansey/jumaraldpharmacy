"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, Eye, RefreshCw, Loader2, FileText, Search } from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "@/lib/api";
function getToken() {
  try { return localStorage.getItem("jumarald_admin_token") || localStorage.getItem("jumarald_token") || ""; }
  catch { return ""; }
}

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "bg-amber-50 text-amber-700 border border-amber-200",
  UNDER_REVIEW: "bg-blue-50 text-blue-700 border border-blue-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  REJECTED: "bg-red-50 text-red-700 border border-red-200",
  CLARIFICATION_NEEDED: "bg-purple-50 text-purple-700 border border-purple-200",
};

interface Rx {
  id: string;
  status: string;
  documentUrl: string;
  patientNotes?: string;
  pharmacistNote?: string;
  createdAt: string;
  user?: { name: string; email: string; phone?: string };
}

export default function PharmacistPrescriptionsPage() {
  const [queue, setQueue] = useState<Rx[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [noteModal, setNoteModal] = useState<{ id: string; note: string } | null>(null);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/prescriptions/queue`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Unauthorized");
      const data = await res.json();
      setQueue(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast.error("Failed to load prescription queue");
      setQueue([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  const handleAction = async (id: string, status: "APPROVED" | "REJECTED" | "CLARIFICATION_NEEDED", pharmacistNote?: string) => {
    setActioningId(id);
    try {
      const res = await fetch(`${API_URL}/prescriptions/${id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ status, pharmacistNote: pharmacistNote || "" }),
      });
      if (!res.ok) throw new Error("Failed to update prescription");
      setQueue((prev) => prev.map((rx) => (rx.id === id ? { ...rx, status, pharmacistNote } : rx)));
      toast.success(`Prescription ${status.toLowerCase()} successfully`);
      setNoteModal(null);
    } catch (e: any) {
      toast.error(e.message || "Action failed");
    } finally {
      setActioningId(null);
    }
  };

  const filtered = queue.filter((rx) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return rx.user?.name.toLowerCase().includes(q) || rx.user?.email.toLowerCase().includes(q) || rx.id.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Pharmacist Verification Queue</h1>
          <p className="text-xs text-slate-500 mt-0.5">Review and approve or reject patient prescriptions before order dispatch.</p>
        </div>
        <button onClick={fetchQueue} className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors" title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search patient name or Rx ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
            <span className="text-sm font-medium">Loading prescription queue...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3 text-slate-400">
            <FileText className="h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium">{search ? "No prescriptions match your search." : "No prescriptions in the queue."}</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="p-4">Rx ID / Patient</th>
                <th className="p-4">Submitted</th>
                <th className="p-4">Patient Notes</th>
                <th className="p-4">Pharmacist Note</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((rx) => (
                <tr key={rx.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4">
                    <div className="font-extrabold text-slate-900 text-xs font-mono">{rx.id.slice(0, 8).toUpperCase()}</div>
                    <div className="text-xs font-semibold text-slate-700 mt-0.5">{rx.user?.name || "Unknown"}</div>
                    <div className="text-[11px] text-slate-400">{rx.user?.email}</div>
                    {rx.user?.phone && <div className="text-[11px] text-slate-400">{rx.user.phone}</div>}
                  </td>
                  <td className="p-4 text-xs text-slate-500">
                    {new Date(rx.createdAt).toLocaleDateString("en-GH", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="p-4 text-xs text-slate-600 max-w-[180px]">
                    <span className="line-clamp-2">{rx.patientNotes || "—"}</span>
                  </td>
                  <td className="p-4 text-xs text-slate-600 max-w-[160px]">
                    <span className="line-clamp-2 italic">{rx.pharmacistNote || "—"}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[rx.status] || "bg-slate-100 text-slate-500"}`}>
                      {rx.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      {rx.documentUrl && (
                        <a
                          href={rx.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                          title="View Document"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                      )}
                      {actioningId === rx.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                      ) : (
                        <>
                          <button
                            onClick={() => setNoteModal({ id: rx.id, note: "" })}
                            disabled={rx.status === "APPROVED" || rx.status === "REJECTED"}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold inline-flex items-center gap-1 border border-emerald-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleAction(rx.id, "REJECTED")}
                            disabled={rx.status === "APPROVED" || rx.status === "REJECTED"}
                            className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold inline-flex items-center gap-1 border border-red-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Approve with Note Modal */}
      {noteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-slate-200">
            <h3 className="text-lg font-extrabold text-slate-900">Add Pharmacist Note</h3>
            <p className="text-xs text-slate-500">Optionally include a verification note before approving.</p>
            <textarea
              rows={4}
              value={noteModal.note}
              onChange={(e) => setNoteModal({ ...noteModal, note: e.target.value })}
              placeholder="e.g. Verified for Amoxicillin 625mg — Dr. Mensah's signature confirmed."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setNoteModal(null)}
                className="flex-1 h-10 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(noteModal.id, "APPROVED", noteModal.note)}
                className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center gap-2"
              >
                <CheckCircle className="h-4 w-4" /> Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
