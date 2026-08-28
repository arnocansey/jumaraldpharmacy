"use client";

import {
  X,
  Zap,
  Barcode,
  FileText,
  Mic,
  BookOpen,
  PlusCircle,
  ArrowRight,
  Sparkles,
  Camera,
} from "lucide-react";

export type UploadPreferenceMode =
  | "quick_form"
  | "detailed_form"
  | "continuous_scan"
  | "invoice_ocr"
  | "voice_dictation"
  | "formulary"
  | "live_camera";

interface ProductUploadHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: UploadPreferenceMode) => void;
}

export default function ProductUploadHubModal({
  isOpen,
  onClose,
  onSelectMode,
}: ProductUploadHubModalProps) {
  if (!isOpen) return null;

  const options: Array<{
    mode: UploadPreferenceMode;
    title: string;
    description: string;
    badge?: string;
    icon: any;
    color: string;
    border: string;
  }> = [
    {
      mode: "quick_form",
      title: "Quick-Add Mode",
      description: "Simple 3-field upload (Name, Price, Stock). AI automatically enriches clinical details in the background.",
      badge: "Fastest Single Item",
      icon: Zap,
      color: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400",
      border: "hover:border-amber-400 dark:hover:border-amber-600",
    },
    {
      mode: "live_camera",
      title: "Live Camera Photo Capture",
      description: "Snap product packaging & box photos with your PC webcam or phone camera directly into the product catalog.",
      badge: "Desktop & Mobile",
      icon: Camera,
      color: "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400",
      border: "hover:border-rose-400 dark:hover:border-rose-600",
    },
    {
      mode: "continuous_scan",
      title: "Rapid Continuous Scanner",
      description: "Inventory gun loop: scan box/barcode ➜ set price/quantity ➜ instant save ➜ auto-ready for next box.",
      badge: "Best for Box Cartons",
      icon: Barcode,
      color: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400",
      border: "hover:border-emerald-400 dark:hover:border-emerald-600",
    },
    {
      mode: "invoice_ocr",
      title: "Wholesaler Invoice / Receipt OCR",
      description: "Snap a photo of the distributor delivery slip (Ernest Chemists, Tobinco, etc.) to extract & bulk-import all items.",
      badge: "Ultimate Bulk Saver",
      icon: FileText,
      color: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400",
      border: "hover:border-blue-400 dark:hover:border-blue-600",
    },
    {
      mode: "voice_dictation",
      title: "Hands-Free Voice Dictation",
      description: "Speak what you are holding ('Amoxicillin 500mg, 40 packs, 35 Cedis') to parse and populate the form.",
      badge: "Hands-Free",
      icon: Mic,
      color: "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400",
      border: "hover:border-purple-400 dark:hover:border-purple-600",
    },
    {
      mode: "formulary",
      title: "Standard Drug Formulary",
      description: "1-click clone top essential Ghanaian medicines with verified active ingredients, dosages, and instructions.",
      badge: "Zero Typing",
      icon: BookOpen,
      color: "bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400",
      border: "hover:border-teal-400 dark:hover:border-teal-600",
    },
    {
      mode: "detailed_form",
      title: "Full Detailed Clinical Form",
      description: "Traditional manual form with direct control over all 15+ pharmaceutical fields, warnings, and image gallery.",
      badge: "Comprehensive",
      icon: PlusCircle,
      color: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
      border: "hover:border-slate-400 dark:hover:border-slate-500",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
              Choose Product Upload Method
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
              Select the fastest workflow for your current inventory task
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Options Grid */}
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 overflow-y-auto flex-1">
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.mode}
                type="button"
                onClick={() => {
                  onSelectMode(opt.mode);
                  onClose();
                }}
                className={`p-4 rounded-2xl border border-slate-200 dark:border-slate-700 ${opt.border} bg-slate-50/50 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-800 text-left transition-all group flex flex-col justify-between space-y-3 shadow-sm hover:shadow-md`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-2xl ${opt.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {opt.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {opt.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {opt.description}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 pt-1 group-hover:translate-x-1 transition-transform">
                  <span>Get Started</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
