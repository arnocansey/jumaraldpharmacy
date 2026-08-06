"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Eye, Package, AlertTriangle, CheckCircle, XCircle, X, Tag, Upload } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import ProductImportModal from "@/components/ProductImportModal";

interface Product {
  id: string; name: string; slug: string; sku: string; price: number; compareAtPrice?: number;
  stockQuantity: number; minStockAlert: number; requiresPrescription: boolean; isActive: boolean;
  isFeatured: boolean; images: string[]; description: string; dosageForm?: string; strength?: string;
  activeIngredients?: string; usageInstructions?: string; sideEffects?: string; warnings?: string;
  manufacturer?: string; category: { id: string; name: string; slug: string }; brand?: { id: string; name: string };
  createdAt: string;
}

interface Category { id: string; name: string; slug: string; description?: string; _count?: { products: number } }

const EMPTY_FORM = {
  name: "", sku: "", description: "", price: "", compareAtPrice: "", stockQuantity: "0",
  minStockAlert: "10", requiresPrescription: false, isFeatured: false, dosageForm: "",
  strength: "", activeIngredients: "", usageInstructions: "", sideEffects: "", warnings: "",
  manufacturer: "", categoryId: "", newCategoryName: "", brandName: "", images: "" as string,
};

function StockBadge({ quantity, minAlert }: { quantity: number; minAlert: number }) {
  if (quantity === 0) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"><XCircle className="h-3 w-3" /> Out of Stock</span>;
  if (quantity <= minAlert) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"><AlertTriangle className="h-3 w-3" /> Low ({quantity})</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"><CheckCircle className="h-3 w-3" /> In Stock ({quantity})</span>;
}

export default function ProductsPage() {
  const [tab, setTab] = useState<"products" | "categories">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [showImport, setShowImport] = useState(false);

  // Category management state
  const [showCatForm, setShowCatForm] = useState(false);
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catSaving, setCatSaving] = useState(false);

  useEffect(() => { loadProducts(); }, [page, search]);
  useEffect(() => { loadCategories(); }, []);

  async function loadCategories() {
    try {
      const data = await apiFetch<any>("/products/categories");
      setCategories(Array.isArray(data) ? data : data.categories || []);
    } catch { toast.error("Failed to load categories"); }
  }

  async function loadProducts() {
    try {
      const data = await apiFetch<{ products: Product[]; pagination: { total: number; pages: number } }>(
        `/products?page=${page}&limit=20${search ? `&search=${search}` : ""}`
      );
      setProducts(data.products);
      setTotalPages(data.pagination.pages);
    } catch { toast.error("Failed to load products"); }
    finally { setLoading(false); }
  }

  function resetForm() { setForm(EMPTY_FORM); setEditingId(null); setShowForm(false); }

  function startEdit(p: Product) {
    setForm({
      name: p.name, sku: p.sku, description: p.description, price: p.price.toString(),
      compareAtPrice: p.compareAtPrice?.toString() || "", stockQuantity: p.stockQuantity.toString(),
      minStockAlert: p.minStockAlert.toString(), requiresPrescription: p.requiresPrescription,
      isFeatured: p.isFeatured, dosageForm: p.dosageForm || "", strength: p.strength || "",
      activeIngredients: p.activeIngredients || "", usageInstructions: p.usageInstructions || "",
      sideEffects: p.sideEffects || "", warnings: p.warnings || "", manufacturer: p.manufacturer || "",
      categoryId: p.category?.id || "", newCategoryName: "", brandName: p.brand?.name || "",
      images: p.images?.join(", ") || "",
    });
    setEditingId(p.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.sku || !form.description || !form.price) {
      toast.error("Name, SKU, description, and price are required"); return;
    }
    setSaving(true);
    try {
      const body: any = {
        name: form.name, sku: form.sku, description: form.description, price: Number(form.price),
        stockQuantity: Number(form.stockQuantity), minStockAlert: Number(form.minStockAlert),
        requiresPrescription: form.requiresPrescription, isFeatured: form.isFeatured,
      };
      if (form.compareAtPrice) body.compareAtPrice = Number(form.compareAtPrice);
      if (form.dosageForm) body.dosageForm = form.dosageForm;
      if (form.strength) body.strength = form.strength;
      if (form.activeIngredients) body.activeIngredients = form.activeIngredients;
      if (form.usageInstructions) body.usageInstructions = form.usageInstructions;
      if (form.sideEffects) body.sideEffects = form.sideEffects;
      if (form.warnings) body.warnings = form.warnings;
      if (form.manufacturer) body.manufacturer = form.manufacturer;
      if (form.images) body.images = form.images.split(",").map((s: string) => s.trim()).filter(Boolean);
      if (form.categoryId) body.categoryId = form.categoryId;
      else if (form.newCategoryName) body.newCategoryName = form.newCategoryName;

      if (editingId) {
        await apiFetch(`/products/${editingId}`, { method: "PATCH", body: JSON.stringify(body) });
        toast.success("Product updated");
      } else {
        await apiFetch("/products", { method: "POST", body: JSON.stringify(body) });
        toast.success("Product created");
      }
      resetForm();
      loadProducts();
    } catch (err: any) {
      toast.error(err.message || "Failed to save product");
    } finally { setSaving(false); }
  }

  async function deleteProduct(id: string) {
    if (!confirm("Delete this product?")) return;
    try { await apiFetch(`/products/${id}`, { method: "DELETE" }); toast.success("Product deleted"); loadProducts(); }
    catch { toast.error("Failed to delete product"); }
  }

  // Category CRUD
  function resetCatForm() { setCatName(""); setCatDesc(""); setEditCatId(null); setShowCatForm(false); }

  function startEditCat(c: Category) {
    setCatName(c.name); setCatDesc(c.description || ""); setEditCatId(c.id); setShowCatForm(true);
  }

  async function handleCatSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!catName.trim()) { toast.error("Category name is required"); return; }
    setCatSaving(true);
    try {
      if (editCatId) {
        await apiFetch(`/products/categories/${editCatId}`, {
          method: "PUT", body: JSON.stringify({ name: catName.trim(), description: catDesc.trim() || undefined }),
        });
        toast.success("Category updated");
      } else {
        await apiFetch("/products/categories", {
          method: "POST", body: JSON.stringify({ name: catName.trim(), description: catDesc.trim() || undefined }),
        });
        toast.success("Category created");
      }
      resetCatForm();
      loadCategories();
    } catch (err: any) { toast.error(err.message || "Failed to save category"); }
    finally { setCatSaving(false); }
  }

  async function deleteCategory(id: string, name: string, productCount: number) {
    if (productCount > 0) { toast.error(`Cannot delete "${name}" — it has ${productCount} product(s). Reassign them first.`); return; }
    if (!confirm(`Delete category "${name}"?`)) return;
    try { await apiFetch(`/products/categories/${id}`, { method: "DELETE" }); toast.success("Category deleted"); loadCategories(); }
    catch { toast.error("Failed to delete category"); }
  }

  const inputClass = "w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none";
  const labelClass = "text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block";

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Product & Inventory</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {tab === "products" ? `${products.length} products` : `${categories.length} categories`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {tab === "products" && (
            <button
              onClick={() => setShowImport(true)}
              className="px-4 py-2 rounded-xl font-semibold border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 flex items-center gap-2"
            >
              <Upload className="h-4 w-4" /> Import CSV
            </button>
          )}
          <button onClick={() => tab === "products" ? (resetForm(), setShowForm(true)) : (resetCatForm(), setShowCatForm(true))}
            className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-emerald-700 flex items-center gap-2">
            <Plus className="h-4 w-4" /> {tab === "products" ? "Add Product" : "Add Category"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 mb-6 w-fit">
        <button onClick={() => setTab("products")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${tab === "products" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`}>
          <Package className="h-4 w-4" /> Products
        </button>
        <button onClick={() => setTab("categories")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${tab === "categories" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`}>
          <Tag className="h-4 w-4" /> Categories
        </button>
      </div>

      {/* ========== PRODUCT FORM MODAL ========== */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={resetForm} />
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-3xl mx-4">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{editingId ? "Edit Product" : "Add New Product"}</h2>
              <button onClick={resetForm} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className={labelClass}>Product Name *</label>
                  <input placeholder="e.g. Amoxicillin 500mg Capsules" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>SKU *</label>
                  <input placeholder="e.g. AMX-500-CAP" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className={`${inputClass} font-mono`} required />
                </div>
                <div>
                  <label className={labelClass}>Manufacturer</label>
                  <input placeholder="e.g. GSK Pharmaceuticals" value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Description *</label>
                <textarea rows={3} placeholder="Full product description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputClass} resize-none`} required />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className={labelClass}>Price (GHS) *</label>
                  <input type="number" min="0" step="0.01" placeholder="0.00" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>Compare At Price (GHS)</label>
                  <input type="number" min="0" step="0.01" placeholder="Original price" value={form.compareAtPrice} onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Stock Quantity</label>
                  <input type="number" min="0" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Min Stock Alert</label>
                  <input type="number" min="0" value={form.minStockAlert} onChange={(e) => setForm({ ...form, minStockAlert: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Category</label>
                  <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value, newCategoryName: "" })} className={inputClass}>
                    <option value="">Select category</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Or Create New Category</label>
                  <input placeholder="New category name" value={form.newCategoryName} onChange={(e) => setForm({ ...form, newCategoryName: e.target.value, categoryId: "" })} className={inputClass} disabled={!!form.categoryId} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Dosage Form</label>
                  <select value={form.dosageForm} onChange={(e) => setForm({ ...form, dosageForm: e.target.value })} className={inputClass}>
                    <option value="">Select form</option>
                    {["Tablet","Capsule","Syrup","Suspension","Injection","Cream","Ointment","Drops","Inhaler","Suppository","Patch","Gel","Solution","Powder","Other"].map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Strength</label>
                  <input placeholder="e.g. 500mg" value={form.strength} onChange={(e) => setForm({ ...form, strength: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Active Ingredients</label>
                  <input placeholder="e.g. Amoxicillin trihydrate" value={form.activeIngredients} onChange={(e) => setForm({ ...form, activeIngredients: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Usage Instructions</label>
                  <textarea rows={2} placeholder="Dosage and administration..." value={form.usageInstructions} onChange={(e) => setForm({ ...form, usageInstructions: e.target.value })} className={`${inputClass} resize-none`} />
                </div>
                <div>
                  <label className={labelClass}>Side Effects</label>
                  <textarea rows={2} placeholder="Known side effects..." value={form.sideEffects} onChange={(e) => setForm({ ...form, sideEffects: e.target.value })} className={`${inputClass} resize-none`} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Warnings & Contraindications</label>
                <textarea rows={2} placeholder="Important warnings..." value={form.warnings} onChange={(e) => setForm({ ...form, warnings: e.target.value })} className={`${inputClass} resize-none`} />
              </div>
              <div>
                <label className={labelClass}>Image URLs (comma separated)</label>
                <input placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg" value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} className={inputClass} />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.requiresPrescription} onChange={(e) => setForm({ ...form, requiresPrescription: e.target.checked })} className="h-4 w-4 rounded accent-emerald-600" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Prescription Required</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="h-4 w-4 rounded accent-emerald-600" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Featured Product</span>
                </label>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button type="submit" disabled={saving}
                  className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2">
                  {saving ? "Saving..." : editingId ? "Update Product" : "Create Product"}
                </button>
                <button type="button" onClick={resetForm} className="px-6 py-2.5 rounded-xl font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== VIEW PRODUCT MODAL ========== */}
      {viewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setViewProduct(null)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Product Details</h2>
              <button onClick={() => setViewProduct(null)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <div className="space-y-3 text-sm">
              {viewProduct.images[0] && <img src={viewProduct.images[0]} alt={viewProduct.name} className="w-full h-48 object-cover rounded-xl" />}
              <div className="flex items-center gap-2"><span className="font-mono text-xs text-slate-400">{viewProduct.sku}</span>{viewProduct.requiresPrescription && <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-semibold">Rx</span>}</div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{viewProduct.name}</h3>
              {viewProduct.brand && <p className="text-emerald-600 dark:text-emerald-400 font-semibold">{viewProduct.brand.name}</p>}
              <p className="text-slate-500 dark:text-slate-400">{viewProduct.description}</p>
              <div className="flex items-center gap-4 pt-2">
                <span className="text-xl font-bold text-slate-800 dark:text-slate-100">GHS {viewProduct.price.toFixed(2)}</span>
                {viewProduct.compareAtPrice && <span className="text-sm text-slate-400 line-through">GHS {viewProduct.compareAtPrice.toFixed(2)}</span>}
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3"><p className="text-xs text-slate-400">Category</p><p className="font-semibold">{viewProduct.category?.name}</p></div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3"><p className="text-xs text-slate-400">Stock</p><p className="font-semibold">{viewProduct.stockQuantity}</p></div>
                {viewProduct.dosageForm && <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3"><p className="text-xs text-slate-400">Form</p><p className="font-semibold">{viewProduct.dosageForm}</p></div>}
                {viewProduct.strength && <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3"><p className="text-xs text-slate-400">Strength</p><p className="font-semibold">{viewProduct.strength}</p></div>}
              </div>
              {viewProduct.warnings && <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 mt-2"><p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Warnings</p><p className="text-xs text-amber-600 dark:text-amber-300">{viewProduct.warnings}</p></div>}
            </div>
          </div>
        </div>
      )}

      {/* ========== CATEGORY FORM MODAL ========== */}
      {showCatForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={resetCatForm} />
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{editCatId ? "Edit Category" : "Add New Category"}</h2>
              <button onClick={resetCatForm} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCatSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Category Name *</label>
                <input placeholder="e.g. Antibiotics" value={catName} onChange={(e) => setCatName(e.target.value)} className={inputClass} required autoFocus />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea rows={3} placeholder="Optional description..." value={catDesc} onChange={(e) => setCatDesc(e.target.value)} className={`${inputClass} resize-none`} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={catSaving}
                  className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50">
                  {catSaving ? "Saving..." : editCatId ? "Update Category" : "Create Category"}
                </button>
                <button type="button" onClick={resetCatForm} className="px-6 py-2.5 rounded-xl font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== PRODUCTS TAB ========== */}
      {tab === "products" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <Search className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input type="text" placeholder="Search products..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="flex-1 outline-none text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Product</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">SKU</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Price</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Stock</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">Loading...</td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">No products found</td></tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden shrink-0">
                            {product.images[0] ? <img src={product.images[0]} alt="" className="w-full h-full object-cover" /> : <Package className="h-5 w-5 text-slate-300 dark:text-slate-600 m-auto mt-2.5" />}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{product.name}</p>
                            {product.brand && <p className="text-xs text-slate-400 dark:text-slate-500">{product.brand.name}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 font-mono">{product.sku}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{product.category?.name}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">GHS {product.price.toFixed(2)}</p>
                        {product.compareAtPrice && <p className="text-xs text-slate-400 dark:text-slate-500 line-through">GHS {product.compareAtPrice.toFixed(2)}</p>}
                      </td>
                      <td className="px-4 py-3"><StockBadge quantity={product.stockQuantity} minAlert={product.minStockAlert} /></td>
                      <td className="px-4 py-3">
                        {product.requiresPrescription ? <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-semibold">Rx</span> : <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">OTC</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setViewProduct(product)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"><Eye className="h-4 w-4" /></button>
                          <button onClick={() => startEdit(product)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => deleteProduct(product.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 text-slate-700 dark:text-slate-300">Previous</button>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 text-slate-700 dark:text-slate-300">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========== CATEGORIES TAB ========== */}
      {tab === "categories" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Slug</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Description</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Products</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {categories.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">No categories found</td></tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center shrink-0">
                            <Tag className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{cat.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 font-mono">{cat.slug}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 max-w-[200px] truncate">{cat.description || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${(cat._count?.products || 0) > 0 ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"}`}>
                          {cat._count?.products || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => startEditCat(cat)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400" title="Edit"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => deleteCategory(cat.id, cat.name, cat._count?.products || 0)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400" title="Delete"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* ========== IMPORT MODAL ========== */}
      <ProductImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onImported={() => { loadProducts(); loadCategories(); }}
      />
    </div>
  );
}
