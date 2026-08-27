"use client";

import { useState } from "react";
import {
  X,
  FileText,
  Upload,
  Sparkles,
  Loader2,
  CheckCircle2,
  Trash2,
  Check,
  Percent,
  Layers,
  AlertCircle,
  RefreshCw,
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
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [distributor, setDistributor] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [items, setItems] = useState<ExtractedInvoiceItem[]>([]);
  const [markupPercent, setMarkupPercent] = useState<number>(25);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageFile(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleAnalyzeInvoice() {
    if (!imageFile) {
      toast.error("Please upload an invoice or receipt image first");
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
          mimeType: "image/jpeg",
        }),
      });

      if (res.data && res.data.items && res.data.items.length > 0) {
        setDistributor(res.data.distributor || "");
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
    toast.success(`Applied +${percent}% retail markup to all items`);
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

      toast.success(`Successfully added ${res.createdCount} products into inventory!`);
      onProductsImported();
      handleClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to batch import products");
    } finally {
      setImporting(false);
    }
  }

  function handleClose() {
    setImageFile(null);
    setItems([]);
    setDistributor("");
    setInvoiceNumber("");
    onClose();
  }

  if (!isOpen) return null;

  const selectedCount = items.filter((i) => i.selected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Wholesaler Invoice / Receipt OCR
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload paper distributor delivery note to extract all medicines and bulk-import inventory
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
          {/* STEP 1: UPLOAD / SNAP INVOICE IMAGE */}
          {items.length === 0 ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-8 text-center bg-slate-50/50 dark:bg-slate-900/20">
                {imageFile ? (
                  <div className="space-y-4 max-w-md mx-auto">
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md max-h-72">
                      <img src={imageFile} alt="Invoice Document" className="w-full object-contain" />
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setImageFile(null)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        Change Photo
                      </button>
                      <button
                        type="button"
                        disabled={analyzing}
                        onClick={handleAnalyzeInvoice}
                        className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                      >
                        {analyzing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Reading Invoice Table with AI...</span>
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
                  <label className="cursor-pointer flex flex-col items-center justify-center space-y-3 py-6">
                    <div className="p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                      <Upload className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        Upload or drop distributor invoice photo (PNG, JPG, WebP)
                      </p>
                      <p className="text-xs text-slate-400">
                        Supports delivery notes from Ernest Chemists, Tobinco, Kinapharma, Ayrton, etc.
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          ) : (
            /* STEP 2: STAGING GRID OF EXTRACTED MEDICINES */
            <div className="space-y-4">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      {items.length} Medicines Extracted
                    </span>
                    {distributor && (
                      <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                        from {distributor}
                      </span>
                    )}
                  </div>
                  {invoiceNumber && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block">
                      Ref: {invoiceNumber}
                    </span>
                  )}
                </div>

                {/* Markup shortcuts */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">Markup:</span>
                  {[15, 20, 25, 30].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => applyGlobalMarkup(p)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                        markupPercent === p
                          ? "bg-emerald-600 text-white"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
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
                    className="ml-2 px-2.5 py-1 rounded-lg text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    Scan Another
                  </button>
                </div>
              </div>

              {/* Editable Staging Table */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-900/60 sticky top-0 z-10 text-slate-600 dark:text-slate-400 uppercase font-semibold text-[10px]">
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
                        <th className="p-3">Category</th>
                        <th className="p-3 w-20">Quantity</th>
                        <th className="p-3 w-24">Cost (GHS)</th>
                        <th className="p-3 w-24">Retail (GHS)</th>
                        <th className="p-3 w-10 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      {items.map((item) => (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors ${
                            !item.selected ? "opacity-50" : ""
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
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
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
                              className="w-28 text-slate-600 dark:text-slate-300 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 outline-none pb-0.5"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })
                              }
                              className="w-16 p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none text-center font-bold"
                            />
                          </td>
                          <td className="p-3">
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
                              className="w-20 p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none text-center"
                            />
                          </td>
                          <td className="p-3">
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
                              className="p-1 rounded-md text-slate-400 hover:text-red-600 transition-colors"
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
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={importing || selectedCount === 0}
                    onClick={handleBatchImport}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all"
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
