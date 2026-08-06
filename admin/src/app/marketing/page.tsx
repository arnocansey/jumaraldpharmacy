"use client";

import { useState } from "react";
import { Megaphone, Plus, Tag, Image } from "lucide-react";
import { toast } from "sonner";

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState<"coupons" | "banners" | "newsletter">("coupons");
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Marketing</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Manage coupons, banners, and promotions</p>
      </div>
      <div className="flex gap-2 mb-6">
        {(["coupons", "banners", "newsletter"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${activeTab === tab ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"}`}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
        ))}
      </div>
      {activeTab === "coupons" && (
        <div>
          <div className="flex justify-end mb-4"><button onClick={() => setShowForm(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-emerald-700 flex items-center gap-2"><Plus className="h-4 w-4" /> Create Coupon</button></div>
          {showForm && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 mb-6">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">New Coupon</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input placeholder="Code" className="border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm font-mono bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200" />
                <input type="number" placeholder="Discount %" className="border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200" />
                <input type="number" placeholder="Max Discount" className="border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200" />
              </div>
            </div>
          )}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-12 text-center">
            <Tag className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">No coupons yet. Create your first coupon.</p>
          </div>
        </div>
      )}
      {activeTab === "banners" && <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-12 text-center"><Image className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" /><p className="text-slate-500 dark:text-slate-400">Banner management coming soon</p></div>}
      {activeTab === "newsletter" && <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-12 text-center"><Megaphone className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" /><p className="text-slate-500 dark:text-slate-400">Newsletter management coming soon</p></div>}
    </div>
  );
}
