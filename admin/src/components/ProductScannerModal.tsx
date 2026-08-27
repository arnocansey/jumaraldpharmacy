"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Scan,
  Camera,
  Sparkles,
  Barcode,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  Image as ImageIcon,
  Check,
  Zap,
} from "lucide-react";
import { apiFetch, apiUpload } from "@/lib/api";
import { toast } from "sonner";

export interface ScannedProductData {
  name: string;
  sku: string;
  barcode?: string;
  description: string;
  price?: number;
  compareAtPrice?: number;
  stockQuantity?: number;
  minStockAlert?: number;
  dosageForm?: string;
  strength?: string;
  activeIngredients?: string;
  usageInstructions?: string;
  sideEffects?: string;
  warnings?: string;
  manufacturer?: string;
  categoryName?: string;
  requiresPrescription?: boolean;
  images?: string[];
  source?: string;
  existingProductId?: string;
  confidence?: number;
}

interface ProductScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: ScannedProductData, photoUrl?: string) => void;
  categories: Array<{ id: string; name: string }>;
}

export default function ProductScannerModal({
  isOpen,
  onClose,
  onApply,
  categories,
}: ProductScannerModalProps) {
  const [mode, setMode] = useState<"barcode" | "ai_vision">("barcode");
  const [scanning, setScanning] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState("");
  const [scannedResult, setScannedResult] = useState<ScannedProductData | null>(null);
  const [attachPhoto, setAttachPhoto] = useState(true);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const barcodeGunBuffer = useRef<string>("");
  const lastKeyTime = useRef<number>(0);

  // Beep sound on successful detection
  const playBeep = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio not permitted or supported
    }
  }, []);

  // Stop camera stream safely
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  // Start camera stream
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera access is not supported by your browser");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setScanning(true);
      }
    } catch (err: any) {
      console.warn("Camera start failed:", err);
      setCameraError(
        err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access or use manual input / upload."
          : err.message || "Failed to start camera."
      );
      setScanning(false);
    }
  }, [facingMode, stopCamera]);

  // Handle hardware barcode scanner gun (keyboard wedge)
  useEffect(() => {
    if (!isOpen || scannedResult) return;

    function handleKeyDown(e: KeyboardEvent) {
      const now = Date.now();
      // Most barcode scanners type characters in rapid succession (< 50ms)
      if (now - lastKeyTime.current > 100) {
        barcodeGunBuffer.current = "";
      }
      lastKeyTime.current = now;

      if (e.key === "Enter") {
        if (barcodeGunBuffer.current.length >= 6) {
          const code = barcodeGunBuffer.current.trim();
          barcodeGunBuffer.current = "";
          handleLookupBarcode(code);
        }
      } else if (e.key.length === 1) {
        barcodeGunBuffer.current += e.key;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, scannedResult]);

  // Barcode detection loop via native BarcodeDetector API if available
  useEffect(() => {
    if (!isOpen || !scanning || mode !== "barcode" || scannedResult) return;

    let active = true;
    const hasBarcodeDetector = "BarcodeDetector" in window;

    if (!hasBarcodeDetector) {
      return () => { active = false; };
    }

    const detector = new (window as any).BarcodeDetector({
      formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"],
    });

    const interval = setInterval(async () => {
      if (!active || !videoRef.current || videoRef.current.readyState < 2) return;
      try {
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes && barcodes.length > 0) {
          const rawCode = barcodes[0].rawValue;
          if (rawCode) {
            playBeep();
            active = false;
            clearInterval(interval);
            stopCamera();
            handleLookupBarcode(rawCode);
          }
        }
      } catch {
        // Frame detection error, continue next frame
      }
    }, 250);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isOpen, scanning, mode, scannedResult, playBeep, stopCamera]);

  // Start / stop camera on modal open / mode change
  useEffect(() => {
    if (isOpen && !scannedResult) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, mode, scannedResult, startCamera, stopCamera]);

  // Look up a barcode against backend API
  async function handleLookupBarcode(code: string) {
    if (!code || !code.trim()) {
      toast.error("Please enter a valid barcode");
      return;
    }

    setAnalyzing(true);
    try {
      const res = await apiFetch<{ status: string; data: ScannedProductData }>(
        `/products/scan/barcode/${encodeURIComponent(code.trim())}`
      );

      if (res.data) {
        playBeep();
        setScannedResult(res.data);
        toast.success(`Product details retrieved! (${res.data.name || code})`);
      } else {
        toast.info("No product details found for this barcode. Scaffold created.");
        setScannedResult({
          name: "",
          sku: `BAR-${code.slice(-6)}`,
          barcode: code,
          description: "",
          requiresPrescription: false,
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to look up barcode");
    } finally {
      setAnalyzing(false);
    }
  }

  // Snap photo from live camera feed
  function handleCaptureSnapshot() {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

    setCapturedPhoto(dataUrl);
    stopCamera();
  }

  // Handle image file upload for AI Packaging Scan
  function handleImageFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCapturedPhoto(reader.result as string);
      stopCamera();
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  // Send photo to backend for Gemini Vision packaging extraction
  async function handleAnalyzePackaging() {
    if (!capturedPhoto) {
      toast.error("Please take a photo or upload an image first");
      return;
    }

    setAnalyzing(true);
    try {
      const res = await apiFetch<{ status: string; data: ScannedProductData }>(
        "/products/scan/ai-image",
        {
          method: "POST",
          body: JSON.stringify({
            imageBase64: capturedPhoto,
            mimeType: "image/jpeg",
          }),
        }
      );

      if (res.data) {
        playBeep();
        setScannedResult(res.data);
        toast.success(`AI analyzed packaging: ${res.data.name}`);
      }
    } catch (err: any) {
      toast.error(err.message || "AI packaging analysis failed. Please check Gemini API key.");
    } finally {
      setAnalyzing(false);
    }
  }

  // Auto-fill and apply details back to the parent Product Form
  async function handleApplyToForm() {
    if (!scannedResult) return;

    let uploadedUrl: string | undefined = undefined;

    // If admin checked "Attach scanned photo as product image" and we have a captured photo
    if (attachPhoto && capturedPhoto && capturedPhoto.startsWith("data:")) {
      try {
        toast.loading("Uploading packaging photo to gallery...");
        // Convert base64 to File object
        const res = await fetch(capturedPhoto);
        const blob = await res.blob();
        const file = new File([blob], `scanned-${Date.now()}.jpg`, { type: "image/jpeg" });
        const uploadRes = await apiUpload(file);
        if (uploadRes && uploadRes.url) {
          uploadedUrl = uploadRes.url;
        }
      } catch (err) {
        console.warn("Failed to upload photo automatically:", err);
      } finally {
        toast.dismiss();
      }
    }

    onApply(scannedResult, uploadedUrl);
    toast.success("Product form auto-filled with scanned details!");
    handleCloseModal();
  }

  function handleResetScanner() {
    setScannedResult(null);
    setCapturedPhoto(null);
    setManualBarcode("");
    startCamera();
  }

  function handleCloseModal() {
    stopCamera();
    setScannedResult(null);
    setCapturedPhoto(null);
    setManualBarcode("");
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
              <Scan className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Scan Product to Auto-Fill
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scan barcode or capture packaging box to populate all pharmaceutical details
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseModal}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Mode Switcher Tabs */}
          {!scannedResult && (
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 dark:bg-slate-900/60 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setMode("barcode");
                  setCapturedPhoto(null);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  mode === "barcode"
                    ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Barcode className="h-4 w-4" />
                Barcode / UPC Scanner
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("ai_vision");
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  mode === "ai_vision"
                    ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Sparkles className="h-4 w-4 text-emerald-500" />
                AI Packaging / Box Scan
              </button>
            </div>
          )}

          {/* VIEW 1: PREVIEW EXTRACTED DETAILS (If scan succeeded) */}
          {scannedResult ? (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Status banner */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs">
                  <span className="font-bold text-emerald-900 dark:text-emerald-200 block text-sm">
                    Product Details Extracted Successfully
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400">
                    Source:{" "}
                    {scannedResult.source === "local_database"
                      ? "Jumarald Existing Catalog"
                      : scannedResult.source === "external_registry"
                      ? "Official Drug Registry (FDA / Open Products)"
                      : scannedResult.source === "ai_vision"
                      ? "Gemini AI Packaging Vision"
                      : "AI Clinical Synthesis"}
                  </span>
                </div>
              </div>

              {/* Parsed Fields Grid */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Product Name
                    </span>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                      {scannedResult.name || "Unnamed Product"}
                    </h3>
                  </div>
                  {scannedResult.requiresPrescription && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                      Rx Required
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60">
                    <span className="text-slate-400 block text-[10px]">SKU</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {scannedResult.sku}
                    </span>
                  </div>
                  {scannedResult.barcode && (
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60">
                      <span className="text-slate-400 block text-[10px]">Barcode</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {scannedResult.barcode}
                      </span>
                    </div>
                  )}
                  {scannedResult.dosageForm && (
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60">
                      <span className="text-slate-400 block text-[10px]">Dosage Form</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {scannedResult.dosageForm}
                      </span>
                    </div>
                  )}
                  {scannedResult.strength && (
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60">
                      <span className="text-slate-400 block text-[10px]">Strength</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {scannedResult.strength}
                      </span>
                    </div>
                  )}
                  {scannedResult.manufacturer && (
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 col-span-2 sm:col-span-1">
                      <span className="text-slate-400 block text-[10px]">Manufacturer</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                        {scannedResult.manufacturer}
                      </span>
                    </div>
                  )}
                </div>

                {scannedResult.activeIngredients && (
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                      Active Ingredients
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60">
                      {scannedResult.activeIngredients}
                    </p>
                  </div>
                )}

                {scannedResult.description && (
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                      Description
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60">
                      {scannedResult.description}
                    </p>
                  </div>
                )}

                {/* Option to attach photo */}
                {capturedPhoto && (
                  <label className="flex items-center gap-2.5 pt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={attachPhoto}
                      onChange={(e) => setAttachPhoto(e.target.checked)}
                      className="h-4 w-4 rounded accent-emerald-600"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5 text-emerald-600" />
                      Attach scanned packaging photo to product image gallery
                    </span>
                  </label>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetScanner}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Scan Another
                </button>
                <button
                  type="button"
                  onClick={handleApplyToForm}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
                >
                  <Check className="h-4 w-4" /> Auto-Fill Product Form
                </button>
              </div>
            </div>
          ) : (
            /* VIEW 2: ACTIVE SCANNING INTERFACE */
            <div className="space-y-5">
              {/* Live Camera Viewfinder & Container */}
              <div className="relative w-full h-72 sm:h-80 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner">
                {capturedPhoto ? (
                  <img
                    src={capturedPhoto}
                    alt="Captured Packaging"
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Viewfinder Target Overlay */}
                    {scanning && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                        <div className="relative w-64 h-48 sm:w-80 sm:h-52 border-2 border-emerald-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                          {/* Corner highlights */}
                          <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                          <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                          <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                          {/* Animated Laser Scanning Line */}
                          <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_rgba(52,211,153,0.9)] animate-bounce" />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Camera error message overlay */}
                {cameraError && !capturedPhoto && (
                  <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center bg-slate-900/90 text-slate-300 space-y-2">
                    <AlertCircle className="h-8 w-8 text-amber-400" />
                    <p className="text-xs max-w-sm">{cameraError}</p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="mt-2 px-3 py-1.5 rounded-lg text-xs bg-emerald-600 text-white hover:bg-emerald-700 font-semibold"
                    >
                      Retry Camera
                    </button>
                  </div>
                )}

                {/* Camera Control Overlays */}
                {!capturedPhoto && scanning && (
                  <div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-auto">
                    <button
                      type="button"
                      onClick={() =>
                        setFacingMode((prev) =>
                          prev === "environment" ? "user" : "environment"
                        )
                      }
                      className="p-2 rounded-xl bg-black/60 backdrop-blur-md text-white hover:bg-black/80 text-xs flex items-center gap-1.5 border border-white/10"
                      title="Flip camera"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Flip</span>
                    </button>

                    {mode === "ai_vision" && (
                      <button
                        type="button"
                        onClick={handleCaptureSnapshot}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/30"
                      >
                        <Camera className="h-4 w-4" /> Capture Photo
                      </button>
                    )}
                  </div>
                )}

                {/* Photo retake button if already snapped */}
                {capturedPhoto && (
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCapturedPhoto(null);
                        startCamera();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md text-white hover:bg-black/90 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Retake Photo
                    </button>
                  </div>
                )}
              </div>

              {/* SUB-PANEL A: Barcode mode controls */}
              {mode === "barcode" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Scan or type barcode digits (e.g. 300450449108)..."
                        value={manualBarcode}
                        onChange={(e) => setManualBarcode(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleLookupBarcode(manualBarcode)}
                        className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={analyzing || !manualBarcode.trim()}
                      onClick={() => handleLookupBarcode(manualBarcode)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      {analyzing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                      Look Up
                    </button>
                  </div>

                  {/* Sample test barcodes for quick testing */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                    <span>Quick test:</span>
                    {[
                      { label: "Amoxicillin (FDA)", code: "0093-2264-01" },
                      { label: "Tylenol / Paracetamol", code: "300450449108" },
                      { label: "Ibuprofen 200mg", code: "305730164208" },
                    ].map((sample) => (
                      <button
                        key={sample.code}
                        type="button"
                        onClick={() => {
                          setManualBarcode(sample.code);
                          handleLookupBarcode(sample.code);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 text-slate-600 dark:text-slate-300 font-mono transition-colors"
                      >
                        {sample.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* SUB-PANEL B: AI Vision packaging scan controls */}
              {mode === "ai_vision" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* File upload trigger */}
                    <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 border-2 border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 p-3 rounded-xl transition-colors">
                      <Upload className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        Upload Packaging Photo (Box / Bottle)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileSelect}
                        className="hidden"
                      />
                    </label>

                    {/* Analyze button */}
                    <button
                      type="button"
                      disabled={analyzing || !capturedPhoto}
                      onClick={handleAnalyzePackaging}
                      className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
                    >
                      {analyzing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Analyzing Packaging with AI...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          <span>Analyze Packaging with AI</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    💡 <strong>Tip:</strong> Hold the medication box or bottle label clearly inside
                    the frame with good lighting. Gemini Vision will extract the product name, dosage
                    form, active ingredients, instructions, and warnings.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
