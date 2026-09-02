"use client";

import { useState, useEffect } from "react";
import {
  Globe,
  Search,
  X,
  Loader2,
  Check,
  ExternalLink,
  ImageIcon,
  Sparkles,
  RefreshCw,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface WebImageItem {
  title: string;
  image: string;
  thumbnail: string;
  source: string;
  width?: number;
  height?: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  productDetails: {
    name: string;
    manufacturer?: string;
    strength?: string;
    dosageForm?: string;
    productId?: string;
  };
  onImageSelected: (cdnUrl: string) => void;
}

export function WebImageSearchModal({
  isOpen,
  onClose,
  productDetails,
  onImageSelected,
}: Props) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<WebImageItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<WebImageItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewZoom, setPreviewZoom] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const parts = [
        productDetails.name,
        productDetails.strength,
        productDetails.manufacturer,
        "medicine",
      ].filter(Boolean);
      const initialSearch = parts.join(" ");
      setQuery(initialSearch);
      setSelectedImage(null);
      handleSearch(initialSearch);
    }
  }, [isOpen, productDetails.name, productDetails.manufacturer, productDetails.strength]);

  async function handleSearch(searchQuery?: string) {
    const q = searchQuery !== undefined ? searchQuery : query;
    if (!q.trim()) return;

    setLoading(true);
    try {
      const res = await apiFetch<{ status: string; count: number; images: WebImageItem[] }>(
        `/products/web-images/search?q=${encodeURIComponent(q)}`
      );
      const list = res.images || [];
      setImages(list);
      if (list.length === 0) {
        toast.info("No matching web images found. Try refining your search keywords.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to search web images");
    } finally {
      setLoading(false);
    }
  }

  async function handleAttachPhoto() {
    if (!selectedImage) {
      toast.warning("Please select a photo first");
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch<{ status: string; cdnUrl: string }>("/products/web-images/save", {
        method: "POST",
        body: JSON.stringify({
          imageUrl: selectedImage.image,
          productName: productDetails.name,
          productId: productDetails.productId,
          saveToProduct: false,
        }),
      });

      if (res.cdnUrl) {
        toast.success("Authentic product photo uploaded to CDN and attached!");
        onImageSelected(res.cdnUrl);
        onClose();
      } else {
        throw new Error("Failed to save image to CDN");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save web image to Cloudinary");
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                Find Authentic Product Photo on Web
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Search Google &amp; medical databases for real-world manufacturer packaging photos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Paracetamol 500mg Ernest Chemists packaging photo..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all shrink-0"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span>Search</span>
            </button>
          </form>

          {/* Quick Filter Tags */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
            <span className="text-slate-400 font-bold shrink-0">Refine:</span>
            {[
              "packaging box",
              "blister pack",
              "amber bottle",
              productDetails.manufacturer,
              "Ghana FDA registered",
            ]
              .filter(Boolean)
              .map((tag, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    const newQ = `${productDetails.name} ${tag}`;
                    setQuery(newQ);
                    handleSearch(newQ);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 text-slate-600 dark:text-slate-300 font-semibold shrink-0 transition-colors"
                >
                  +{tag}
                </button>
              ))}
          </div>
        </div>

        {/* Results Grid */}
        <div className="flex-1 overflow-y-auto p-4 max-h-[50vh]">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Searching manufacturer websites and medical catalogs...
              </p>
            </div>
          ) : images.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 w-14 h-14 mx-auto flex items-center justify-center">
                <ImageIcon className="h-7 w-7" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No Web Photos Found</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Try searching with just the brand name or generic drug name, or use the <strong>DALL-E 3 AI Studio Generator</strong>.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {images.map((img, idx) => {
                const isSelected = selectedImage?.image === img.image;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`group relative rounded-2xl border overflow-hidden cursor-pointer bg-slate-50 dark:bg-slate-800/60 transition-all flex flex-col ${
                      isSelected
                        ? "border-blue-500 ring-2 ring-blue-500/50 shadow-lg scale-[1.02]"
                        : "border-slate-200 dark:border-slate-700/60 hover:border-blue-400 opacity-90 hover:opacity-100"
                    }`}
                  >
                    {/* Image Container */}
                    <div className="relative aspect-square w-full bg-white dark:bg-slate-900 overflow-hidden flex items-center justify-center p-2">
                      <img
                        src={img.thumbnail || img.image}
                        alt={img.title}
                        className="w-full h-full object-contain transition-transform group-hover:scale-105"
                        loading="lazy"
                      />

                      {/* Selection Check Indicator */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 p-1.5 rounded-full bg-blue-600 text-white shadow-md">
                          <Check className="h-4 w-4 stroke-[3]" />
                        </div>
                      )}

                      {/* Zoom Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewZoom(img.image);
                        }}
                        className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black text-white opacity-0 group-hover:opacity-100 transition-opacity shadow"
                        title="Zoom full image"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Metadata Footer */}
                    <div className="p-2.5 bg-white dark:bg-slate-800/90 border-t border-slate-100 dark:border-slate-700/50 space-y-1">
                      <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                        {img.title}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="truncate max-w-[120px]">{img.source}</span>
                        {img.width && img.height && (
                          <span className="font-mono text-[9px] bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded">
                            {img.width}x{img.height}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {selectedImage ? (
              <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> 1 Photo Selected
              </span>
            ) : (
              <span>Click a packaging photo from the grid to select it</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={saving || !selectedImage}
              onClick={handleAttachPhoto}
              className="px-6 py-2.5 rounded-xl font-black text-xs bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50 transition-all transform hover:-translate-y-0.5"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading to Cloud CDN...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Use This Packaging Photo
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Full Size Zoom Modal */}
      {previewZoom && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onClick={() => setPreviewZoom(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-white dark:bg-slate-900 p-2">
            <img src={previewZoom} alt="Full Zoom Preview" className="w-full h-full object-contain max-h-[75vh]" />
            <button
              onClick={() => setPreviewZoom(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/70 text-white hover:bg-black"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
