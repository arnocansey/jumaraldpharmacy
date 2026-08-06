"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit3, Trash2, Search, AlertTriangle, X, Pill, Loader2, RefreshCw, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { API_URL } from "@/lib/api";

function getAdminToken() {
  try {
    return localStorage.getItem("jumarald_admin_token") || localStorage.getItem("jumarald_token") || "";
  } catch {
    return "";
  }
}

interface Product {
  id: string;
  name: string;
  sku: string;
  stockQuantity: number;
  price: number;
  compareAtPrice?: number;
  requiresPrescription: boolean;
  dosageForm?: string;
  strength?: string;
  manufacturer?: string;
  category?: { id: string; name: string };
  brand?: { id: string; name: string };
}

interface Category { id: string; name: string; }
interface Brand { id: string; name: string; }

const emptyForm = {
  name: "",
  sku: "",
  description: "",
  price: "",
  compareAtPrice: "",
  stockQuantity: "0",
  minStockAlert: "10",
  requiresPrescription: false,
  isFeatured: false,
  dosageForm: "",
  strength: "",
  activeIngredients: "",
  usageInstructions: "",
  sideEffects: "",
  warnings: "",
  manufacturer: "",
  categoryId: "",
  newCategoryName: "",
  isCustomCategory: false,
  brandId: "",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/products?limit=50${search ? `&search=${encodeURIComponent(search)}` : ""}`);
      const data = await res.json();
      setProducts(data.products || []);
    } catch (e) {
      toast.error("Failed to load products from database.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchMeta = async () => {
    try {
      const [catRes, brandRes] = await Promise.all([
        fetch(`${API_URL}/products/categories`),
        fetch(`${API_URL}/products/brands`),
      ]);
      const [cats, brnds] = await Promise.all([catRes.json(), brandRes.json()]);
      setCategories(Array.isArray(cats) ? cats : []);
      setBrands(Array.isArray(brnds) ? brnds : []);
    } catch (e) {
      // silently handle
    }
  };

  useEffect(() => { fetchMeta(); }, []);
  useEffect(() => {
    const timeout = setTimeout(fetchProducts, 400);
    return () => clearTimeout(timeout);
  }, [fetchProducts]);

  const openModal = () => {
    setForm({ ...emptyForm });
    fetchMeta();
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasCategory = form.isCustomCategory ? Boolean(form.newCategoryName.trim()) : Boolean(form.categoryId);
    if (!form.name || !form.sku || !form.description || !form.price || !hasCategory) {
      toast.error("Please fill in all required fields: Name, SKU, Description, Price, and Category.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAdminToken()}`,
        },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
          compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : undefined,
          stockQuantity: parseInt(form.stockQuantity) || 0,
          minStockAlert: parseInt(form.minStockAlert) || 10,
          brandId: form.brandId || undefined,
          newCategoryName: form.isCustomCategory ? form.newCategoryName.trim() : undefined,
          categoryId: form.isCustomCategory ? undefined : form.categoryId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create drug SKU");
      }

      toast.success(`✅ Drug SKU "${data.sku}" created successfully!`);
      setShowModal(false);
      fetchProducts();
      fetchMeta();
    } catch (err: any) {
      toast.error(err.message || "Drug SKU creation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}"?`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getAdminToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Delete failed");
      toast.success(`"${name}" removed from inventory.`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete product.");
    } finally {
      setDeleting(null);
    }
  };

  const setField = (key: keyof typeof emptyForm, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Product & Batch Inventory</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage pharmaceutical stock, SKUs, pricing and prescription rules.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchProducts}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={openModal}
            className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add New Drug SKU
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search drug name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
            <span className="text-sm font-medium">Loading inventory from database...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3 text-slate-400">
            <Package className="h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium">No products found.</p>
            <button onClick={openModal} className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" /> Add the first Drug SKU
            </button>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="p-4">SKU / Drug Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Dosage Form</th>
                <th className="p-4">Prescription</th>
                <th className="p-4">Stock Level</th>
                <th className="p-4">Unit Price</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                    <div className="text-xs font-mono text-slate-400 mt-0.5">{p.sku}</div>
                    {p.manufacturer && <div className="text-[11px] text-slate-400">{p.manufacturer}</div>}
                  </td>
                  <td className="p-4 text-xs text-slate-600">{p.category?.name || "—"}</td>
                  <td className="p-4 text-xs text-slate-600">
                    {p.dosageForm || "—"} {p.strength && <span className="font-semibold">{p.strength}</span>}
                  </td>
                  <td className="p-4">
                    {p.requiresPrescription ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        Rx Required
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">OTC</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`font-bold flex items-center gap-1 text-sm ${p.stockQuantity <= 10 ? "text-red-600" : "text-emerald-700"}`}>
                      {p.stockQuantity <= 10 && <AlertTriangle className="h-3.5 w-3.5" />}
                      {p.stockQuantity} Units
                    </span>
                  </td>
                  <td className="p-4 font-bold text-slate-900 text-sm">
                    {formatCurrency(p.price)}
                    {p.compareAtPrice && (
                      <div className="text-xs text-slate-400 line-through font-normal">{formatCurrency(p.compareAtPrice)}</div>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      disabled={deleting === p.id}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                      title="Delete product"
                    >
                      {deleting === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Drug SKU Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/60 backdrop-blur-sm pt-10 pb-6 px-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-auto border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600">
                  <Pill className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Add New Drug SKU</h2>
                  <p className="text-xs text-slate-500">All fields marked * are required.</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Row: Name & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Drug Name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    placeholder="e.g. Amoxicillin 625mg Capsules"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">SKU Code *</label>
                  <input
                    required
                    value={form.sku}
                    onChange={(e) => setField("sku", e.target.value.toUpperCase())}
                    placeholder="e.g. JUM-AMX-625"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  placeholder="Detailed drug description, usage summary..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Row: Price & Compare Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Sale Price (GHS) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setField("price", e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Compare-at Price (GHS)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.compareAtPrice}
                    onChange={(e) => setField("compareAtPrice", e.target.value)}
                    placeholder="Original price (optional)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Row: Stock & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">Category *</label>
                    <button
                      type="button"
                      onClick={() => setField("isCustomCategory", !form.isCustomCategory)}
                      className="text-[11px] font-bold text-emerald-600 hover:underline"
                    >
                      {form.isCustomCategory ? "← Select Existing" : "+ New Category"}
                    </button>
                  </div>
                  {form.isCustomCategory ? (
                    <input
                      required
                      type="text"
                      value={form.newCategoryName}
                      onChange={(e) => setField("newCategoryName", e.target.value)}
                      placeholder="e.g. Dermatologicals"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  ) : (
                    <select
                      required
                      value={form.categoryId}
                      onChange={(e) => setField("categoryId", e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Brand / Manufacturer</label>
                  <select
                    value={form.brandId}
                    onChange={(e) => setField("brandId", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select Brand (optional)</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row: Stock Qty & Low Stock Alert */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Initial Stock (Units)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stockQuantity}
                    onChange={(e) => setField("stockQuantity", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Low Stock Alert Threshold</label>
                  <input
                    type="number"
                    min="1"
                    value={form.minStockAlert}
                    onChange={(e) => setField("minStockAlert", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Row: Dosage Form, Strength, Manufacturer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Dosage Form</label>
                  <select
                    value={form.dosageForm}
                    onChange={(e) => setField("dosageForm", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select</option>
                    {["Tablet", "Capsule", "Syrup", "Injection", "Cream", "Drops", "Inhaler", "Patch", "Suppository", "Other"].map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Strength</label>
                  <input
                    value={form.strength}
                    onChange={(e) => setField("strength", e.target.value)}
                    placeholder="e.g. 500mg, 10ml"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Manufacturer</label>
                  <input
                    value={form.manufacturer}
                    onChange={(e) => setField("manufacturer", e.target.value)}
                    placeholder="e.g. GlaxoSmithKline"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Active Ingredients */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Active Ingredients</label>
                <input
                  value={form.activeIngredients}
                  onChange={(e) => setField("activeIngredients", e.target.value)}
                  placeholder="e.g. Amoxicillin trihydrate 625mg"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Checkboxes */}
              <div className="flex flex-wrap gap-6 pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.requiresPrescription}
                    onChange={(e) => setField("requiresPrescription", e.target.checked)}
                    className="h-4 w-4 rounded accent-emerald-600"
                  />
                  <span className="text-sm font-semibold text-slate-700">Prescription Required</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => setField("isFeatured", e.target.checked)}
                    className="h-4 w-4 rounded accent-emerald-600"
                  />
                  <span className="text-sm font-semibold text-slate-700">Featured Product</span>
                </label>
              </div>

              {/* Submit */}
              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-colors disabled:opacity-60"
                >
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
                  ) : (
                    <><Plus className="h-4 w-4" /> Create Drug SKU</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
