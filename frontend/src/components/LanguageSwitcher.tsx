"use client";

import { useState } from "react";
import { Globe } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { locales, Locale } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
        aria-label="Change language"
      >
        <Globe className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 min-w-[140px]">
            {(Object.keys(locales) as Locale[]).map((loc) => (
              <button
                key={loc}
                onClick={() => { setLocale(loc); setOpen(false); }}
                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                  locale === loc ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-slate-700 dark:text-slate-300"
                }`}
              >
                <span>{locales[loc].flag}</span>
                <span>{locales[loc].label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
