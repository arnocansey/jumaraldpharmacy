"use client";

import { useState, useEffect } from "react";
import { Plus, MapPin, Phone, Users, Package, Edit, Trash2, Building2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email?: string;
  isActive: boolean;
  isWarehouse: boolean;
  _count: { staff: number; inventory: number; orders: number };
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", city: "", state: "", phone: "", email: "" });

  useEffect(() => { loadBranches(); }, []);

  async function loadBranches() {
    try {
      const data = await apiFetch<{ branches: Branch[] }>("/branches");
      setBranches(data.branches);
    } catch { toast.error("Failed to load branches"); }
    finally { setLoading(false); }
  }

  async function createBranch(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch("/branches", { method: "POST", body: JSON.stringify(form) });
      toast.success("Branch created");
      setShowForm(false);
      setForm({ name: "", address: "", city: "", state: "", phone: "", email: "" });
      loadBranches();
    } catch { toast.error("Failed to create branch"); }
  }

  async function deleteBranch(id: string) {
    if (!confirm("Deactivate this branch?")) return;
    try {
      await apiFetch(`/branches/${id}`, { method: "DELETE" });
      toast.success("Branch deactivated");
      loadBranches();
    } catch { toast.error("Failed to deactivate branch"); }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Branch Management</h1>
          <p className="text-slate-500 text-sm">{branches.filter((b) => b.isActive).length} active branches</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-emerald-700 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Branch
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
          <h3 className="font-bold text-slate-800 mb-4">New Branch</h3>
          <form onSubmit={createBranch} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Branch Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500" required />
            <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500" required />
            <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500" required />
            <input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500" required />
            <input placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500" required />
            <input placeholder="Email (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-emerald-700">Create Branch</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 rounded-xl font-semibold bg-slate-100 hover:bg-slate-200">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map((i) => <div key={i} className="bg-white rounded-2xl p-6 animate-pulse"><div className="h-6 bg-slate-200 rounded w-2/3 mb-4" /><div className="h-4 bg-slate-200 rounded w-full mb-2" /></div>)
        ) : (
          branches.map((branch) => (
            <div key={branch.id} className={`bg-white rounded-2xl border p-6 ${branch.isActive ? "border-slate-100" : "border-red-200 opacity-60"}`}>
              <div className="flex items-start justify-between mb-3">
                <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold">{branch.code}</span>
                <div className="flex gap-1">
                  {branch.isWarehouse && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">Warehouse</span>}
                  {!branch.isActive && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">Inactive</span>}
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{branch.name}</h3>
              <div className="space-y-1 text-sm text-slate-600 mb-4">
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-emerald-500" /><span>{branch.address}, {branch.city}</span></div>
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-emerald-500" /><span>{branch.phone}</span></div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-slate-50 rounded-lg p-2 text-center"><p className="font-bold text-emerald-600">{branch._count.staff}</p><p className="text-xs text-slate-400">Staff</p></div>
                <div className="bg-slate-50 rounded-lg p-2 text-center"><p className="font-bold text-emerald-600">{branch._count.inventory}</p><p className="text-xs text-slate-400">Products</p></div>
                <div className="bg-slate-50 rounded-lg p-2 text-center"><p className="font-bold text-emerald-600">{branch._count.orders}</p><p className="text-xs text-slate-400">Orders</p></div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 bg-slate-50 text-slate-700 py-2 rounded-xl text-sm font-semibold hover:bg-slate-100 flex items-center justify-center gap-1"><Edit className="h-3 w-3" /> Edit</button>
                <button onClick={() => deleteBranch(branch.id)} className="bg-red-50 text-red-600 py-2 px-3 rounded-xl text-sm font-semibold hover:bg-red-100"><Trash2 className="h-3 w-3" /></button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
