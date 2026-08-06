"use client";

import { useState, useEffect } from "react";
import { Megaphone, Plus, Tag, Image, Trash2, ToggleLeft, ToggleRight, X, Check, Clock, AlertTriangle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountPct: number | null;
  discountAmount: number | null;
  maxDiscount: number | null;
  minOrderAmount: number | null;
  usageLimit: number | null;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  appliesTo: string | null;
  createdAt: string;
}

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState<"coupons" | "banners" | "newsletter">("coupons");
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "",
    description: "",
    discountPct: "",
    discountAmount: "",
    maxDiscount: "",
    minOrderAmount: "",
    usageLimit: "",
    validFrom: "",
    validUntil: "",
    appliesTo: "",
  });

  useEffect(() => {
    if (activeTab === "coupons") loadCoupons();
  }, [activeTab]);

  async function loadCoupons() {
    try {
      const data = await apiFetch<{ coupons: Coupon[] }>("/coupons");
      setCoupons(data.coupons);
    } catch {
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({ code: "", description: "", discountPct: "", discountAmount: "", maxDiscount: "", minOrderAmount: "", usageLimit: "", validFrom: "", validUntil: "", appliesTo: "" });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(coupon: Coupon) {
    setForm({
      code: coupon.code,
      description: coupon.description || "",
      discountPct: coupon.discountPct?.toString() || "",
      discountAmount: coupon.discountAmount?.toString() || "",
      maxDiscount: coupon.maxDiscount?.toString() || "",
      minOrderAmount: coupon.minOrderAmount?.toString() || "",
      usageLimit: coupon.usageLimit?.toString() || "",
      validFrom: coupon.validFrom.split("T")[0],
      validUntil: coupon.validUntil.split("T")[0],
      appliesTo: coupon.appliesTo || "",
    });
    setEditingId(coupon.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code || !form.validFrom || !form.validUntil) {
      toast.error("Code, start date, and end date are required");
      return;
    }
    if (!form.discountPct && !form.discountAmount) {
      toast.error("Either discount percentage or fixed amount is required");
      return;
    }

    try {
      const body: any = {
        code: form.code,
        description: form.description || undefined,
        validFrom: form.validFrom,
        validUntil: form.validUntil,
        appliesTo: form.appliesTo || undefined,
      };
      if (form.discountPct) body.discountPct = Number(form.discountPct);
      if (form.discountAmount) body.discountAmount = Number(form.discountAmount);
      if (form.maxDiscount) body.maxDiscount = Number(form.maxDiscount);
      if (form.minOrderAmount) body.minOrderAmount = Number(form.minOrderAmount);
      if (form.usageLimit) body.usageLimit = Number(form.usageLimit);

      if (editingId) {
        await apiFetch(`/coupons/${editingId}`, { method: "PUT", body: JSON.stringify(body) });
        toast.success("Coupon updated");
      } else {
        await apiFetch("/coupons", { method: "POST", body: JSON.stringify(body) });
        toast.success("Coupon created");
      }
      resetForm();
      loadCoupons();
    } catch (err: any) {
      toast.error(err.message || "Failed to save coupon");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this coupon?")) return;
    try {
      await apiFetch(`/coupons/${id}`, { method: "DELETE" });
      toast.success("Coupon deleted");
      loadCoupons();
    } catch {
      toast.error("Failed to delete coupon");
    }
  }

  async function handleToggle(id: string) {
    try {
      await apiFetch(`/coupons/${id}/toggle`, { method: "PATCH" });
      toast.success("Coupon status updated");
      loadCoupons();
    } catch {
      toast.error("Failed to toggle coupon");
    }
  }

  function getCouponStatus(coupon: Coupon) {
    const now = new Date();
    if (!coupon.isActive) return { label: "Inactive", color: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400" };
    if (now < new Date(coupon.validFrom)) return { label: "Scheduled", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" };
    if (now > new Date(coupon.validUntil)) return { label: "Expired", color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" };
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return { label: "Limit Reached", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" };
    return { label: "Active", color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" };
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Marketing</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Manage coupons, banners, and promotions</p>
      </div>

      <div className="flex gap-2 mb-6">
        {(["coupons", "banners", "newsletter"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${activeTab === tab ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"}`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === "coupons" && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => { resetForm(); setShowForm(true); }}
              className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-emerald-700 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Create Coupon
            </button>
          </div>

          {showForm && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 dark:text-slate-100">{editingId ? "Edit Coupon" : "New Coupon"}</h3>
                <button onClick={resetForm} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Code *</label>
                    <input placeholder="e.g. SUMMER20" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                      className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm font-mono bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" required />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Discount %</label>
                    <input type="number" min="0" max="100" step="0.5" placeholder="e.g. 20" value={form.discountPct} onChange={(e) => setForm({ ...form, discountPct: e.target.value, discountAmount: "" })}
                      className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Fixed Amount (GHS)</label>
                    <input type="number" min="0" step="0.01" placeholder="e.g. 50" value={form.discountAmount} onChange={(e) => setForm({ ...form, discountAmount: e.target.value, discountPct: "" })}
                      className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Max Discount (GHS)</label>
                    <input type="number" min="0" step="0.01" placeholder="Cap for % discounts" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                      className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Min Order (GHS)</label>
                    <input type="number" min="0" step="0.01" placeholder="Minimum cart value" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                      className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Usage Limit</label>
                    <input type="number" min="1" placeholder="Unlimited if empty" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                      className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Valid From *</label>
                    <input type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                      className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" required />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Valid Until *</label>
                    <input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                      className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" required />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Applies To</label>
                    <select value={form.appliesTo} onChange={(e) => setForm({ ...form, appliesTo: e.target.value })}
                      className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none">
                      <option value="">All Products</option>
                      <option value="prescription">Prescription Only</option>
                      <option value="otc">OTC Only</option>
                      <option value="diabetic">Diabetic Care</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Description</label>
                  <input placeholder="Optional description for internal reference" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-emerald-700 flex items-center gap-2">
                    <Check className="h-4 w-4" /> {editingId ? "Update Coupon" : "Create Coupon"}
                  </button>
                  <button type="button" onClick={resetForm} className="px-6 py-2.5 rounded-xl font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl h-20 animate-pulse" />)}
            </div>
          ) : coupons.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-12 text-center">
              <Tag className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 mb-4">No coupons yet. Create your first coupon to start offering discounts.</p>
              <button onClick={() => setShowForm(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-emerald-700 inline-flex items-center gap-2">
                <Plus className="h-4 w-4" /> Create Coupon
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {coupons.map((coupon) => {
                const status = getCouponStatus(coupon);
                return (
                  <div key={coupon.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 flex items-center gap-4">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3">
                      <Tag className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{coupon.code}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${status.color}`}>{status.label}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <span>{coupon.discountPct ? `${coupon.discountPct}% off` : `GHS ${coupon.discountAmount} off`}</span>
                        {coupon.maxDiscount && <span>Max: GHS {coupon.maxDiscount}</span>}
                        {coupon.minOrderAmount && <span>Min: GHS {coupon.minOrderAmount}</span>}
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(coupon.validFrom).toLocaleDateString()} – {new Date(coupon.validUntil).toLocaleDateString()}</span>
                        <span>{coupon.usedCount}{coupon.usageLimit ? `/${coupon.usageLimit}` : ""} used</span>
                      </div>
                      {coupon.description && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{coupon.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => handleToggle(coupon.id)} title={coupon.isActive ? "Deactivate" : "Activate"}
                        className={`p-2 rounded-xl transition-colors ${coupon.isActive ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"}`}>
                        {coupon.isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                      </button>
                      <button onClick={() => startEdit(coupon)} title="Edit"
                        className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(coupon.id)} title="Delete"
                        className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "banners" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-12 text-center">
          <Image className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">Banner management coming soon</p>
        </div>
      )}

      {activeTab === "newsletter" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-12 text-center">
          <Megaphone className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">Newsletter management coming soon</p>
        </div>
      )}
    </div>
  );
}
