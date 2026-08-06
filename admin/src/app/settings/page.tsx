"use client";

import React, { useState } from "react";
import { ShieldCheck, Lock, Save } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    pharmacyName: "Jumarald Pharmacy & Wellness Ltd.",
    contactEmail: "care@jumaraldpharmacy.com",
    prescriptionGracePeriodMins: "30",
    coldChainAlertTempMax: "8",
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("System configurations updated successfully!");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">System Configurations & Role Access</h1>
        <p className="text-xs text-slate-500">Global platform settings, temperature thresholds, and security permissions.</p>
      </div>

      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase text-slate-600">Official Pharmacy Business Name</label>
            <input
              type="text"
              value={settings.pharmacyName}
              onChange={(e) => setSettings({ ...settings, pharmacyName: e.target.value })}
              className="w-full mt-1 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-600">Pharmacist Alert Contact Email</label>
            <input
              type="email"
              value={settings.contactEmail}
              onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              className="w-full mt-1 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-slate-600">Max Rx Verification SLA (Mins)</label>
              <input
                type="number"
                value={settings.prescriptionGracePeriodMins}
                onChange={(e) => setSettings({ ...settings, prescriptionGracePeriodMins: e.target.value })}
                className="w-full mt-1 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-slate-600">Cold Chain Max Temp (°C)</label>
              <input
                type="number"
                value={settings.coldChainAlertTempMax}
                onChange={(e) => setSettings({ ...settings, coldChainAlertTempMax: e.target.value })}
                className="w-full mt-1 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button type="submit" className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-white text-sm flex items-center gap-2 shadow-md shadow-emerald-600/20">
            <Save className="h-4 w-4" /> Save Configurations
          </button>
        </form>
      </div>
    </div>
  );
}
