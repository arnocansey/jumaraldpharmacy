"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  X,
  FileText,
  Upload,
  Sparkles,
  Loader2,
  CheckCircle2,
  Trash2,
  Check,
  Camera,
  Layers,
  ArrowRight,
  TrendingUp,
  DollarSign,
  AlertCircle,
  RefreshCw,
  Eye,
  Building2,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

export interface ExtractedInvoiceItem {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  strength?: string;
  dosageForm?: string;
  activeIngredients?: string;
  categoryName?: string;
  description?: string;
  manufacturer?: string;
  quantity: number;
  costPrice?: number;
  price: number;
  batchNumber?: string;
  expiryDate?: string;
  requiresPrescription: boolean;
  selected?: boolean;
}

interface InvoiceOcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductsImported: () => void;
}

export default function InvoiceOcrModal({
  isOpen,
  onClose,
  onProductsImported,
}: InvoiceOcrModalProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "camera">("upload");
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [fileType, setFileType] = useState<"image" | "pdf">("image");
  const [isDragging, setIsDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [distributor, setDistributor] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [items, setItems] = useState<ExtractedInvoiceItem[]>([]);
  const [markupPercent, setMarkupPercent] = useState<number>(25);

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera not supported on this device");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      setCameraError(err.message || "Failed to access camera");
      setCameraActive(false);
    }
  }, [stopCamera]);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, stopCamera]);

  function takeSnapshot() {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setImageFile(dataUrl);
    stopCamera();
    setActiveTab("upload");
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === "application/pdf";
    const isImage = file.type.startsWith("image/");
    if (!isPdf && !isImage) {
      toast.error("Please upload an image (PNG, JPG, WebP) or a PDF document.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageFile(reader.result as string);
      setFileType(isPdf ? "pdf" : "image");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const isPdf = file.type === "application/pdf";
    const isImage = file.type.startsWith("image/");
    if (!isPdf && !isImage) {
      toast.error("Only image or PDF files are supported.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageFile(reader.result as string);
      setFileType(isPdf ? "pdf" : "image");
    };
    reader.readAsDataURL(file);
  }

  // Generate a realistic demo invoice image on canvas for testing
  function handleLoadDemoInvoice() {
    const canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 1400;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background paper
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

    // Header
    ctx.fillStyle = "#047857";
    ctx.font = "bold 32px sans-serif";
    ctx.fillText("ERNEST CHEMISTS LIMITED", 60, 90);

    ctx.fillStyle = "#475569";
    ctx.font = "16px sans-serif";
    ctx.fillText("Pharmaceutical Distributors & Importers - Accra, Ghana", 60, 125);
    ctx.fillText("Tel: +233 302 221 445 | Email: sales@ernestchemists.com", 60, 150);

    // Invoice Meta
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("TAX INVOICE / DELIVERY SLIP", 60, 210);

    ctx.fillStyle = "#334155";
    ctx.font = "16px sans-serif";
    ctx.fillText("Invoice No: ECL-GH-2026-8842", 60, 240);
    ctx.fillText("Date: 27-AUG-2026", 60, 265);
    ctx.fillText("Customer: Jumarald Pharmacy & Wellness", 60, 290);

    // Table Header
    ctx.fillStyle = "#f1f5f9";
    ctx.fillRect(60, 320, canvas.width - 120, 45);

    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 15px sans-serif";
    ctx.fillText("ITEM DESCRIPTION", 80, 348);
    ctx.fillText("DOSAGE / STRENGTH", 420, 348);
    ctx.fillText("QTY", 620, 348);
    ctx.fillText("UNIT COST (GHS)", 700, 348);
    ctx.fillText("TOTAL (GHS)", 830, 348);

    // Items
    const demoRows = [
      { name: "Amoxicillin Capsules", strength: "500mg (10x10)", qty: "50", cost: "24.50", total: "1,225.00" },
      { name: "Paracetamol Tablets", strength: "500mg (1000s)", qty: "20", cost: "18.00", total: "360.00" },
      { name: "Coartem 80/480mg", strength: "6 Tablets Pack", qty: "40", cost: "35.00", total: "1,400.00" },
      { name: "Omeprazole Capsules", strength: "20mg (2x14)", qty: "30", cost: "22.00", total: "660.00" },
      { name: "Ciprofloxacin Tablets", strength: "500mg (10s)", qty: "25", cost: "26.00", total: "650.00" },
      { name: "Cetirizine 10mg", strength: "10mg (10x10)", qty: "35", cost: "12.00", total: "420.00" },
      { name: "Vitamin C 1000mg Efferv.", strength: "20 Tablets Tube", qty: "45", cost: "28.00", total: "1,260.00" },
    ];

    let y = 400;
    ctx.font = "14px sans-serif";
    demoRows.forEach((row, i) => {
      ctx.fillStyle = i % 2 === 0 ? "#ffffff" : "#f8fafc";
      ctx.fillRect(60, y - 25, canvas.width - 120, 38);

      ctx.fillStyle = "#0f172a";
      ctx.fillText(row.name, 80, y);
      ctx.fillStyle = "#475569";
      ctx.fillText(row.strength, 420, y);
      ctx.fillText(row.qty, 630, y);
      ctx.fillText(row.cost, 730, y);
      ctx.fillStyle = "#0f172a";
      ctx.fillText(row.total, 840, y);
      y += 42;
    });

    // Total box
    ctx.strokeStyle = "#cbd5e1";
    ctx.strokeRect(650, y + 20, 290, 80);
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText("GRAND TOTAL: GHS 5,975.00", 670, y + 65);

    const demoUrl = canvas.toDataURL("image/jpeg", 0.92);
    setImageFile(demoUrl);
    toast.success("Loaded demo invoice for Ernest Chemists Ltd!");
  }

  async function handleAnalyzeInvoice() {
    if (!imageFile) {
      toast.error("Please upload or snap an invoice photo first");
      return;
    }

    setAnalyzing(true);
    try {
      const res = await apiFetch<{
        status: string;
        data: { distributor?: string; invoiceNumber?: string; items: ExtractedInvoiceItem[] };
      }>("/products/scan/invoice", {
        method: "POST",
        body: JSON.stringify({
          imageBase64: imageFile,
          mimeType: fileType === "pdf" ? "application/pdf" : "image/jpeg",
        }),
      });

      if (res.data && res.data.items && res.data.items.length > 0) {
        setDistributor(res.data.distributor || "Wholesale Distributor");
        setInvoiceNumber(res.data.invoiceNumber || "");
        setItems(res.data.items.map((it) => ({ ...it, selected: true })));
        toast.success(`Extracted ${res.data.items.length} medicines from invoice!`);
      } else {
        toast.info("No distinct medicines could be parsed from the document.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to analyze wholesaler invoice");
    } finally {
      setAnalyzing(false);
    }
  }

  function applyGlobalMarkup(percent: number) {
    setMarkupPercent(percent);
    setItems((prev) =>
      prev.map((item) => {
        if (item.costPrice) {
          const newPrice = Math.round(item.costPrice * (1 + percent / 100) * 100) / 100;
          return { ...item, price: newPrice };
        }
        return item;
      })
    );
    toast.success(`Applied +${percent}% retail markup`);
  }

  function updateItem(id: string, updates: Partial<ExtractedInvoiceItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...updates } : it)));
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  function toggleAllSelection() {
    const allSelected = items.every((i) => i.selected);
    setItems((prev) => prev.map((i) => ({ ...i, selected: !allSelected })));
  }

  async function handleBatchImport() {
    const selectedItems = items.filter((i) => i.selected);
    if (selectedItems.length === 0) {
      toast.error("Please select at least one product to import");
      return;
    }

    setImporting(true);
    try {
      const payload = selectedItems.map((it) => ({
        name: it.name,
        sku: it.sku,
        barcode: it.barcode,
        price: it.price,
        costPrice: it.costPrice,
        stockQuantity: it.quantity,
        dosageForm: it.dosageForm,
        strength: it.strength,
        activeIngredients: it.activeIngredients,
        manufacturer: it.manufacturer || distributor || undefined,
        categoryName: it.categoryName,
        description: it.description,
        batchNumber: it.batchNumber,
        expiryDate: it.expiryDate,
        requiresPrescription: it.requiresPrescription,
      }));

      const res = await apiFetch<{ status: string; createdCount: number }>("/products/batch", {
        method: "POST",
        body: JSON.stringify({ products: payload }),
      });

      toast.success(`Successfully imported ${res.createdCount} products into inventory!`);
      onProductsImported();
      handleClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to batch import products");
    } finally {
      setImporting(false);
    }
  }

  function handleClose() {
    stopCamera();
    setImageFile(null);
    setItems([]);
    setDistributor("");
    setInvoiceNumber("");
    onClose();
  }

  if (!isOpen) return null;

  const selectedCount = items.filter((i) => i.selected).length;
  const totalCost = items
    .filter((i) => i.selected)
    .reduce((acc, it) => acc + (it.costPrice || 0) * it.quantity, 0);
  const totalRetail = items
    .filter((i) => i.selected)
    .reduce((acc, it) => acc + it.price * it.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full ${
          items.length > 0 ? "max-w-5xl" : "max-w-2xl"
        } bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/70 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Wholesaler Invoice OCR
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40">
                  AI Table Extraction
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Snap or upload distributor delivery note to import multiple medicines at once
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* STEP 1: UPLOAD / CAMERA SELECTION */}
          {items.length === 0 ? (
            <div className="space-y-5">
              {/* Tab Selector */}
              <div className="flex items-center justify-between gap-2 p-1.5 bg-slate-100 dark:bg-slate-900/60 rounded-2xl">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("upload");
                      stopCamera();
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      activeTab === "upload"
                        ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <Upload className="h-3.5 w-3.5" /> Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("camera");
                      startCamera();
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      activeTab === "camera"
                        ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <Camera className="h-3.5 w-3.5" /> Snap with Camera
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleLoadDemoInvoice}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors border border-emerald-200 dark:border-emerald-800"
                  title="Try sample delivery note with 7 medicines"
                >
                  ⚡ Try Demo Invoice
                </button>
              </div>

              {/* Upload Tab */}
              {activeTab === "upload" && (
                <div>
                  {imageFile ? (
                    <div className="space-y-4">
                      {fileType === "pdf" ? (
                        <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md bg-slate-900/10 flex flex-col items-center justify-center gap-4 py-8">
                          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-500">
                            <FileText className="h-10 w-10" />
                          </div>
                          <div className="text-center space-y-1">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">PDF Document Loaded</p>
                            <p className="text-xs text-slate-400">Ready to extract medicines via AI document analysis</p>
                          </div>
                          <iframe
                            src={imageFile ?? ""}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white"
                            style={{ height: "220px" }}
                            title="PDF preview"
                          />
                          <button
                            type="button"
                            onClick={() => { setImageFile(null); setFileType("image"); }}
                            className="px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black/90 text-white text-xs font-semibold backdrop-blur-sm transition-all"
                          >
                            Remove & Change File
                          </button>
                        </div>
                      ) : (
                        <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md bg-slate-900/10 max-h-80 flex items-center justify-center">
                          <img src={imageFile!} alt="Selected Invoice" className="max-h-80 object-contain" />
                          <button
                            type="button"
                            onClick={() => setImageFile(null)}
                            className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black/90 text-white text-xs font-semibold backdrop-blur-sm transition-all"
                          >
                            Change Photo
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-slate-500">Document ready for OCR</span>
                        <button
                          type="button"
                          disabled={analyzing}
                          onClick={handleAnalyzeInvoice}
                          className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
                        >
                          {analyzing ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Reading Medicines with AI...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4" />
                              <span>Extract Medicines from Invoice</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all ${
                        isDragging
                          ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
                          : "border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-900/20 hover:border-emerald-400"
                      }`}
                    >
                      <label className="cursor-pointer flex flex-col items-center justify-center space-y-3 py-4">
                        <div className="p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 ring-8 ring-emerald-500/5">
                          <Upload className="h-7 w-7" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            Click to upload or drag & drop invoice
                          </p>
                          <p className="text-xs text-slate-400">
                            PNG, JPG, JPEG, WebP or <span className="font-semibold text-red-500">PDF</span> • Receipt, delivery slip, or supplier document
                          </p>
                        </div>
                        <span className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-colors">
                          Browse Files
                        </span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* Camera Tab */}
              {activeTab === "camera" && (
                <div className="space-y-4">
                  <div className="relative w-full h-80 bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
                    <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />

                    {cameraActive && (
                      <div className="absolute inset-0 pointer-events-none border-2 border-emerald-400/40 rounded-3xl m-6">
                        <div className="absolute top-2 left-2 text-[10px] font-mono text-emerald-400 bg-black/60 px-2 py-0.5 rounded-md">
                          Align invoice document inside frame
                        </div>
                      </div>
                    )}

                    {cameraError && (
                      <div className="absolute inset-0 p-4 flex flex-col items-center justify-center text-center bg-slate-900/90 text-slate-300 space-y-2">
                        <AlertCircle className="h-6 w-6 text-amber-400" />
                        <p className="text-xs">{cameraError}</p>
                        <button
                          type="button"
                          onClick={startCamera}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-white"
                        >
                          Retry Camera
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      disabled={!cameraActive}
                      onClick={takeSnapshot}
                      className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all"
                    >
                      <Camera className="h-4 w-4" />
                      <span>Take Snapshot & Analyze</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* STEP 2: STAGING GRID OF EXTRACTED MEDICINES */
            <div className="space-y-5">
              {/* Executive Summary Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold block">
                    Medicines Detected
                  </span>
                  <span className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                    {selectedCount} <span className="text-xs font-normal text-emerald-600">of {items.length} items</span>
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">
                    Total Wholesale Cost
                  </span>
                  <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    GHS {totalCost.toFixed(2)}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">
                    Expected Retail Revenue
                  </span>
                  <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    GHS {totalRetail.toFixed(2)}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/40">
                  <span className="text-[11px] text-teal-700 dark:text-teal-300 font-semibold block">
                    Estimated Gross Margin
                  </span>
                  <span className="text-lg font-bold text-teal-900 dark:text-teal-100">
                    GHS {(totalRetail - totalCost).toFixed(2)}{" "}
                    <span className="text-xs font-normal text-teal-600">
                      ({totalCost > 0 ? Math.round(((totalRetail - totalCost) / totalRetail) * 100) : 0}%)
                    </span>
                  </span>
                </div>
              </div>

              {/* Distributor & Controls Toolbar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-xs">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <span className="font-bold text-slate-800 dark:text-slate-100">{distributor}</span>
                  {invoiceNumber && (
                    <span className="text-slate-400 font-mono text-[11px]">#{invoiceNumber}</span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold">
                    Set Markup:
                  </span>
                  {[15, 20, 25, 30].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => applyGlobalMarkup(p)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                        markupPercent === p
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      +{p}%
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setItems([]);
                      setImageFile(null);
                    }}
                    className="ml-2 px-3 py-1 rounded-xl text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    Scan Another
                  </button>
                </div>
              </div>

              {/* Editable Staging Table */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-slate-850">
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-900/60 sticky top-0 z-10 text-slate-600 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                      <tr>
                        <th className="p-3 w-8">
                          <input
                            type="checkbox"
                            checked={items.length > 0 && items.every((i) => i.selected)}
                            onChange={toggleAllSelection}
                            className="h-3.5 w-3.5 rounded accent-emerald-600 cursor-pointer"
                          />
                        </th>
                        <th className="p-3">Medicine & Strength</th>
                        <th className="p-3 w-28">Category</th>
                        <th className="p-3 w-20 text-center">Pack Qty</th>
                        <th className="p-3 w-24 text-center">Cost (GHS)</th>
                        <th className="p-3 w-24 text-center">Retail (GHS)</th>
                        <th className="p-3 w-10 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      {items.map((item) => (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors ${
                            !item.selected ? "opacity-40" : ""
                          }`}
                        >
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={item.selected}
                              onChange={(e) => updateItem(item.id, { selected: e.target.checked })}
                              className="h-3.5 w-3.5 rounded accent-emerald-600 cursor-pointer"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateItem(item.id, { name: e.target.value })}
                              className="w-full font-semibold text-slate-800 dark:text-slate-100 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 outline-none pb-0.5"
                            />
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 font-mono">
                              {item.strength && <span>{item.strength}</span>}
                              {item.dosageForm && <span>• {item.dosageForm}</span>}
                              {item.batchNumber && <span>• Lot: {item.batchNumber}</span>}
                            </div>
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              value={item.categoryName || ""}
                              onChange={(e) => updateItem(item.id, { categoryName: e.target.value })}
                              className="w-24 text-slate-600 dark:text-slate-300 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 outline-none pb-0.5"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })
                              }
                              className="w-14 p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none text-center font-bold"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              step="0.01"
                              value={item.costPrice ?? ""}
                              onChange={(e) => {
                                const cost = parseFloat(e.target.value) || 0;
                                updateItem(item.id, {
                                  costPrice: cost,
                                  price: Math.round(cost * (1 + markupPercent / 100) * 100) / 100,
                                });
                              }}
                              className="w-20 p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none text-center font-medium"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              step="0.01"
                              value={item.price}
                              onChange={(e) =>
                                updateItem(item.id, { price: parseFloat(e.target.value) || 0 })
                              }
                              className="w-20 p-1 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 font-bold outline-none text-center"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {selectedCount} of {items.length} medicines selected for creation
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={importing || selectedCount === 0}
                    onClick={handleBatchImport}
                    className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Importing into Inventory...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Import Selected ({selectedCount} Products)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
