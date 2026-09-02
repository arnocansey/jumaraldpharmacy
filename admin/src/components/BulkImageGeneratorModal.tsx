"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ImageIcon,
  Search,
  CheckSquare,
  Square,
  ArrowRight,
  RefreshCw,
  Eye,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface MissingProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  dosageForm?: string;
  strength?: string;
  manufacturer?: string;
  category?: { id: string; name: string };
  images: string[];
}

interface GenerationStatus {
  status: "idle" | "generating" | "success" | "error";
  imageUrl?: string;
  error?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

export function BulkImageGeneratorModal({ isOpen, onClose, onCompleted }: Props) {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<MissingProduct[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generationMap, setGenerationMap] = useState<Record<string, GenerationStatus>>({});
  const [currentGeneratingIndex, setCurrentGeneratingIndex] = useState<number>(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadMissingProducts();
    }
  }, [isOpen]);

  async function loadMissingProducts() {
    setLoading(true);
    try {
      const res = await apiFetch<{ status: string; count: number; products: MissingProduct[] }>(
        "/products/ai-images/missing"
      );
      const list = res.products || [];
      setProducts(list);
      setSelectedIds(new Set(list.map((p) => p.id)));
      setGenerationMap({});
    } catch (err: any) {
      toast.error(err.message || "Failed to load products without images");
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category?.name.toLowerCase().includes(q) ||
        p.manufacturer?.toLowerCase().includes(q)
    );
  }, [products, search]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  async function handleStartBulkGeneration() {
    const idsToProcess = Array.from(selectedIds);
    if (idsToProcess.length === 0) {
      toast.warning("Please select at least one product to generate photos for.");
      return;
    }

    setGenerating(true);
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < idsToProcess.length; i++) {
      const prodId = idsToProcess[i];
      const prod = products.find((p) => p.id === prodId);
      if (!prod) continue;

      setCurrentGeneratingIndex(i + 1);
      setGenerationMap((prev) => ({
        ...prev,
        [prodId]: { status: "generating" },
      }));

      try {
        const res = await apiFetch<{ status: string; imageUrl: string }>("/products/ai-images/generate-single", {
          method: "POST",
          body: JSON.stringify({
            productId: prodId,
            saveToProduct: true,
          }),
        });

        if (res.imageUrl) {
          successCount++;
          setGenerationMap((prev) => ({
            ...prev,
            [prodId]: { status: "success", imageUrl: res.imageUrl },
          }));
        } else {
          throw new Error("No image returned");
        }
      } catch (err: any) {
        failedCount++;
        setGenerationMap((prev) => ({
          ...prev,
          [prodId]: { status: "error", error: err.message || "Failed" },
        }));
      }
    }

    setGenerating(false);
    toast.success(`Generated ${successCount} pharmaceutical studio photos! ${failedCount > 0 ? `(${failedCount} failed)` : ""}`);

    if (onCompleted) {
      onCompleted();
    }
  }

  if (!isOpen) return null;

  const totalToGenerate = selectedIds.size;
  const progressPercent = totalToGenerate > 0 ? Math.round((currentGeneratingIndex / totalToGenerate) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                Bulk AI Pharmaceutical Image Generator
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate authentic, studio-quality commercial packaging photos via DALL-E 3 &amp; Cloudinary
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={generating}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Bar (when generating) */}
        {generating && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 border-b border-emerald-100 dark:border-emerald-900/40 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                Generating photo {currentGeneratingIndex} of {totalToGenerate}...
              </span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-2.5 bg-emerald-200/50 dark:bg-emerald-900/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Search & Actions Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by drug name, category, SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <button
              type="button"
              onClick={toggleSelectAll}
              disabled={generating || filteredProducts.length === 0}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
            >
              {selectedIds.size === filteredProducts.length ? (
                <>
                  <Square className="h-3.5 w-3.5" /> Deselect All
                </>
              ) : (
                <>
                  <CheckSquare className="h-3.5 w-3.5" /> Select All ({filteredProducts.length})
                </>
              )}
            </button>

            <button
              type="button"
              onClick={loadMissingProducts}
              disabled={generating || loading}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Refresh missing list"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[50vh]">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-600" />
              <p className="text-xs text-slate-400">Scanning catalog for products without photos...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="p-4 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 w-14 h-14 mx-auto flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">All products have photos!</p>
              <p className="text-xs text-slate-400">No missing product images found matching your search filter.</p>
            </div>
          ) : (
            filteredProducts.map((p) => {
              const isSelected = selectedIds.has(p.id);
              const status = generationMap[p.id];

              return (
                <div
                  key={p.id}
                  onClick={() => !generating && toggleSelect(p.id)}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-4 cursor-pointer ${
                    isSelected
                      ? "border-emerald-500/50 bg-emerald-50/40 dark:bg-emerald-950/20"
                      : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/40 opacity-75 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={generating}
                      onChange={() => {}}
                      className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
                    />

                    {/* Image Thumbnail / Placeholder */}
                    <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                      {status?.imageUrl ? (
                        <img
                          src={status.imageUrl}
                          alt={p.name}
                          className="h-full w-full object-cover cursor-zoom-in"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewImage(status.imageUrl!);
                          }}
                        />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-slate-400" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 dark:text-white truncate">{p.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                        <span className="font-mono">{p.sku}</span>
                        {p.dosageForm && <span>• {p.dosageForm}</span>}
                        {p.strength && <span>• {p.strength}</span>}
                        {p.category && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                            {p.category.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="shrink-0">
                    {status?.status === "generating" ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Rendering...
                      </span>
                    ) : status?.status === "success" ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Generated ✓
                      </span>
                    ) : status?.status === "error" ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1.5" title={status.error}>
                        <AlertCircle className="h-3.5 w-3.5" /> Failed
                      </span>
                    ) : (
                      <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                        GH₵{p.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {selectedIds.size} of {products.length} products selected
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={generating}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              {generating ? "Running in background..." : "Close"}
            </button>

            <button
              type="button"
              onClick={handleStartBulkGeneration}
              disabled={generating || selectedIds.size === 0}
              className="px-6 py-2.5 rounded-xl font-black text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-lg shadow-emerald-600/30 disabled:opacity-50 transition-all transform hover:-translate-y-0.5"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating ({currentGeneratingIndex}/{totalToGenerate})...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate {selectedIds.size} Photos with AI
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Image Zoom Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-xl max-h-[80vh] rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-white">
            <img src={previewImage} alt="Generated Preview" className="w-full h-full object-contain" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/70 text-white hover:bg-black"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
