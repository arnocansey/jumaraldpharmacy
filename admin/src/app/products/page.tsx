"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Eye, Package, AlertTriangle, CheckCircle, XCircle, X, Tag, Upload, Download, Loader2, Image as ImageIcon, Scan, Barcode, Sparkles, Mic, BookOpen, Layers, Zap, ChevronDown, ChevronUp, FileText, Camera, Building2, Pill } from "lucide-react";
import { apiFetch, apiUpload } from "@/lib/api";
import { toast } from "sonner";
import ProductImportModal from "@/components/ProductImportModal";
import ProductScannerModal, { ScannedProductData } from "@/components/ProductScannerModal";
import ProductUploadHubModal, { UploadPreferenceMode } from "@/components/ProductUploadHubModal";
import ContinuousScannerModal from "@/components/ContinuousScannerModal";
import InvoiceOcrModal from "@/components/InvoiceOcrModal";
import StandardFormularyModal from "@/components/StandardFormularyModal";
import LiveCameraModal from "@/components/LiveCameraModal";
import { STANDARD_FORMULARY, FormularyDrug } from "@/data/standardFormulary";

const POPULAR_MANUFACTURERS = [
  "Ernest Chemists Ltd",
  "Tobinco Pharmaceuticals Ltd",
  "Danadams Pharmaceuticals",
  "Kinapharma Limited",
  "Phyto-Riker (GIHOC) Pharmaceuticals",
  "Entrance Pharmaceuticals & Research Centre",
  "M&G Pharmaceuticals Ltd",
  "Ayrton Drug Manufacturing Ltd",
  "Kama Industries Limited",
  "Letap Pharmaceuticals Ltd",
  "Guaco Pharmaceuticals",
  "Starwin Products Ltd",
  "Pharmanova Ltd",
  "Intravenous Infusions PLC",
  "GlaxoSmithKline (GSK)",
  "Pfizer Inc.",
  "Sanofi",
  "Novartis AG",
  "AstraZeneca",
  "Cipla Limited",
  "Sun Pharmaceutical Industries",
  "Dr. Reddy's Laboratories",
  "Torrent Pharmaceuticals",
  "Lupin Pharmaceuticals",
  "Teva Pharmaceutical Industries",
  "Abbott Laboratories",
  "F. Hoffmann-La Roche Ltd",
  "Bayer AG",
  "Johnson & Johnson",
  "Merck & Co.",
  "Boehringer Ingelheim",
  "Viatris",
  "Aurobindo Pharma",
  "Zydus Lifesciences",
  "Cadila Pharmaceuticals",
  "Mankind Pharma",
  "Emzor Pharmaceuticals",
];

interface Product {
  id: string; name: string; slug: string; sku: string; barcode?: string; price: number; compareAtPrice?: number;
  stockQuantity: number; minStockAlert: number; requiresPrescription: boolean; isActive: boolean;
  isFeatured: boolean; images: string[]; description: string; dosageForm?: string; strength?: string;
  activeIngredients?: string; usageInstructions?: string; sideEffects?: string; warnings?: string;
  manufacturer?: string; category: { id: string; name: string; slug: string }; brand?: { id: string; name: string };
  createdAt: string;
}

interface Category { id: string; name: string; slug: string; description?: string; imageUrl?: string; _count?: { products: number } }

const EMPTY_FORM = {
  name: "", sku: "", barcode: "", description: "", price: "", compareAtPrice: "", stockQuantity: "0",
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // Multi-Preference Upload Hub States
  const [showHub, setShowHub] = useState(false);
  const [showContinuousScan, setShowContinuousScan] = useState(false);
  const [showInvoiceOcr, setShowInvoiceOcr] = useState(false);
  const [showFormulary, setShowFormulary] = useState(false);
  const [formMode, setFormMode] = useState<"quick" | "detailed">("quick");
  const [showClinicalAccordion, setShowClinicalAccordion] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showLiveCamera, setShowLiveCamera] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<"product" | "category">("product");

  // Autocomplete & Suggestions States
  const [nameSuggestions, setNameSuggestions] = useState<FormularyDrug[]>([]);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [mfgSuggestions, setMfgSuggestions] = useState<string[]>([]);
  const [showMfgSuggestions, setShowMfgSuggestions] = useState(false);

  const handleNameChange = (val: string) => {
    setForm((prev) => ({ ...prev, name: val }));
    if (!val || val.trim().length < 2) {
      setNameSuggestions([]);
      setShowNameSuggestions(false);
      return;
    }
    const q = val.toLowerCase().trim();
    const matches = STANDARD_FORMULARY.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.genericName.toLowerCase().includes(q) ||
        d.activeIngredients.toLowerCase().includes(q)
    ).slice(0, 6);
    setNameSuggestions(matches);
    setShowNameSuggestions(matches.length > 0);
  };

  const handleSelectNameSuggestion = (drug: FormularyDrug) => {
    let matchedCatId = "";
    if (drug.category) {
      const found = categories.find(
        (c) =>
          c.name.toLowerCase().includes(drug.category.toLowerCase()) ||
          drug.category.toLowerCase().includes(c.name.toLowerCase())
      );
      if (found) matchedCatId = found.id;
    }

    const cleanName = drug.name.replace(/[^a-zA-Z0-9\s]/g, "").trim().split(/\s+/);
    const prefix = cleanName.slice(0, 2).map((w) => w.slice(0, 3).toUpperCase()).join("-");
    const autoSku = `${prefix || "MED"}-${drug.strength.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    setForm((prev) => ({
      ...prev,
      name: drug.name,
      sku: prev.sku || autoSku,
      dosageForm: drug.dosageForm || prev.dosageForm,
      strength: drug.strength || prev.strength,
      activeIngredients: drug.activeIngredients || prev.activeIngredients,
      manufacturer: drug.manufacturer || prev.manufacturer,
      description: drug.description || prev.description,
      usageInstructions: drug.usageInstructions || prev.usageInstructions,
      sideEffects: drug.sideEffects || prev.sideEffects,
      warnings: drug.warnings || prev.warnings,
      requiresPrescription: drug.requiresPrescription,
      price: prev.price || (drug.typicalPrice ? String(drug.typicalPrice) : ""),
      categoryId: matchedCatId || prev.categoryId,
      newCategoryName: !matchedCatId && drug.category ? drug.category : prev.newCategoryName,
    }));
    setShowNameSuggestions(false);
    toast.success(`Applied template: ${drug.name}`);
  };

  const handleMfgChange = (val: string) => {
    setForm((prev) => ({ ...prev, manufacturer: val }));
    const q = val.toLowerCase().trim();
    if (!q) {
      setMfgSuggestions(POPULAR_MANUFACTURERS.slice(0, 8));
      setShowMfgSuggestions(true);
      return;
    }
    const matches = POPULAR_MANUFACTURERS.filter((m) => m.toLowerCase().includes(q)).slice(0, 8);
    setMfgSuggestions(matches);
    setShowMfgSuggestions(matches.length > 0);
  };

  const handleSelectMfg = (mfg: string) => {
    setForm((prev) => ({ ...prev, manufacturer: mfg }));
    setShowMfgSuggestions(false);
  };

  async function handleImageFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const res = await apiUpload(files[i]);
        if (res.url) {
          uploadedUrls.push(res.url);
        }
      }

      if (uploadedUrls.length > 0) {
        const currentList = form.images
          ? form.images.split(",").map((s) => s.trim()).filter(Boolean)
          : [];
        const updatedList = [...currentList, ...uploadedUrls];
        setForm((prev) => ({ ...prev, images: updatedList.join(", ") }));
        toast.success(`${uploadedUrls.length} image(s) uploaded successfully!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  }

  function removeImage(indexToRemove: number) {
    const currentList = form.images
      ? form.images.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    const updatedList = currentList.filter((_, idx) => idx !== indexToRemove);
    setForm((prev) => ({ ...prev, images: updatedList.join(", ") }));
  }

  // Category management state
  const [showCatForm, setShowCatForm] = useState(false);
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catImageUrl, setCatImageUrl] = useState("");
  const [catSaving, setCatSaving] = useState(false);
  const [uploadingCatImage, setUploadingCatImage] = useState(false);

  async function handleCatImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCatImage(true);
    try {
      const res = await apiUpload(file);
      if (res.url) {
        setCatImageUrl(res.url);
        toast.success("Category image uploaded!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload category image");
    } finally {
      setUploadingCatImage(false);
      e.target.value = "";
    }
  }

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
      name: p.name, sku: p.sku, barcode: p.barcode || "", description: p.description, price: p.price.toString(),
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

  function handleScannedDataApplied(data: ScannedProductData, photoUrl?: string) {
    let matchedCatId = "";
    let suggestedCatName = "";
    if (data.categoryName) {
      const found = categories.find(
        (c) => c.name.toLowerCase() === data.categoryName!.toLowerCase()
      );
      if (found) {
        matchedCatId = found.id;
      } else {
        suggestedCatName = data.categoryName;
      }
    }

    setForm((prev) => {
      let combinedImages = prev.images;
      if (photoUrl) {
        const currentList = prev.images
          ? prev.images.split(",").map((s) => s.trim()).filter(Boolean)
          : [];
        if (!currentList.includes(photoUrl)) {
          combinedImages = [photoUrl, ...currentList].join(", ");
        }
      } else if (data.images && data.images.length > 0) {
        const currentList = prev.images
          ? prev.images.split(",").map((s) => s.trim()).filter(Boolean)
          : [];
        const toAdd = data.images.filter((img) => !currentList.includes(img));
        combinedImages = [...currentList, ...toAdd].join(", ");
      }

      return {
        ...prev,
        name: data.name || prev.name,
        sku: data.sku || prev.sku,
        barcode: data.barcode || prev.barcode,
        description: data.description || prev.description,
        price: data.price ? String(data.price) : prev.price,
        compareAtPrice: data.compareAtPrice ? String(data.compareAtPrice) : prev.compareAtPrice,
        stockQuantity: data.stockQuantity ? String(data.stockQuantity) : prev.stockQuantity,
        minStockAlert: data.minStockAlert ? String(data.minStockAlert) : prev.minStockAlert,
        dosageForm: data.dosageForm || prev.dosageForm,
        strength: data.strength || prev.strength,
        activeIngredients: data.activeIngredients || prev.activeIngredients,
        usageInstructions: data.usageInstructions || prev.usageInstructions,
        sideEffects: data.sideEffects || prev.sideEffects,
        warnings: data.warnings || prev.warnings,
        manufacturer: data.manufacturer || prev.manufacturer,
        requiresPrescription: data.requiresPrescription ?? prev.requiresPrescription,
        categoryId: matchedCatId || prev.categoryId,
        newCategoryName: !matchedCatId && suggestedCatName ? suggestedCatName : prev.newCategoryName,
        images: combinedImages,
      };
    });

    setShowForm(true);
  }

  function startVoiceDictation() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser. You can type or scan instead.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListeningVoice(true);
      toast.info("Listening... Speak medicine name, strength, quantity, or price.");

      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        toast.loading(`Processing voice: "${transcript}"...`);
        try {
          const res = await apiFetch<{ status: string; data: any }>("/products/scan/voice", {
            method: "POST",
            body: JSON.stringify({ transcript }),
          });
          if (res.data) {
            handleScannedDataApplied(res.data);
            toast.success(`Voice parsed: ${res.data.name || transcript}`);
          }
        } catch {
          setForm((prev) => ({ ...prev, name: transcript }));
          toast.success(`Set product name: "${transcript}"`);
        } finally {
          setIsListeningVoice(false);
          toast.dismiss();
        }
      };

      recognition.onerror = () => {
        setIsListeningVoice(false);
      };

      recognition.onend = () => {
        setIsListeningVoice(false);
      };

      recognition.start();
    } catch (err) {
      console.warn("Speech recognition failed to start:", err);
      setIsListeningVoice(false);
    }
  }

  function handleSelectUploadMode(selectedMode: UploadPreferenceMode) {
    if (selectedMode === "quick_form") {
      setFormMode("quick");
      resetForm();
      setShowForm(true);
    } else if (selectedMode === "detailed_form") {
      setFormMode("detailed");
      resetForm();
      setShowForm(true);
    } else if (selectedMode === "continuous_scan") {
      setShowContinuousScan(true);
    } else if (selectedMode === "invoice_ocr") {
      setShowInvoiceOcr(true);
    } else if (selectedMode === "voice_dictation") {
      setFormMode("quick");
      resetForm();
      setShowForm(true);
      setTimeout(() => startVoiceDictation(), 300);
    } else if (selectedMode === "formulary") {
      setShowFormulary(true);
    } else if (selectedMode === "live_camera") {
      setFormMode("quick");
      resetForm();
      setShowForm(true);
      setCameraTarget("product");
      setShowLiveCamera(true);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = form.name.trim();
    const price = Number(form.price);
    if (!name || isNaN(price) || price <= 0) {
      toast.error("Product Name and a valid Price are required");
      return;
    }

    setSaving(true);
    try {
      let sku = form.sku.trim();
      if (!sku) {
        const cleanName = name.replace(/[^a-zA-Z0-9\s]/g, "").trim().split(/\s+/);
        const prefix = cleanName.slice(0, 2).map((w) => w.slice(0, 3).toUpperCase()).join("-");
        sku = `${prefix || "MED"}-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      let description = form.description.trim();
      if (!description) {
        description = `${name}${form.strength ? ` (${form.strength})` : ""}${form.dosageForm ? ` ${form.dosageForm}` : ""}. Quality pharmaceutical formulation.`;
      }

      const body: any = {
        name,
        sku,
        description,
        price,
        stockQuantity: Number(form.stockQuantity) || 0,
        minStockAlert: Number(form.minStockAlert) || 10,
        requiresPrescription: form.requiresPrescription,
        isFeatured: form.isFeatured,
      };
      if (form.barcode) body.barcode = form.barcode;
      if (form.compareAtPrice) body.compareAtPrice = Number(form.compareAtPrice);
      if (form.dosageForm) body.dosageForm = form.dosageForm;
      if (form.strength) body.strength = form.strength;
      if (form.activeIngredients) body.activeIngredients = form.activeIngredients;
      if (form.usageInstructions) body.usageInstructions = form.usageInstructions;
      if (form.sideEffects) body.sideEffects = form.sideEffects;
      if (form.warnings) body.warnings = form.warnings;
      if (form.manufacturer) body.manufacturer = form.manufacturer;
      body.images = form.images ? form.images.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
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
  function resetCatForm() { setCatName(""); setCatDesc(""); setCatImageUrl(""); setEditCatId(null); setShowCatForm(false); }

  function startEditCat(c: Category) {
    setCatName(c.name); setCatDesc(c.description || ""); setCatImageUrl(c.imageUrl || ""); setEditCatId(c.id); setShowCatForm(true);
  }

  async function handleCatSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!catName.trim()) { toast.error("Category name is required"); return; }
    setCatSaving(true);
    try {
      if (editCatId) {
        await apiFetch(`/products/categories/${editCatId}`, {
          method: "PUT", body: JSON.stringify({ name: catName.trim(), description: catDesc.trim() || undefined, imageUrl: catImageUrl || "" }),
        });
        toast.success("Category updated");
      } else {
        await apiFetch("/products/categories", {
          method: "POST", body: JSON.stringify({ name: catName.trim(), description: catDesc.trim() || undefined, imageUrl: catImageUrl || "" }),
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
        <div className="flex items-center gap-2.5">
          {tab === "products" && (
            <>
              {/* Upload Hub Primary Launcher */}
              <button
                type="button"
                onClick={() => setShowHub(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 flex items-center gap-2 shadow-sm transition-all"
                title="Open upload options: Scan, Invoice OCR, Voice, or Formulary"
              >
                <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span>Upload Options</span>
              </button>

              {/* Actions Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <span>More Tools</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${showActionsDropdown ? "rotate-180" : ""}`} />
                </button>

                {showActionsDropdown && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowActionsDropdown(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl py-1.5 z-30 animate-in fade-in slide-in-from-top-1 text-xs divide-y divide-slate-100 dark:divide-slate-700">
                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => { setShowActionsDropdown(false); setShowScanner(true); }}
                          className="w-full px-3.5 py-2 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 font-medium text-left"
                        >
                          <Scan className="h-4 w-4 text-emerald-500" />
                          <span>Scan Barcode / Box</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowActionsDropdown(false); setShowContinuousScan(true); }}
                          className="w-full px-3.5 py-2 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 font-medium text-left"
                        >
                          <Zap className="h-4 w-4 text-amber-500" />
                          <span>Rapid Continuous Scan</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowActionsDropdown(false); setShowInvoiceOcr(true); }}
                          className="w-full px-3.5 py-2 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 font-medium text-left"
                        >
                          <FileText className="h-4 w-4 text-blue-500" />
                          <span>Wholesaler Invoice OCR</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowActionsDropdown(false); setShowFormulary(true); }}
                          className="w-full px-3.5 py-2 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 font-medium text-left"
                        >
                          <BookOpen className="h-4 w-4 text-teal-500" />
                          <span>Drug Formulary Library</span>
                        </button>
                      </div>

                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => { setShowActionsDropdown(false); setShowImport(true); }}
                          className="w-full px-3.5 py-2 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 font-medium text-left"
                        >
                          <Upload className="h-4 w-4 text-slate-400" />
                          <span>Import CSV</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowActionsDropdown(false);
                            if (products.length === 0) { toast.error("No products to export"); return; }
                            const headers = ["ID", "SKU", "Barcode", "Name", "Category", "Price", "StockQuantity", "RequiresPrescription"];
                            const rows = products.map(p => [
                              p.id,
                              `"${p.sku}"`,
                              `"${p.barcode || ''}"`,
                              `"${p.name.replace(/"/g, '""')}"`,
                              `"${p.category?.name || ''}"`,
                              p.price,
                              p.stockQuantity,
                              p.requiresPrescription ? "Yes" : "No"
                            ]);
                            const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
                            const encodedUri = encodeURI(csvContent);
                            const link = document.createElement("a");
                            link.setAttribute("href", encodedUri);
                            link.setAttribute("download", `jumarald_products_${new Date().toISOString().slice(0, 10)}.csv`);
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            toast.success("Products CSV exported!");
                          }}
                          className="w-full px-3.5 py-2 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 font-medium text-left"
                        >
                          <Download className="h-4 w-4 text-slate-400" />
                          <span>Export CSV</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          <button
            onClick={() => tab === "products" ? (setFormMode("quick"), resetForm(), setShowForm(true)) : (resetCatForm(), setShowCatForm(true))}
            className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm text-xs sm:text-sm transition-all"
          >
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
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{editingId ? "Edit Product" : "Add New Product"}</h2>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 flex items-center gap-1 shadow-sm transition-colors"
                    title="Scan barcode or capture packaging box"
                  >
                    <Scan className="h-3.5 w-3.5" /> Scan
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFormulary(true)}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 hover:bg-teal-200 flex items-center gap-1 shadow-sm transition-colors"
                    title="Clone from standard Ghanaian medicines library"
                  >
                    <BookOpen className="h-3.5 w-3.5" /> Formulary
                  </button>
                </div>
              </div>
              <button onClick={resetForm} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"><X className="h-5 w-5 text-slate-400" /></button>
            </div>

            {/* Mode Switcher Banner: Quick Mode (Simple) vs Detailed Clinical Mode */}
            <div className="px-6 pt-4">
              <div className="flex items-center justify-between p-1.5 bg-slate-100 dark:bg-slate-900/60 rounded-2xl">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setFormMode("quick")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      formMode === "quick"
                        ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <Zap className="h-3.5 w-3.5" /> ⚡ Quick Mode (Simple)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormMode("detailed")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      formMode === "detailed"
                        ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5" /> 📋 Detailed Clinical Mode
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 hidden sm:inline pr-2">
                  {formMode === "quick" ? "Only 3 fields needed" : "All 15+ fields visible"}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Product Name with Voice, Barcode & Clinical Template Autocomplete */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label className={labelClass}>Product Name *</label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Live Formulary Suggestions Active
                  </span>
                </div>
                <div className="relative">
                  <input
                    placeholder="e.g. Amoxicillin 500mg, Paracetamol, Coartem..."
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onFocus={() => {
                      if (form.name.trim().length >= 2) handleNameChange(form.name);
                    }}
                    className={`${inputClass} pr-20`}
                    required
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={startVoiceDictation}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isListeningVoice
                          ? "bg-red-500 text-white animate-pulse"
                          : "text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                      }`}
                      title="Speak medicine name & price (Hands-free voice dictation)"
                    >
                      <Mic className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowScanner(true)}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors"
                      title="Scan barcode or camera photo"
                    >
                      <Scan className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Name Autocomplete Dropdown */}
                {showNameSuggestions && nameSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in slide-in-from-top-1">
                    <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-500" /> Standard Formulary (Click to Auto-Fill All Details)
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowNameSuggestions(false)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {nameSuggestions.map((drug) => (
                      <div
                        key={drug.id}
                        onClick={() => handleSelectNameSuggestion(drug)}
                        className="p-3 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 cursor-pointer flex items-center justify-between gap-3 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center shrink-0 font-bold">
                            <Pill className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                              {drug.name}
                            </h4>
                            <p className="text-[10px] text-slate-400 truncate">
                              {drug.activeIngredients || drug.genericName} {drug.manufacturer ? `• ${drug.manufacturer}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {drug.strength}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Price & Stock Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className={labelClass}>Price (GHS) *</label>
                  <input type="number" min="0" step="0.01" placeholder="0.00" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={`${inputClass} font-bold text-emerald-700 dark:text-emerald-300`} required />
                </div>
                <div>
                  <label className={labelClass}>Stock Quantity *</label>
                  <input type="number" min="0" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} className={`${inputClass} font-bold`} />
                </div>
                <div>
                  <label className={labelClass}>Compare At (GHS)</label>
                  <input type="number" min="0" step="0.01" placeholder="Original price" value={form.compareAtPrice} onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Min Stock Alert</label>
                  <input type="number" min="0" value={form.minStockAlert} onChange={(e) => setForm({ ...form, minStockAlert: e.target.value })} className={inputClass} />
                </div>
              </div>

              {/* Category & Manufacturer Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Category</label>
                  <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value, newCategoryName: "" })} className={inputClass}>
                    <option value="">Select category (or auto-assigned)</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Or Create New Category</label>
                  <input placeholder="New category name" value={form.newCategoryName} onChange={(e) => setForm({ ...form, newCategoryName: e.target.value, categoryId: "" })} className={inputClass} disabled={!!form.categoryId} />
                </div>

                {/* Manufacturer with Autocomplete */}
                <div className="relative">
                  <label className={labelClass}>Manufacturer Name</label>
                  <div className="relative">
                    <input
                      placeholder="e.g. Ernest Chemists Ltd, Tobinco..."
                      value={form.manufacturer}
                      onChange={(e) => handleMfgChange(e.target.value)}
                      onFocus={() => {
                        if (!form.manufacturer) handleMfgChange("");
                      }}
                      className={`${inputClass} pr-8`}
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Building2 className="h-4 w-4" />
                    </div>
                  </div>

                  {/* Manufacturer Autocomplete Dropdown */}
                  {showMfgSuggestions && mfgSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in slide-in-from-top-1 max-h-48 overflow-y-auto">
                      <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        <span>Top Manufacturers</span>
                        <button
                          type="button"
                          onClick={() => setShowMfgSuggestions(false)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {mfgSuggestions.map((mfg, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectMfg(mfg)}
                          className="px-3.5 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer flex items-center gap-2 transition-colors"
                        >
                          <Building2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span>{mfg}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* In QUICK MODE: Collapsible Clinical Accordion */}
              {formMode === "quick" && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
                  <button
                    type="button"
                    onClick={() => setShowClinicalAccordion(!showClinicalAccordion)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                      Clinical & Regulatory Details (Auto-filled by AI / Optional)
                    </span>
                    {showClinicalAccordion ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </button>

                  {showClinicalAccordion && (
                    <div className="p-4 space-y-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className={labelClass}>SKU (Auto-Generated if blank)</label>
                          <input placeholder="e.g. AMX-500-CAP" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className={`${inputClass} font-mono`} />
                        </div>
                        <div>
                          <label className={labelClass}>Barcode (UPC / EAN)</label>
                          <input placeholder="e.g. 5012345678900" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className={`${inputClass} font-mono`} />
                        </div>
                        <div>
                          <label className={labelClass}>Manufacturer</label>
                          <input placeholder="e.g. Ernest Chemists Ltd" value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} className={inputClass} />
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
                          <input placeholder="e.g. Amoxicillin Trihydrate" value={form.activeIngredients} onChange={(e) => setForm({ ...form, activeIngredients: e.target.value })} className={inputClass} />
                        </div>
                      </div>

                      <div>
                        <label className={labelClass}>Product Description</label>
                        <textarea rows={2} placeholder="Optional — AI will auto-generate if left blank" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputClass} resize-none`} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* In DETAILED MODE: Expand All Fields Directly */}
              {formMode === "detailed" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>SKU *</label>
                      <input placeholder="e.g. AMX-500-CAP" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className={`${inputClass} font-mono`} />
                    </div>
                    <div>
                      <label className={labelClass}>Barcode (UPC / EAN)</label>
                      <div className="relative">
                        <input placeholder="e.g. 5012345678900" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className={`${inputClass} font-mono pr-9`} />
                        <button
                          type="button"
                          onClick={() => setShowScanner(true)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-emerald-600 rounded-lg"
                          title="Scan Barcode"
                        >
                          <Scan className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <label className={labelClass}>Manufacturer</label>
                      <div className="relative">
                        <input
                          placeholder="e.g. Ernest Chemists Ltd, GSK..."
                          value={form.manufacturer}
                          onChange={(e) => handleMfgChange(e.target.value)}
                          onFocus={() => {
                            if (!form.manufacturer) handleMfgChange("");
                          }}
                          className={`${inputClass} pr-8`}
                        />
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <Building2 className="h-4 w-4" />
                        </div>
                      </div>

                      {/* Detailed Mode Manufacturer Autocomplete */}
                      {showMfgSuggestions && mfgSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in slide-in-from-top-1 max-h-48 overflow-y-auto">
                          <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            <span>Top Manufacturers</span>
                            <button
                              type="button"
                              onClick={() => setShowMfgSuggestions(false)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          {mfgSuggestions.map((mfg, idx) => (
                            <div
                              key={idx}
                              onClick={() => handleSelectMfg(mfg)}
                              className="px-3.5 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer flex items-center gap-2 transition-colors"
                            >
                              <Building2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                              <span>{mfg}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Description</label>
                    <textarea rows={3} placeholder="Full product description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputClass} resize-none`} />
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
                </>
              )}

              <div className="space-y-3">
                <label className={labelClass}>Product Images</label>
                
                {/* Image Upload Dropzone & Button */}
                {/* Dual Image Input: Live Desktop/Mobile Camera + File Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: Live Webcam / Phone Camera Capture */}
                  <button
                    type="button"
                    onClick={() => {
                      setCameraTarget("product");
                      setShowLiveCamera(true);
                    }}
                    className="cursor-pointer flex items-center justify-center gap-3 border-2 border-emerald-500/40 bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 p-3.5 rounded-2xl transition-all shadow-sm group"
                  >
                    <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 group-hover:scale-105 transition-transform">
                      <Camera className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                        Take Live Picture
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        Use PC Webcam or Phone Cam
                      </span>
                    </div>
                  </button>

                  {/* Option 2: Choose File from Disk */}
                  <label className="cursor-pointer flex items-center justify-center gap-3 border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 p-3.5 rounded-2xl transition-all shadow-sm group">
                    {uploadingImage ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Uploading File(s)...</span>
                      </>
                    ) : (
                      <>
                        <div className="h-9 w-9 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Upload className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                            Choose from Files
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Upload PNG, JPG, WebP from PC
                          </span>
                        </div>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageFileUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Uploaded Image Thumbnails Grid */}
                {form.images.trim() && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 pt-1">
                    {form.images
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((imgUrl, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-20 bg-slate-100 dark:bg-slate-800">
                          <img src={imgUrl} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 p-1 rounded-full bg-red-600 text-white opacity-90 hover:opacity-100 transition-opacity shadow-md"
                            title="Remove Image"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                  </div>
                )}

                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Direct Image URLs (comma separated)</span>
                  <input
                    placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                    value={form.images}
                    onChange={(e) => setForm({ ...form, images: e.target.value })}
                    className={inputClass}
                  />
                </div>
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
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-slate-400">{viewProduct.sku}</span>
                {viewProduct.barcode && (
                  <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Barcode className="h-3 w-3" /> {viewProduct.barcode}
                  </span>
                )}
                {viewProduct.requiresPrescription && <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-semibold">Rx</span>}
              </div>
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
              <div>
                <label className={labelClass}>Category Cover Image</label>
                <div className="space-y-2 mb-2">
                  {catImageUrl ? (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                      <img src={catImageUrl} alt="Category preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setCatImageUrl("")}
                        className="absolute top-1 right-1 p-1 rounded-full bg-red-600 text-white shadow"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : null}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCameraTarget("category");
                        setShowLiveCamera(true);
                      }}
                      className="cursor-pointer flex items-center justify-center gap-2 border border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-100/50 p-2.5 rounded-xl transition-all"
                    >
                      <Camera className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        Take Live Picture
                      </span>
                    </button>

                    <label className="cursor-pointer flex items-center justify-center gap-2 border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 p-2.5 rounded-xl hover:bg-slate-100 transition-colors">
                      {uploadingCatImage ? (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
                      ) : (
                        <Upload className="h-4 w-4 text-slate-600" />
                      )}
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {uploadingCatImage ? "Uploading..." : "Choose File"}
                      </span>
                      <input type="file" accept="image/*" onChange={handleCatImageUpload} disabled={uploadingCatImage} className="hidden" />
                    </label>
                  </div>
                </div>
                <input placeholder="Or enter direct image URL..." value={catImageUrl} onChange={(e) => setCatImageUrl(e.target.value)} className={inputClass} />
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
          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto">
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
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 font-mono">
                        <div>{product.sku}</div>
                        {product.barcode && (
                          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <Barcode className="h-3 w-3 text-slate-400" />
                            {product.barcode}
                          </div>
                        )}
                      </td>
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

          {/* Mobile Cards View (< md) */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700/60">
            {loading ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500">Loading products...</div>
            ) : products.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500">No products found</div>
            ) : (
              products.map((product) => (
                <div key={product.id} className="p-4 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                  <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                    {product.images[0] ? (
                      <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="h-6 w-6 text-slate-300 dark:text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                        {product.name}
                      </h3>
                      {product.requiresPrescription ? (
                        <span className="text-[9px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full shrink-0">
                          Rx
                        </span>
                      ) : (
                        <span className="text-[9px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full shrink-0">
                          OTC
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-mono">
                      <span>{product.sku}</span>
                      {product.category?.name && <span>• {product.category.name}</span>}
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-700/60">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          GHS {product.price.toFixed(2)}
                        </span>
                        <StockBadge quantity={product.stockQuantity} minAlert={product.minStockAlert} />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setViewProduct(product)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => startEdit(product)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
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
          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto">
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

          {/* Mobile Category Cards (< md) */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700/60">
            {categories.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500">No categories found</div>
            ) : (
              categories.map((cat) => (
                <div key={cat.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center shrink-0">
                      <Tag className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{cat.name}</p>
                      <p className="text-xs text-slate-400 font-mono truncate">{cat.slug}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${(cat._count?.products || 0) > 0 ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"}`}>
                      {cat._count?.products || 0} items
                    </span>
                    <button onClick={() => startEditCat(cat)} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-700"><Edit className="h-4 w-4" /></button>
                    <button onClick={() => deleteCategory(cat.id, cat.name, cat._count?.products || 0)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      {/* ========== IMPORT MODAL ========== */}
      <ProductImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onImported={() => { loadProducts(); loadCategories(); }}
      />
      {/* ========== SCANNER MODAL ========== */}
      <ProductScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onApply={handleScannedDataApplied}
        categories={categories}
      />
      {/* ========== UPLOAD HUB MODAL ========== */}
      <ProductUploadHubModal
        isOpen={showHub}
        onClose={() => setShowHub(false)}
        onSelectMode={handleSelectUploadMode}
      />
      {/* ========== CONTINUOUS RAPID SCANNER MODAL ========== */}
      <ContinuousScannerModal
        isOpen={showContinuousScan}
        onClose={() => setShowContinuousScan(false)}
        onProductCreated={() => { loadProducts(); }}
      />
      {/* ========== WHOLESALER INVOICE OCR MODAL ========== */}
      <InvoiceOcrModal
        isOpen={showInvoiceOcr}
        onClose={() => setShowInvoiceOcr(false)}
        onProductsImported={() => { loadProducts(); loadCategories(); }}
      />
      {/* ========== STANDARD FORMULARY MODAL ========== */}
      <StandardFormularyModal
        isOpen={showFormulary}
        onClose={() => setShowFormulary(false)}
        onSelectDrug={(drug) => {
          handleScannedDataApplied(drug);
          setShowForm(true);
        }}
      />
      {/* ========== LIVE WEBCAM / CAMERA CAPTURE MODAL ========== */}
      <LiveCameraModal
        isOpen={showLiveCamera}
        onClose={() => setShowLiveCamera(false)}
        title={cameraTarget === "product" ? "Take Product Photo(s)" : "Take Category Photo"}
        onPhotosCaptured={(urls) => {
          if (cameraTarget === "product") {
            const currentList = form.images
              ? form.images.split(",").map((s) => s.trim()).filter(Boolean)
              : [];
            const updatedList = [...currentList, ...urls];
            setForm((prev) => ({ ...prev, images: updatedList.join(", ") }));
          } else {
            if (urls[0]) setCatImageUrl(urls[0]);
          }
        }}
      />
    </div>
  );
}

