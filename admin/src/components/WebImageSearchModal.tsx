"use client";

import { useState, useEffect, useRef } from "react";
import {
  Globe,
  Search,
  X,
  Loader2,
  Check,
  ImageIcon,
  Sparkles,
  Eye,
  CheckCircle2,
  Upload,
  Link as LinkIcon,
  Wand2,
} from "lucide-react";
import { apiFetch, apiUpload } from "@/lib/api";
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
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewZoom, setPreviewZoom] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean the initial product query to maximize natural hits
  useEffect(() => {
    if (isOpen) {
      let cleanName = (productDetails.name || "")
        .replace(/\bcoough\b/gi, "cough")
        .replace(/\bparacetemol\b/gi, "paracetamol")
        .replace(/\(.*?\)/g, " ")
        .replace(/&/g, " ")
        .replace(
          /\b(ltd|limited|pharmaceuticals|pharma|inc|corp|plc|llc|centre|center|research|dependable|agency|distributors|distributor|enterprises|enterprise|supplies|supply|holdings|company|co|ventures|venture|ghana)\b/gi,
          " "
        )
        .replace(/\s+/g, " ")
        .trim();

      const mfgWord = productDetails.manufacturer
        ? productDetails.manufacturer
            .replace(/\(.*?\)/g, " ")
            .replace(/&/g, " ")
            .replace(
              /\b(ltd|limited|pharmaceuticals|pharma|inc|corp|plc|llc|centre|center|research|dependable|agency|distributors|distributor|enterprises|enterprise|supplies|supply|holdings|company|co|ventures|venture|ghana)\b/gi,
              " "
            )
            .trim()
            .split(" ")[0]
        : "";

      const parts = [
        cleanName,
        productDetails.strength,
        mfgWord && !cleanName.toLowerCase().includes(mfgWord.toLowerCase()) ? mfgWord : "",
      ].filter(Boolean);

      const initialSearch = parts.join(" ").replace(/\s+/g, " ").trim();
      setQuery(initialSearch);
      setSelectedImage(null);
      setFailedImages(new Set());
      setShowUrlInput(false);
      setCustomUrl("");
      handleSearch(initialSearch);
    }
  }, [isOpen, productDetails.name, productDetails.manufacturer, productDetails.strength]);

  async function handleSearch(searchQuery?: string) {
    const q = searchQuery !== undefined ? searchQuery : query;
    if (!q.trim()) return;

    setLoading(true);
    setFailedImages(new Set());
    try {
      const res = await apiFetch<{ status: string; count: number; images: WebImageItem[] }>(
        `/products/web-images/search?q=${encodeURIComponent(q)}`,
        { skipCache: true }
      );
      const list = res.images || [];
      setImages(list);
      if (list.length === 0) {
        toast.info("No matching pharmaceutical photos found. Try the suggested pills or AI Studio!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to search web images");
    } finally {
      setLoading(false);
    }
  }

  // Attach selected image from the web search results
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

  // 1-Click Fallback: Generate authentic pharmaceutical 3D packaging photo with AI Studio
  async function handleGenerateAiPhoto() {
    setIsGeneratingAi(true);
    try {
      toast.info("Generating authentic studio packaging render with AI Studio (DALL-E 3)...");
      const res = await apiFetch<{ status: string; imageUrl: string }>("/products/ai-images/generate-single", {
        method: "POST",
        body: JSON.stringify({
          name: productDetails.name,
          dosageForm: productDetails.dosageForm,
          strength: productDetails.strength,
          manufacturer: productDetails.manufacturer,
          productId: productDetails.productId,
          saveToProduct: false,
        }),
      });

      if (res.imageUrl) {
        const aiItem: WebImageItem = {
          title: `${productDetails.name} (AI Studio 3D Pack Render)`,
          image: res.imageUrl,
          thumbnail: res.imageUrl,
          source: "AI Studio (DALL-E 3)",
        };
        setImages((prev) => [aiItem, ...prev]);
        setSelectedImage(aiItem);
        toast.success("✨ AI Studio generated pharmaceutical packaging photo successfully!");
      } else {
        throw new Error("No image URL returned by AI generator");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate AI product image");
    } finally {
      setIsGeneratingAi(false);
    }
  }

  // Direct Fallback: Paste image link from web
  async function handleAttachPastedUrl() {
    if (!customUrl.trim()) {
      toast.warning("Please enter a valid image URL");
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch<{ status: string; cdnUrl: string }>("/products/web-images/save", {
        method: "POST",
        body: JSON.stringify({
          imageUrl: customUrl.trim(),
          productName: productDetails.name,
          productId: productDetails.productId,
          saveToProduct: false,
        }),
      });

      if (res.cdnUrl) {
        toast.success("Image attached and uploaded to Cloud CDN!");
        onImageSelected(res.cdnUrl);
        onClose();
      } else {
        throw new Error("Failed to save image from URL");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save image from URL");
    } finally {
      setSaving(false);
    }
  }

  // Direct Fallback: Pick file from computer / device
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await apiUpload<{ url: string }>(file);
      if (res.url) {
        toast.success("Photo uploaded to Cloud CDN and attached!");
        onImageSelected(res.url);
        onClose();
      } else {
        throw new Error("Upload response did not contain image URL");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (!isOpen) return null;

  const validImages = images.filter((img) => !failedImages.has(img.image));
  const cleanNameOnly = (productDetails.name || "")
    .replace(/\(.*?\)/g, "")
    .replace(/\b(ltd|limited|pharmaceuticals|pharma|inc|corp|plc|llc|centre|center|research|dependable)\b/gi, "")
    .trim();
  const simpleBrand = cleanNameOnly.split(" ").slice(0, 2).join(" ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Hidden File Input for Device Upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                Find Product Packaging Photo
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Search verified pharmacy databases or generate authentic 3D packaging with AI Studio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving || isGeneratingAi || isUploading}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Search Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="relative flex-1 min-w-[240px] flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Adom Koo Ointment, Paracetamol 500mg..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all shrink-0"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span>Search</span>
              </button>
            </form>

            {/* Quick Action Buttons: AI Studio, Upload, Paste URL */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleGenerateAiPhoto}
                disabled={isGeneratingAi || loading || saving}
                title="Generate studio 3D packaging render with AI Studio (DALL-E 3)"
                className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
              >
                {isGeneratingAi ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Wand2 className="h-3.5 w-3.5" />
                )}
                <span>AI Studio</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || saving}
                title="Upload photo from your computer or phone"
                className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">Upload</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                title="Paste direct image link"
                className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  showUrlInput
                    ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-400"
                    : "bg-slate-100 dark:bg-slate-800 border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <LinkIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Paste URL</span>
              </button>
            </div>
          </div>

          {/* Inline URL Paste Input */}
          {showUrlInput && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 animate-fade-in">
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="Paste direct image URL (https://.../photo.jpg)"
                className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAttachPastedUrl}
                disabled={saving || !customUrl.trim()}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                <span>Attach URL</span>
              </button>
            </div>
          )}

          {/* Quick Refinement Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
            <span className="text-slate-400 font-bold shrink-0">Try:</span>
            {[
              cleanNameOnly,
              simpleBrand && simpleBrand !== cleanNameOnly ? simpleBrand : "",
              productDetails.dosageForm ? `${cleanNameOnly} ${productDetails.dosageForm}` : "",
              "Ghana pharmacy",
              "packaging box",
            ]
              .filter(Boolean)
              .filter((item, pos, self) => self.indexOf(item) === pos)
              .map((pill, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuery(pill);
                    handleSearch(pill);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 text-slate-600 dark:text-slate-300 font-semibold shrink-0 transition-colors"
                >
                  {pill}
                </button>
              ))}
          </div>
        </div>

        {/* Results Grid */}
        <div className="flex-1 overflow-y-auto p-4 max-h-[52vh]">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Searching verified pharmacy databases and manufacturer packaging catalogs...
              </p>
            </div>
          ) : validImages.length === 0 ? (
            <div className="py-12 px-4 max-w-lg mx-auto text-center space-y-4">
              <div className="p-4 rounded-3xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 w-16 h-16 mx-auto flex items-center justify-center shadow-inner">
                <ImageIcon className="h-8 w-8 text-slate-400" />
              </div>

              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                  No Web Packaging Found For &ldquo;{query}&rdquo;
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Web search engines may not have indexed authentic photos for this exact product title. You have 3 instant options:
                </p>
              </div>

              {/* 3 Instant Fallback Actions */}
              <div className="grid grid-cols-1 gap-2.5 pt-2 text-left">
                {/* 1. AI Studio */}
                <button
                  type="button"
                  onClick={handleGenerateAiPhoto}
                  disabled={isGeneratingAi}
                  className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-200/80 dark:border-purple-800/50 hover:border-purple-400 dark:hover:border-purple-600 transition-all flex items-center gap-3 text-left group"
                >
                  <div className="p-2 rounded-xl bg-purple-600 text-white shadow-md">
                    {isGeneratingAi ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Sparkles className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                      Generate with AI Studio (DALL-E 3)
                      <span className="text-[10px] font-bold px-1.5 py-0.2 bg-purple-200 dark:bg-purple-800/60 text-purple-800 dark:text-purple-300 rounded">
                        Fast &amp; Authentic
                      </span>
                    </p>
                    <p className="text-[11px] text-purple-700/80 dark:text-purple-400/80 mt-0.5">
                      Creates a photorealistic 3D medical packaging render tailored to &ldquo;{productDetails.name}&rdquo;
                    </p>
                  </div>
                </button>

                {/* 2. Upload file */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-blue-400 transition-all flex items-center gap-3 text-left"
                >
                  <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md">
                    {isUploading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Upload className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                      Upload Photo from Device
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Select any photo from your computer or phone camera
                    </p>
                  </div>
                </button>

                {/* 3. Paste URL */}
                <button
                  type="button"
                  onClick={() => setShowUrlInput(true)}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-blue-400 transition-all flex items-center gap-3 text-left"
                >
                  <div className="p-2 rounded-xl bg-slate-700 text-white shadow-md">
                    <LinkIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                      Paste an Image Link
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Found a picture online? Paste its direct URL here
                    </p>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {validImages.map((img, idx) => {
                const isSelected = selectedImage?.image === img.image;
                const isAiRender = img.source.includes("AI Studio") || img.source.includes("DALL-E");
                const isPharmacySource =
                  /pharmacy|chemist|pharma|drug|health|med|rx|dailymed|scab|beybee|vafy|swiftmedcare|countrymedical|caplet|phyto-riker/i.test(
                    img.source
                  );

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
                        onError={() => {
                          setFailedImages((prev) => new Set(prev).add(img.image));
                        }}
                      />

                      {/* Source Badges */}
                      {isAiRender ? (
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-purple-600/90 text-white text-[9px] font-bold tracking-tight shadow flex items-center gap-1">
                          <Sparkles className="h-2.5 w-2.5 stroke-[3]" />
                          AI Studio
                        </div>
                      ) : isPharmacySource ? (
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-emerald-600/90 text-white text-[9px] font-bold tracking-tight shadow flex items-center gap-1">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                          Pharmacy
                        </div>
                      ) : null}

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
              <span>Click a packaging photo to select it, or choose AI Studio / Upload</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving || isGeneratingAi || isUploading}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={saving || isGeneratingAi || isUploading || !selectedImage}
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
