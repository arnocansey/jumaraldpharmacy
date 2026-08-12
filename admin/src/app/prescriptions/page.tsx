"use client";

import { useState, useEffect } from "react";
import { Search, Package, CheckCircle, XCircle, Clock, Eye, MessageSquare, FileText, ExternalLink, Download, Trash2 } from "lucide-react";
import { apiFetch, API_URL } from "@/lib/api";
import { toast } from "sonner";

interface Prescription {
  id: string;
  documentUrl: string;
  patientNotes?: string;
  pharmacistNote?: string;
  status: string;
  priority: number;
  doctorName?: string;
  createdAt: string;
  user: { name: string; email: string; phone?: string };
}

const STATUS_CONFIG: Record<string, { color: string; icon: any }> = {
  SUBMITTED: { color: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30", icon: Clock },
  UNDER_REVIEW: { color: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30", icon: Eye },
  APPROVED: { color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30", icon: CheckCircle },
  REJECTED: { color: "bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30", icon: XCircle },
  CLARIFICATION_NEEDED: { color: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30", icon: MessageSquare },
};

const getDocumentUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  const backendHost = API_URL.replace("/api/v1", "");
  return `${backendHost}${cleanPath}`;
};

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Prescription | null>(null);
  const [note, setNote] = useState("");
  const [imgError, setImgError] = useState(false);

  useEffect(() => { loadPrescriptions(); }, [statusFilter]);

  async function loadPrescriptions() {
    try {
      const data = await apiFetch<Prescription[]>("/prescriptions/queue");
      setPrescriptions(data);
    } catch { toast.error("Failed to load prescriptions"); }
    finally { setLoading(false); }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await apiFetch(`/prescriptions/${id}/status`, { method: "PUT", body: JSON.stringify({ status, pharmacistNote: note }) });
      toast.success(`Prescription ${status.toLowerCase().replace(/_/g, " ")}`);
      setNote(""); setSelected(null); loadPrescriptions();
    } catch { toast.error("Failed to update prescription"); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to permanently delete this prescription? This will also remove the file from cloud storage. This action cannot be undone.")) return;
    try {
      await apiFetch(`/prescriptions/${id}/admin`, { method: "DELETE" });
      toast.success("Prescription deleted permanently");
      setSelected(null); loadPrescriptions();
    } catch { toast.error("Failed to delete prescription"); }
  }

  const filtered = prescriptions.filter((p) => !statusFilter || p.status === statusFilter);

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Prescription Queue</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Review, verify, and fulfill patient prescription documents</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "CLARIFICATION_NEEDED"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${statusFilter === s ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "glass-panel text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"}`}>
            {s ? s.replace(/_/g, " ") : "All Prescriptions"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          [1, 2, 3].map((i) => <div key={i} className="glass-panel rounded-2xl p-6 animate-pulse"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3" /><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" /></div>)
        ) : filtered.length === 0 ? (
          <div className="col-span-full glass-panel rounded-2xl text-center py-12 text-slate-400 dark:text-slate-500">No prescriptions found in queue</div>
        ) : (
          filtered.map((p) => {
            const config = STATUS_CONFIG[p.status] || STATUS_CONFIG.SUBMITTED;
            const Icon = config.icon;
            return (
              <div key={p.id} onClick={() => { setSelected(p); setNote(""); setImgError(false); }}
                className="glass-panel glass-panel-hover rounded-2xl p-5 cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.color}`}>
                    <Icon className="h-3.5 w-3.5" /> {p.status.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base mb-0.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{p.user.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{p.user.email} &middot; {p.user.phone || "No phone"}</p>
                
                {p.patientNotes && <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-3 bg-white/40 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50">&ldquo;{p.patientNotes}&rdquo;</p>}
                {p.doctorName && <p className="text-xs text-slate-500 dark:text-slate-400">Prescribing Doctor: <span className="font-medium text-slate-700 dark:text-slate-300">{p.doctorName}</span></p>}
                {p.pharmacistNote && <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-2 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">{p.pharmacistNote}</p>}
              </div>
            );
          })
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div onClick={(e) => e.stopPropagation()} className="glass-panel border border-emerald-500/30 rounded-3xl max-w-xl w-full p-6 max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Prescription Review</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Patient: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{selected.user.name}</span></p>
              </div>
              <button onClick={() => setSelected(null)} className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition-colors">&times;</button>
            </div>

            <div className="space-y-4 mb-6">
              {/* Document Display Area */}
              {(() => {
                const docUrl = getDocumentUrl(selected.documentUrl);
                return (
                  <div className="relative bg-slate-900/5 dark:bg-slate-900/60 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800/80 min-h-[220px] flex items-center justify-center">
                    {!imgError && docUrl ? (
                      <div className="relative w-full text-center group">
                        <img
                          src={docUrl}
                          alt="Prescription Document"
                          className="max-h-[360px] w-auto mx-auto object-contain rounded-xl shadow-md"
                          onError={() => setImgError(true)}
                        />
                        <a
                          href={docUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl backdrop-blur-md shadow-md transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-emerald-400" /> Open High-Res Document
                        </a>
                      </div>
                    ) : (
                      <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border-2 border-dashed border-emerald-300 dark:border-emerald-700/60 rounded-2xl p-6 text-center w-full">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-3 shadow-inner">
                          <FileText className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">Prescription File Attached</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 break-all max-w-sm mx-auto">{selected.documentUrl || "Uploaded prescription document"}</p>
                        {docUrl && (
                          <a
                            href={docUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-lg shadow-emerald-600/20"
                          >
                            <ExternalLink className="h-4 w-4" /> View Original Document File
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white/50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                  <p className="text-slate-400">Patient Email</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{selected.user.email}</p>
                </div>
                <div className="bg-white/50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                  <p className="text-slate-400">Phone</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{selected.user.phone || "Not provided"}</p>
                </div>
              </div>

              {selected.patientNotes && (
                <div>
                  <p className="text-xs text-slate-400 block mb-1">Patient Instructions / Notes</p>
                  <div className="bg-white/50 dark:bg-slate-900/40 p-3 rounded-xl text-xs text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-800/50">
                    {selected.patientNotes}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Superintendent Pharmacist Notes</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Enter dosage verification notes, substitution directives, or clarification message..."
                  className="w-full border border-emerald-500/20 dark:border-emerald-500/30 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-emerald-500 bg-white/80 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 backdrop-blur-md"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => updateStatus(selected.id, "APPROVED")} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-bold hover:bg-emerald-700 flex items-center justify-center gap-2 text-xs shadow-lg shadow-emerald-600/20 transition-all"><CheckCircle className="h-4 w-4" /> Approve</button>
              <button onClick={() => updateStatus(selected.id, "REJECTED")} className="flex-1 bg-rose-600 text-white py-2.5 rounded-xl font-bold hover:bg-rose-700 flex items-center justify-center gap-2 text-xs shadow-lg shadow-rose-600/20 transition-all"><XCircle className="h-4 w-4" /> Reject</button>
              <button onClick={() => updateStatus(selected.id, "CLARIFICATION_NEEDED")} className="flex-1 bg-amber-600 text-white py-2.5 rounded-xl font-bold hover:bg-amber-700 flex items-center justify-center gap-2 text-xs shadow-lg shadow-amber-600/20 transition-all"><MessageSquare className="h-4 w-4" /> Clarify</button>
            </div>
            <button onClick={() => handleDelete(selected.id)} className="w-full mt-3 bg-slate-100 dark:bg-slate-900/60 text-red-600 dark:text-red-400 py-2 rounded-xl font-semibold hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center gap-2 text-xs border border-red-200 dark:border-red-800/40 transition-all"><Trash2 className="h-3.5 w-3.5" /> Delete Prescription Permanently</button>
          </div>
        </div>
      )}
    </div>
  );
}
