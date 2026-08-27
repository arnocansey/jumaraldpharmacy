"use client";

import { useState, useMemo } from "react";
import { X, Search, BookOpen, Check, Pill, ShieldAlert, Sparkles, Filter } from "lucide-react";
import { STANDARD_FORMULARY, FormularyDrug } from "@/data/standardFormulary";
import { ScannedProductData } from "./ProductScannerModal";

interface StandardFormularyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDrug: (data: ScannedProductData) => void;
}

export default function StandardFormularyModal({
  isOpen,
  onClose,
  onSelectDrug,
}: StandardFormularyModalProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = useMemo(() => {
    const set = new Set(STANDARD_FORMULARY.map((d) => d.category));
    return ["All", ...Array.from(set)];
  }, []);

  const filteredDrugs = useMemo(() => {
    return STANDARD_FORMULARY.filter((drug) => {
      const matchesCat = selectedCategory === "All" || drug.category === selectedCategory;
      const query = search.toLowerCase().trim();
      const matchesSearch =
        !query ||
        drug.name.toLowerCase().includes(query) ||
        drug.genericName.toLowerCase().includes(query) ||
        drug.activeIngredients.toLowerCase().includes(query) ||
        (drug.manufacturer && drug.manufacturer.toLowerCase().includes(query));
      return matchesCat && matchesSearch;
    });
  }, [search, selectedCategory]);

  function handleSelect(drug: FormularyDrug) {
    const cleanName = drug.name.replace(/[^a-zA-Z0-9\s]/g, "").trim().split(/\s+/);
    const prefix = cleanName.slice(0, 2).map((w) => w.slice(0, 3).toUpperCase()).join("-");
    const sku = `${prefix || "MED"}-${drug.strength.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const data: ScannedProductData = {
      name: drug.name,
      sku,
      description: drug.description,
      price: drug.typicalPrice,
      dosageForm: drug.dosageForm,
      strength: drug.strength,
      activeIngredients: drug.activeIngredients,
      usageInstructions: drug.usageInstructions,
      sideEffects: drug.sideEffects,
      warnings: drug.warnings,
      manufacturer: drug.manufacturer,
      categoryName: drug.category,
      requiresPrescription: drug.requiresPrescription,
      stockQuantity: 20,
      minStockAlert: 5,
      source: "standard_formulary",
      confidence: 1.0,
    };

    onSelectDrug(data);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Standard Drug Formulary Library
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold">
                  Ghana / Essential Medicines
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                1-click clone verified clinical descriptions, dosages, active ingredients, and warnings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700/80 space-y-3 bg-white dark:bg-slate-800">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by commercial name, generic name, active ingredients (e.g. Artemether, Amoxicillin, Paracetamol)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0 mr-1" />
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Formulary List Grid */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {filteredDrugs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
              No medications matching your query. Try another search term.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredDrugs.map((drug) => (
                <div
                  key={drug.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-800 transition-all flex flex-col justify-between group shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {drug.name}
                        </h4>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          {drug.genericName}
                        </p>
                      </div>
                      {drug.requiresPrescription ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 shrink-0">
                          Rx
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                          OTC
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {drug.description}
                    </p>

                    <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                      <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {drug.dosageForm}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono">
                        {drug.strength}
                      </span>
                      {drug.manufacturer && (
                        <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {drug.manufacturer}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-700/60">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      GHS {drug.typicalPrice.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelect(drug)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Check className="h-3.5 w-3.5" /> Clone into Form
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
