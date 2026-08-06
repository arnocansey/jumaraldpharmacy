"use client";

import { useState } from "react";
import { Megaphone, Plus, Tag, Image, Percent, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

interface Coupon {
  id: string;
  code: string;
  discountPct?: number;
  discountAmount?: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  usageLimit?: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

export default function MarketingPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [activeTab, setActiveTab] = useState<"coupons" | "banners" | "newsletter">("coupons");
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponForm, setCouponForm] = useState({ code: "", discountPct: 0, maxDiscount: 0, minOrderAmount: 0, usageLimit: 0, validFrom: "", validUntil: "" });

  async function createCoupon(e: React.FormEvent) {
    e.preventDefault();
    toast.success("Coupon created (connect to backend API)");
    setShowCouponForm(false);
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Marketing</h1>
        <p className="text-slate-500 text-sm">Manage coupons, banners, and promotions</p>
      </div>

      <div className="flex gap-2 mb-6">
        {(["coupons", "banners", "newsletter"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${activeTab === tab ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === "coupons" && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowCouponForm(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-emerald-700 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Create Coupon
            </button>
          </div>

          {showCouponForm && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
              <h3 className="font-bold text-slate-800 mb-4">New Coupon</h3>
              <form onSubmit={createCoupon} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input placeholder="Coupon Code" value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-emerald-500" required />
                <input type="number" placeholder="Discount %" value={couponForm.discountPct || ""} onChange={(e) => setCouponForm({ ...couponForm, discountPct: Number(e.target.value) })}
                  className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                <input type="number" placeholder="Max Discount" value={couponForm.maxDiscount || ""} onChange={(e) => setCouponForm({ ...couponForm, maxDiscount: Number(e.target.value) })}
                  className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                <input type="number" placeholder="Min Order Amount" value={couponForm.minOrderAmount || ""} onChange={(e) => setCouponForm({ ...couponForm, minOrderAmount: Number(e.target.value) })}
                  className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                <input type="number" placeholder="Usage Limit" value={couponForm.usageLimit || ""} onChange={(e) => setCouponForm({ ...couponForm, usageLimit: Number(e.target.value) })}
                  className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                <input type="date" value={couponForm.validFrom} onChange={(e) => setCouponForm({ ...couponForm, validFrom: e.target.value })}
                  className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                <input type="date" value={couponForm.validUntil} onChange={(e) => setCouponForm({ ...couponForm, validUntil: e.target.value })}
                  className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                <div className="md:col-span-2 flex gap-3">
                  <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-emerald-700">Create</button>
                  <button type="button" onClick={() => setShowCouponForm(false)} className="px-6 py-2 rounded-xl font-semibold bg-slate-100 hover:bg-slate-200">Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center py-12">
            <Tag className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No coupons yet. Create your first coupon to start offering discounts.</p>
          </div>
        </div>
      )}

      {activeTab === "banners" && (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <Image className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">Banner management - Upload and manage promotional banners</p>
          <button className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-emerald-700">Upload Banner</button>
        </div>
      )}

      {activeTab === "newsletter" && (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <Megaphone className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Newsletter subscriber management coming soon</p>
        </div>
      )}
    </div>
  );
}
