"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Download, FileText, CheckCircle, AlertTriangle, XCircle, Loader2, Sparkles } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface ParsedProduct {
  name: string;
  sku: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
  minStockAlert: number;
  requiresPrescription: boolean;
  isFeatured: boolean;
  dosageForm?: string;
  strength?: string;
  activeIngredients?: string;
  manufacturer?: string;
  categoryName?: string;
  _rowIndex: number;
  _errors: string[];
}

interface ImportResult {
  created: number;
  updated: number;
  errors: Array<{ row: number; message: string }>;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

const CSV_HEADERS = [
  "name",
  "sku",
  "description",
  "price",
  "compareAtPrice",
  "stockQuantity",
  "minStockAlert",
  "requiresPrescription",
  "isFeatured",
  "dosageForm",
  "strength",
  "activeIngredients",
  "manufacturer",
  "categoryName",
];

const TEMPLATE_HEADERS = [
  "name",
  "sku",
  "description",
  "price",
  "compareAtPrice",
  "stockQuantity",
  "minStockAlert",
  "requiresPrescription",
  "isFeatured",
  "dosageForm",
  "strength",
  "activeIngredients",
  "manufacturer",
  "categoryName",
];

const SAMPLE_ROWS = [
  [
    "Amoxicillin 500mg Capsules",
    "AMX-500-CAP",
    "Broad-spectrum antibiotic for bacterial infections",
    "25.50",
    "30.00",
    "150",
    "20",
    "true",
    "false",
    "Capsule",
    "500mg",
    "Amoxicillin trihydrate",
    "GSK Pharmaceuticals",
    "Antibiotics",
  ].join(","),
  [
    "Paracetamol 500mg Tablets",
    "PAR-500-TAB",
    "Pain reliever and fever reducer",
    "8.00",
    "",
    "500",
    "50",
    "false",
    "true",
    "Tablet",
    "500mg",
    "Paracetamol",
    "Emzor Pharmaceutical",
    "Pain Relief",
  ].join(","),
];

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }
  result.push(current.trim());
  return result;
}

function parseBoolean(val: string): boolean {
  const v = val.toLowerCase().trim();
  return v === "true" || v === "1" || v === "yes";
}

function parseCSV(content: string): { headers: string[]; rows: string[][] } {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map((line) => parseCSVLine(line));
  return { headers, rows };
}

function mapRowsToProducts(
  headers: string[],
  rows: string[][]
): ParsedProduct[] {
  const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());

  return rows.map((row, idx) => {
    const get = (field: string): string => {
      const i = normalizedHeaders.indexOf(field);
      return i >= 0 && i < row.length ? row[i] : "";
    };

    const errors: string[] = [];
    const name = get("name");
    const sku = get("sku");
    const description = get("description");
    const priceStr = get("price");

    if (!name) errors.push("Name is required");
    if (!sku) errors.push("SKU is required");
    if (!description) errors.push("Description is required");

    const price = priceStr ? parseFloat(priceStr) : NaN;
    if (isNaN(price) || price < 0) errors.push("Invalid price");

    return {
      name,
      sku,
      description,
      price,
      compareAtPrice: get("compareAtPrice") ? parseFloat(get("compareAtPrice")) || undefined : undefined,
      stockQuantity: get("stockQuantity") ? parseInt(get("stockQuantity"), 10) || 0 : 0,
      minStockAlert: get("minStockAlert") ? parseInt(get("minStockAlert"), 10) || 10 : 10,
      requiresPrescription: parseBoolean(get("requiresPrescription")),
      isFeatured: parseBoolean(get("isFeatured")),
      dosageForm: get("dosageForm") || undefined,
      strength: get("strength") || undefined,
      activeIngredients: get("activeIngredients") || undefined,
      manufacturer: get("manufacturer") || undefined,
      categoryName: get("categoryName") || undefined,
      _rowIndex: idx + 2,
      _errors: errors,
    };
  });
}

export default function ProductImportModal({ open, onClose, onImported }: Props) {
  const [mode, setMode] = useState<"select" | "preview" | "importing" | "results">("select");
  const [parsed, setParsed] = useState<ParsedProduct[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [autoGenerateImages, setAutoGenerateImages] = useState(true);
  const [jsonInput, setJsonInput] = useState("");
  const [inputError, setInputError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setMode("select");
    setParsed([]);
    setImportResult(null);
    setJsonInput("");
    setInputError("");
  };

  const handleClose = () => {
    if (mode === "importing") return;
    if (importResult) onImported();
    reset();
    onClose();
  };

  const handleFile = useCallback((file: File) => {
    setInputError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text.trim()) {
        setInputError("File is empty");
        return;
      }
      const { headers, rows } = parseCSV(text);
      if (headers.length === 0) {
        setInputError("Could not parse CSV headers");
        return;
      }
      const products = mapRowsToProducts(headers, rows);
      if (products.length === 0) {
        setInputError("No data rows found");
        return;
      }
      setParsed(products);
      setMode("preview");
    };
    reader.readAsText(file);
  }, []);

  const handleFileDrop = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleJsonParse = () => {
    setInputError("");
    try {
      const data = JSON.parse(jsonInput);
      const items = Array.isArray(data) ? data : data.products;
      if (!Array.isArray(items) || items.length === 0) {
        setInputError("Expected a JSON array of products");
        return;
      }
      const products: ParsedProduct[] = items.map((item: any, idx: number) => {
        const errors: string[] = [];
        if (!item.name) errors.push("Name is required");
        if (!item.sku) errors.push("SKU is required");
        if (!item.description) errors.push("Description is required");
        const price = typeof item.price === "number" ? item.price : parseFloat(item.price);
        if (isNaN(price) || price < 0) errors.push("Invalid price");

        return {
          name: item.name || "",
          sku: item.sku || "",
          description: item.description || "",
          price,
          compareAtPrice: item.compareAtPrice,
          stockQuantity: item.stockQuantity ?? 0,
          minStockAlert: item.minStockAlert ?? 10,
          requiresPrescription: item.requiresPrescription ?? false,
          isFeatured: item.isFeatured ?? false,
          dosageForm: item.dosageForm,
          strength: item.strength,
          activeIngredients: item.activeIngredients,
          manufacturer: item.manufacturer,
          categoryName: item.categoryName,
          _rowIndex: idx + 1,
          _errors: errors,
        };
      });
      setParsed(products);
      setMode("preview");
    } catch {
      setInputError("Invalid JSON");
    }
  };

  const handleImport = async () => {
    setMode("importing");
    setImporting(true);
    try {
      const products = parsed.map(({ _rowIndex, _errors, ...p }) => ({
        ...p,
        compareAtPrice: p.compareAtPrice === undefined ? null : p.compareAtPrice,
        dosageForm: p.dosageForm || null,
        strength: p.strength || null,
        activeIngredients: p.activeIngredients || null,
        manufacturer: p.manufacturer || null,
        categoryName: p.categoryName || null,
      }));

      const result = await apiFetch<ImportResult>("/products/import", {
        method: "POST",
        body: JSON.stringify({ products, autoGenerateImages }),
      });

      setImportResult(result);
      setMode("results");
      if (result.errors.length === 0) {
        toast.success(`Successfully imported ${result.created + result.updated} products`);
      } else {
        toast.warning(`Imported with ${result.errors.length} error(s)`);
      }
    } catch (err: any) {
      toast.error(err.message || "Import failed");
      setMode("preview");
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csv = [TEMPLATE_HEADERS.join(","), ...SAMPLE_ROWS].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = parsed.filter((p) => p._errors.length === 0).length;
  const errorCount = parsed.filter((p) => p._errors.length > 0).length;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-4xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
              <Upload className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {mode === "results" ? "Import Results" : "Import Products"}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {mode === "select" && "Upload a CSV or paste JSON to bulk import products"}
                {mode === "preview" && `Preview ${parsed.length} product(s) before import`}
                {mode === "importing" && "Importing products..."}
                {mode === "results" && "Import process completed"}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6">
          {/* ========== SELECT MODE ========== */}
          {mode === "select" && (
            <div className="space-y-6">
              {/* Download Template */}
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Need a template?</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Download a sample CSV with the correct column headers</p>
                  </div>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Download Template
                </button>
              </div>

              {/* File Upload */}
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-all"
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.tsv,.txt"
                  onChange={handleFileDrop}
                  className="hidden"
                />
                <Upload className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Click to upload a CSV file
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Supports .csv, .tsv, or .txt files
                </p>
              </div>

              {/* JSON Input */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 block">
                  Or paste JSON data
                </label>
                <textarea
                  rows={6}
                  placeholder={'[{"name": "Amoxicillin", "sku": "AMX-001", "description": "...", "price": 25.50}]\n\nOr: {"products": [...]}'}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-mono bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
                <button
                  onClick={handleJsonParse}
                  disabled={!jsonInput.trim()}
                  className="mt-3 px-5 py-2.5 rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 text-sm"
                >
                  Parse JSON
                </button>
              </div>

              {inputError && (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                  <XCircle className="h-4 w-4" /> {inputError}
                </p>
              )}
            </div>
          )}

          {/* ========== PREVIEW MODE ========== */}
          {mode === "preview" && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{parsed.length} row(s)</span>
                </div>
                {validCount > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-semibold text-green-700 dark:text-green-300">{validCount} valid</span>
                  </div>
                )}
                {errorCount > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm font-semibold text-red-700 dark:text-red-300">{errorCount} with errors</span>
                  </div>
                )}
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-[400px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Row</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Name</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">SKU</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Price</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Stock</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Category</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {parsed.map((p) => (
                      <tr
                        key={p._rowIndex}
                        className={
                          p._errors.length > 0
                            ? "bg-red-50/50 dark:bg-red-900/10"
                            : "hover:bg-slate-50 dark:hover:bg-slate-700/30"
                        }
                      >
                        <td className="px-3 py-2 text-slate-400 dark:text-slate-500 font-mono text-xs">{p._rowIndex}</td>
                        <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200 max-w-[180px] truncate">{p.name || "—"}</td>
                        <td className="px-3 py-2 font-mono text-xs text-slate-600 dark:text-slate-400">{p.sku || "—"}</td>
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{!isNaN(p.price) ? `GHS ${p.price.toFixed(2)}` : "—"}</td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{p.stockQuantity}</td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{p.categoryName || "—"}</td>
                        <td className="px-3 py-2">
                          {p._errors.length === 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400">
                              <CheckCircle className="h-3 w-3" /> Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
                              <XCircle className="h-3 w-3" /> {p._errors.length} error(s)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Error Details */}
              {errorCount > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> Validation Errors
                  </h4>
                  <div className="space-y-1 max-h-[120px] overflow-y-auto">
                    {parsed
                      .filter((p) => p._errors.length > 0)
                      .map((p) => (
                        <p key={p._rowIndex} className="text-xs text-red-600 dark:text-red-400">
                          <span className="font-mono">Row {p._rowIndex}</span> ({p.sku || "no SKU"}): {p._errors.join("; ")}
                        </p>
                      ))}
                  </div>
                </div>
              )}

              {/* Auto Generate Images Toggle */}
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20">
                <input
                  type="checkbox"
                  id="auto-gen-images-import"
                  checked={autoGenerateImages}
                  onChange={(e) => setAutoGenerateImages(e.target.checked)}
                  className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
                />
                <label htmlFor="auto-gen-images-import" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Auto-generate studio pharmaceutical photos for imported products missing images (DALL-E 3)</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleImport}
                  disabled={errorCount === parsed.length}
                  className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Import {validCount} Valid Product(s)
                </button>
                <button
                  onClick={() => { reset(); setMode("select"); }}
                  className="px-6 py-2.5 rounded-xl font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {/* ========== IMPORTING MODE ========== */}
          {mode === "importing" && (
            <div className="flex flex-col items-center py-12">
              <Loader2 className="h-12 w-12 text-emerald-500 animate-spin mb-4" />
              <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">Importing products...</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">This may take a moment for large batches</p>
            </div>
          )}

          {/* ========== RESULTS MODE ========== */}
          {mode === "results" && importResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300">{importResult.created}</p>
                  <p className="text-sm text-green-600 dark:text-green-400 font-semibold">Created</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{importResult.updated}</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">Updated</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-red-700 dark:text-red-300">{importResult.errors.length}</p>
                  <p className="text-sm text-red-600 dark:text-red-400 font-semibold">Errors</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2 flex items-center gap-2">
                    <XCircle className="h-4 w-4" /> Import Errors
                  </h4>
                  <div className="space-y-1 max-h-[150px] overflow-y-auto">
                    {importResult.errors.map((err, i) => (
                      <p key={i} className="text-xs text-red-600 dark:text-red-400">
                        <span className="font-mono">Row {err.row}:</span> {err.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleClose}
                  className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-emerald-700"
                >
                  Done
                </button>
                <button
                  onClick={() => { reset(); setMode("select"); }}
                  className="px-6 py-2.5 rounded-xl font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"
                >
                  Import More
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
