"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Scan,
  Barcode,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Package,
  Plus,
  RefreshCw,
  Zap,
  Check,
  AlertCircle,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { ScannedProductData } from "./ProductScannerModal";

interface ContinuousScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: () => void;
}

interface IntakeSessionItem {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  quantity: number;
  category: string;
  timestamp: Date;
}

export default function ContinuousScannerModal({
  isOpen,
  onClose,
  onProductCreated,
}: ContinuousScannerModalProps) {
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [saving, setSaving] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [currentScanned, setCurrentScanned] = useState<ScannedProductData | null>(null);
  const [inputPrice, setInputPrice] = useState<string>("25.00");
  const [inputQty, setInputQty] = useState<string>("10");
  const [sessionItems, setSessionItems] = useState<IntakeSessionItem[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const barcodeBuffer = useRef<string>("");
  const lastKeyTime = useRef<number>(0);
  const priceInputRef = useRef<HTMLInputElement | null>(null);

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
    } catch {}
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
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
        setScanning(true);
      }
    } catch (err: any) {
      setCameraError(err.message || "Failed to start camera");
      setScanning(false);
    }
  }, [stopCamera]);

  // Keydown listener for USB/Bluetooth barcode guns
  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      // Don't intercept if user is typing into price/quantity inputs
      if (
        document.activeElement?.tagName === "INPUT" &&
        (document.activeElement as HTMLElement).id !== "barcode-scan-input"
      ) {
        return;
      }

      const now = Date.now();
      if (now - lastKeyTime.current > 100) barcodeBuffer.current = "";
      lastKeyTime.current = now;

      if (e.key === "Enter") {
        if (barcodeBuffer.current.length >= 6) {
          const code = barcodeBuffer.current.trim();
          barcodeBuffer.current = "";
          handleScanBarcode(code);
        }
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  // BarcodeDetector camera loop
  useEffect(() => {
    if (!isOpen || !scanning || currentScanned) return;

    let active = true;
    if (!("BarcodeDetector" in window)) return;

    const detector = new (window as any).BarcodeDetector({
      formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39"],
    });

    const interval = setInterval(async () => {
      if (!active || !videoRef.current || videoRef.current.readyState < 2) return;
      try {
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes?.length > 0) {
          const code = barcodes[0].rawValue;
          if (code) {
            playBeep();
            active = false;
            clearInterval(interval);
            handleScanBarcode(code);
          }
        }
      } catch {}
    }, 250);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isOpen, scanning, currentScanned, playBeep]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, startCamera, stopCamera]);

  async function handleScanBarcode(code: string) {
    if (!code || !code.trim()) return;
    setLookingUp(true);

    try {
      const res = await apiFetch<{ status: string; data: ScannedProductData }>(
        `/products/scan/barcode/${encodeURIComponent(code.trim())}`
      );

      if (res.data) {
        playBeep();
        setCurrentScanned(res.data);
        setInputPrice(res.data.price ? res.data.price.toFixed(2) : "25.00");
        setInputQty(res.data.stockQuantity ? String(res.data.stockQuantity) : "10");
        toast.info(`Scanned: ${res.data.name || code}`);
        setTimeout(() => priceInputRef.current?.focus(), 100);
      }
    } catch {
      // Fallback draft
      setCurrentScanned({
        name: `Product (${code})`,
        sku: `BAR-${code.slice(-6)}`,
        barcode: code,
        description: `Pharmaceutical item with barcode ${code}`,
        requiresPrescription: false,
      });
      setInputPrice("20.00");
      setInputQty("10");
    } finally {
      setLookingUp(false);
      setManualInput("");
    }
  }

  async function handleConfirmAndSave() {
    if (!currentScanned) return;

    const price = parseFloat(inputPrice);
    const quantity = parseInt(inputQty) || 1;

    if (!price || price <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        name: currentScanned.name || `Medicine ${currentScanned.barcode || Date.now()}`,
        sku: currentScanned.sku,
        barcode: currentScanned.barcode,
        description: currentScanned.description || `Medicine: ${currentScanned.name}`,
        price,
        stockQuantity: quantity,
        minStockAlert: currentScanned.minStockAlert || 5,
        dosageForm: currentScanned.dosageForm || null,
        strength: currentScanned.strength || null,
        activeIngredients: currentScanned.activeIngredients || null,
        manufacturer: currentScanned.manufacturer || null,
        requiresPrescription: currentScanned.requiresPrescription || false,
        newCategoryName: currentScanned.categoryName || "General Pharmaceuticals",
        images: currentScanned.images || [],
      };

      await apiFetch("/products", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      playBeep();
      toast.success(`Added ${payload.name} to inventory!`);

      // Add to session queue
      setSessionItems((prev) => [
        {
          id: `item-${Date.now()}`,
          name: payload.name,
          sku: payload.sku,
          barcode: payload.barcode,
          price,
          quantity,
          category: payload.newCategoryName,
          timestamp: new Date(),
        },
        ...prev,
      ]);

      // Reset and resume camera for immediate next scan
      setCurrentScanned(null);
      onProductCreated();
    } catch (err: any) {
      toast.error(err.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  function handleSkip() {
    setCurrentScanned(null);
  }

  function handleClose() {
    stopCamera();
    setCurrentScanned(null);
    setSessionItems([]);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 sm:gap-2">
                <span>Rapid Continuous Scanner</span>
                <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold animate-pulse">
                  Gun Mode
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                Scan box ➜ Enter price & qty ➜ Instant save loop
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Main Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 p-4 sm:p-6 overflow-y-auto flex-1">
          {/* Left Column: Viewfinder & Quick Input (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative w-full h-64 bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
              <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />

              {scanning && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                  <div className="relative w-52 h-36 border-2 border-emerald-400 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                    <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_rgba(52,211,153,0.9)] animate-bounce" />
                  </div>
                </div>
              )}

              {cameraError && (
                <div className="absolute inset-0 p-4 flex flex-col items-center justify-center text-center bg-slate-900/90 text-slate-300">
                  <AlertCircle className="h-6 w-6 text-amber-400 mb-1" />
                  <p className="text-xs">{cameraError}</p>
                </div>
              )}
            </div>

            {/* Hardware scanner / manual barcode input */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="barcode-scan-input"
                  type="text"
                  placeholder="Scan with gun or type barcode..."
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleScanBarcode(manualInput)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                type="button"
                disabled={lookingUp || !manualInput.trim()}
                onClick={() => handleScanBarcode(manualInput)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1"
              >
                {lookingUp ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Scan"}
              </button>
            </div>
          </div>

          {/* Right Column: Active Scanned Item Prompt + Session Feed (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Active Item Confirmation Form */}
            {currentScanned ? (
              <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border-2 border-emerald-400 dark:border-emerald-700 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 tracking-wider">
                      Item Detected
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {currentScanned.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                      <span>SKU: {currentScanned.sku}</span>
                      {currentScanned.barcode && <span>• Barcode: {currentScanned.barcode}</span>}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 shrink-0">
                    Ready
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Selling Price (GHS) *
                    </label>
                    <input
                      ref={priceInputRef}
                      type="number"
                      step="0.01"
                      value={inputPrice}
                      onChange={(e) => setInputPrice(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleConfirmAndSave()}
                      className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Quantity Received *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={inputQty}
                      onChange={(e) => setInputQty(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleConfirmAndSave()}
                      className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    Skip Item
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleConfirmAndSave}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Save & Next Item (Enter)
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center text-slate-400 space-y-1">
                <Scan className="h-7 w-7 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Ready to scan next box or barcode
                </p>
                <p className="text-[11px] text-slate-400">
                  Hold a medicine carton up to the camera or use your handheld barcode scanner
                </p>
              </div>
            )}

            {/* Session Intake Feed */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Intake Log ({sessionItems.length} added)</span>
                {sessionItems.length > 0 && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Total: GHS {sessionItems.reduce((acc, it) => acc + it.price * it.quantity, 0).toFixed(2)}
                  </span>
                )}
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30">
                {sessionItems.length === 0 ? (
                  <div className="py-6 text-center text-[11px] text-slate-400">
                    No items uploaded in this session yet.
                  </div>
                ) : (
                  sessionItems.map((it) => (
                    <div key={it.id} className="px-3 py-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {it.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {it.sku} • Qty: {it.quantity}
                        </span>
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        GHS {(it.price * it.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
