"use client";

import { useState, useEffect } from "react";
import { Search, Package, CheckCircle, XCircle, Clock, Eye, MessageSquare } from "lucide-react";
import { apiFetch } from "@/lib/api";
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
  SUBMITTED: { color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400", icon: Clock },
  UNDER_REVIEW: { color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400", icon: Eye },
  APPROVED: { color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400", icon: CheckCircle },
  REJECTED: { color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400", icon: XCircle },
  CLARIFICATION_NEEDED: { color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400", icon: MessageSquare },
};

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Prescription | null>(null);
  const [note, setNote] = useState("");

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

  const filtered = prescriptions.filter((p) => !statusFilter || p.status === statusFilter);

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Prescription Queue</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Review and manage customer prescriptions</p>
      </div>

      <div className="flex gap-2 mb-4">
        {["", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "CLARIFICATION_NEEDED"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === s ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"}`}>
            {s ? s.replace(/_/g, " ") : "All"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [1, 2, 3].map((i) => <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 animate-pulse"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3" /><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" /></div>)
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400 dark:text-slate-500">No prescriptions found</div>
        ) : (
          filtered.map((p) => {
            const config = STATUS_CONFIG[p.status] || STATUS_CONFIG.SUBMITTED;
            const Icon = config.icon;
            return (
              <div key={p.id} onClick={() => { setSelected(p); setNote(""); }}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 hover:shadow-lg transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${config.color}`}>
                    <Icon className="h-3 w-3" /> {p.status.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1">{p.user.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{p.user.email}</p>
                {p.patientNotes && <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 mb-2">&ldquo;{p.patientNotes}&rdquo;</p>}
                {p.doctorName && <p className="text-xs text-slate-500 dark:text-slate-400">Doctor: {p.doctorName}</p>}
                {p.pharmacistNote && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg">{p.pharmacistNote}</p>}
              </div>
            );
          })
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Prescription Review</h2>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-2xl">&times;</button>
            </div>
            <div className="space-y-4 mb-6">
              <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4">
                <img src={selected.documentUrl} alt="Prescription" className="w-full rounded-lg" />
              </div>
              <div><p className="text-xs text-slate-500 dark:text-slate-400">Patient</p><p className="font-semibold text-slate-800 dark:text-slate-200">{selected.user.name}</p></div>
              {selected.patientNotes && <div><p className="text-xs text-slate-500 dark:text-slate-400">Notes</p><p className="text-sm text-slate-700 dark:text-slate-300">{selected.patientNotes}</p></div>}
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Pharmacist Notes</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add notes..."
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500" rows={3} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => updateStatus(selected.id, "APPROVED")} className="flex-1 bg-green-600 text-white py-2.5 rounded-xl font-semibold hover:bg-green-700 flex items-center justify-center gap-2"><CheckCircle className="h-4 w-4" /> Approve</button>
              <button onClick={() => updateStatus(selected.id, "REJECTED")} className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-semibold hover:bg-red-700 flex items-center justify-center gap-2"><XCircle className="h-4 w-4" /> Reject</button>
              <button onClick={() => updateStatus(selected.id, "CLARIFICATION_NEEDED")} className="flex-1 bg-amber-600 text-white py-2.5 rounded-xl font-semibold hover:bg-amber-700 flex items-center justify-center gap-2"><MessageSquare className="h-4 w-4" /> Clarify</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
