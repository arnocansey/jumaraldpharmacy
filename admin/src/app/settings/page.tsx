"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings, Save, Store, Truck, Trophy, Mail, MessageSquare,
  CreditCard, Bell, Search, CheckCircle, Loader2, RefreshCw,
  Globe, Phone, MapPin, DollarSign, Clock, Percent, Users,
  ArrowUpRight, Send, Key, Eye, EyeOff, Lock, AlertTriangle,
  ToggleLeft, ToggleRight, ExternalLink, Copy,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface Setting {
  key: string;
  value: string;
  type: string;
}

type TabId = "general" | "delivery" | "loyalty" | "email" | "sms" | "payments" | "notifications" | "seo";

interface TabDef {
  id: TabId;
  label: string;
  icon: any;
}

const TABS: TabDef[] = [
  { id: "general", label: "General", icon: Store },
  { id: "delivery", label: "Delivery", icon: Truck },
  { id: "loyalty", label: "Loyalty", icon: Trophy },
  { id: "email", label: "Email", icon: Mail },
  { id: "sms", label: "SMS", icon: MessageSquare },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "seo", label: "SEO", icon: Search },
];

const TIMEZONES = [
  "Africa/Accra", "Africa/Lagos", "Africa/Nairobi", "Africa/Johannesburg",
  "Europe/London", "America/New_York", "America/Chicago", "America/Los_Angeles",
  "Asia/Dubai", "Asia/Kolkata",
];

const CURRENCIES = ["GHS", "NGN", "KES", "ZAR", "USD", "EUR", "GBP"];

const inputClass = "w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-colors";
const labelClass = "text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block";
const sectionCardClass = "bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const loadSettings = useCallback(async () => {
    try {
      const data = await apiFetch<Setting[]>("/settings");
      const map: Record<string, string> = {};
      (Array.isArray(data) ? data : []).forEach((s) => {
        map[s.key] = s.value;
      });
      setSettings(map);
      setDirty(false);
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  function updateSetting(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  function getSetting(key: string, fallback = ""): string {
    return settings[key] ?? fallback;
  }

  function getBool(key: string): boolean {
    return settings[key] === "true" || settings[key] === "1";
  }

  function toggleBool(key: string) {
    updateSetting(key, getBool(key) ? "false" : "true");
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        type: "string",
      }));
      await apiFetch("/settings", {
        method: "PUT",
        body: JSON.stringify({ settings: payload }),
      });
      toast.success("Settings saved successfully");
      setDirty(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  function toggleSecret(key: string) {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function copyToClipboard(value: string) {
    navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard");
  }

  if (loading) {
    return (
      <div className="w-full">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl w-64" />
          <div className="flex gap-2">{[1, 2, 3, 4].map((i) => <div key={i} className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl w-24" />)}</div>
          <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your store configuration</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadSettings}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Reload settings"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-colors"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 mb-6 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ==================== GENERAL TAB ==================== */}
      {activeTab === "general" && (
        <div className="space-y-6">
          <div className={sectionCardClass}>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-4">Store Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Store Name</label>
                <input
                  type="text"
                  value={getSetting("store_name", "Jumarald Pharmacy & Wellness Ltd.")}
                  onChange={(e) => updateSetting("store_name", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Tagline</label>
                <input
                  type="text"
                  value={getSetting("store_tagline", "Your trusted pharmacy partner")}
                  onChange={(e) => updateSetting("store_tagline", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Contact Email</label>
                <input
                  type="email"
                  value={getSetting("contact_email", "care@jumaraldpharmacy.com")}
                  onChange={(e) => updateSetting("contact_email", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Phone Number</label>
                <input
                  type="tel"
                  value={getSetting("contact_phone", "+233 30 123 4567")}
                  onChange={(e) => updateSetting("contact_phone", e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className={sectionCardClass}>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-4">Regional</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Default Currency</label>
                <select
                  value={getSetting("default_currency", "GHS")}
                  onChange={(e) => updateSetting("default_currency", e.target.value)}
                  className={inputClass}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Timezone</label>
                <select
                  value={getSetting("timezone", "Africa/Accra")}
                  onChange={(e) => updateSetting("timezone", e.target.value)}
                  className={inputClass}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DELIVERY TAB ==================== */}
      {activeTab === "delivery" && (
        <div className="space-y-6">
          <div className={sectionCardClass}>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-4">Delivery Pricing</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Free Delivery Threshold (GHS)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={getSetting("free_delivery_threshold", "150")}
                  onChange={(e) => updateSetting("free_delivery_threshold", e.target.value)}
                  className={inputClass}
                />
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Orders above this amount get free delivery</p>
              </div>
              <div>
                <label className={labelClass}>Default Delivery Fee (GHS)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={getSetting("default_delivery_fee", "15")}
                  onChange={(e) => updateSetting("default_delivery_fee", e.target.value)}
                  className={inputClass}
                />
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Standard delivery charge</p>
              </div>
              <div>
                <label className={labelClass}>Delivery Radius (km)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={getSetting("delivery_radius_km", "25")}
                  onChange={(e) => updateSetting("delivery_radius_km", e.target.value)}
                  className={inputClass}
                />
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Maximum delivery distance</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== LOYALTY TAB ==================== */}
      {activeTab === "loyalty" && (
        <div className="space-y-6">
          <div className={sectionCardClass}>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-4">Points Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Points per GHS Spent</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={getSetting("loyalty_points_per_ghs", "1")}
                  onChange={(e) => updateSetting("loyalty_points_per_ghs", e.target.value)}
                  className={inputClass}
                />
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">How many points per 1 GHS spent</p>
              </div>
              <div>
                <label className={labelClass}>Referral Bonus (points)</label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={getSetting("loyalty_referral_bonus", "100")}
                  onChange={(e) => updateSetting("loyalty_referral_bonus", e.target.value)}
                  className={inputClass}
                />
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Points awarded for each successful referral</p>
              </div>
            </div>
          </div>

          <div className={sectionCardClass}>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-4">Tier Thresholds (Lifetime Spend in GHS)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Silver Tier From</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={getSetting("tier_silver_threshold", "500")}
                  onChange={(e) => updateSetting("tier_silver_threshold", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Gold Tier From</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={getSetting("tier_gold_threshold", "2000")}
                  onChange={(e) => updateSetting("tier_gold_threshold", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Platinum Tier From</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={getSetting("tier_platinum_threshold", "5000")}
                  onChange={(e) => updateSetting("tier_platinum_threshold", e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== EMAIL TAB ==================== */}
      {activeTab === "email" && (
        <div className="space-y-6">
          <div className={sectionCardClass}>
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">SMTP Configuration</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                <Lock className="h-3 w-3" /> Read Only
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-dashed border-slate-300 dark:border-slate-600">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "SMTP Host", key: "smtp_host", value: getSetting("smtp_host", "smtp.gmail.com") },
                  { label: "SMTP Port", key: "smtp_port", value: getSetting("smtp_port", "587") },
                  { label: "SMTP User", key: "smtp_user", value: getSetting("smtp_user", "") },
                  { label: "SMTP Password", key: "smtp_password", value: getSetting("smtp_password", ""), secret: true },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">{field.label}</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-sm font-mono text-slate-700 dark:text-slate-300 truncate">
                        {field.secret && !showSecrets[field.key]
                          ? "••••••••••••"
                          : field.value || "Not configured"}
                      </div>
                      {field.secret && (
                        <button
                          onClick={() => toggleSecret(field.key)}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400"
                        >
                          {showSecrets[field.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      )}
                      {field.value && (
                        <button
                          onClick={() => copyToClipboard(field.value)}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400"
                          title="Copy"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-4 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                SMTP credentials are stored server-side. Edit them via environment variables.
              </p>
            </div>
          </div>

          <div className={sectionCardClass}>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-4">Newsletter Settings</h3>
            <div className="space-y-3">
              <button
                onClick={() => toggleBool("newsletter_enabled")}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors ${
                  getBool("newsletter_enabled")
                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                    : "bg-white dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Send className={`h-5 w-5 ${getBool("newsletter_enabled") ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`} />
                  <div className="text-left">
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">Email Newsletter</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Send promotional emails to subscribers</p>
                  </div>
                </div>
                {getBool("newsletter_enabled") ? <ToggleRight className="h-6 w-6 text-emerald-600" /> : <ToggleLeft className="h-6 w-6 text-slate-400" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SMS TAB ==================== */}
      {activeTab === "sms" && (
        <div className="space-y-6">
          <div className={sectionCardClass}>
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Africa&apos;s Talking Configuration</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                <Lock className="h-3 w-3" /> Read Only
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-dashed border-slate-300 dark:border-slate-600">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "API Username", key: "at_username", value: getSetting("at_username", "") },
                  { label: "API Key", key: "at_api_key", value: getSetting("at_api_key", ""), secret: true },
                  { label: "Sender ID", key: "at_sender_id", value: getSetting("at_sender_id", "JUMPHARM") },
                  { label: "Environment", key: "at_environment", value: getSetting("at_environment", "sandbox") },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">{field.label}</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-sm font-mono text-slate-700 dark:text-slate-300 truncate">
                        {field.secret && !showSecrets[field.key]
                          ? "••••••••••••"
                          : field.value || "Not configured"}
                      </div>
                      {field.secret && (
                        <button
                          onClick={() => toggleSecret(field.key)}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400"
                        >
                          {showSecrets[field.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      )}
                      {field.value && (
                        <button
                          onClick={() => copyToClipboard(field.value)}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400"
                          title="Copy"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-4 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Africa&apos;s Talking credentials are stored server-side. Edit them via environment variables.
              </p>
            </div>
          </div>

          <div className={sectionCardClass}>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-4">SMS Templates</h3>
            <div className="space-y-4">
              {[
                { key: "sms_template_order_confirmation", label: "Order Confirmation", placeholder: "Your order #{{order_id}} has been confirmed. Total: GHS {{amount}}." },
                { key: "sms_template_delivery_update", label: "Delivery Update", placeholder: "Your order #{{order_id}} is out for delivery. ETA: {{eta}} mins." },
                { key: "sms_template_otp", label: "OTP Verification", placeholder: "Your verification code is {{code}}. It expires in 5 minutes." },
              ].map((tpl) => (
                <div key={tpl.key}>
                  <label className={labelClass}>{tpl.label}</label>
                  <textarea
                    rows={2}
                    value={getSetting(tpl.key, tpl.placeholder)}
                    onChange={(e) => updateSetting(tpl.key, e.target.value)}
                    placeholder={tpl.placeholder}
                    className={`${inputClass} resize-none font-mono text-xs`}
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    Variables: {"{{order_id}}"}, {"{{amount}}"}, {"{{eta}}"}, {"{{code}}"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== PAYMENTS TAB ==================== */}
      {activeTab === "payments" && (
        <div className="space-y-6">
          <div className={sectionCardClass}>
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Paystack Configuration</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                <Lock className="h-3 w-3" /> Read Only
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-dashed border-slate-300 dark:border-slate-600">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Public Key</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-sm font-mono text-slate-700 dark:text-slate-300 truncate">
                      {showSecrets["paystack_public"] ? getSetting("paystack_public_key", "Not configured") : (getSetting("paystack_public_key") ? "pk_live_••••••••••••" : "Not configured")}
                    </div>
                    <button
                      onClick={() => toggleSecret("paystack_public")}
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400"
                    >
                      {showSecrets["paystack_public"] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Secret Key</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-sm font-mono text-slate-700 dark:text-slate-300 truncate">
                      {showSecrets["paystack_secret"] ? getSetting("paystack_secret_key", "Not configured") : (getSetting("paystack_secret_key") ? "sk_live_••••••••••••" : "Not configured")}
                    </div>
                    <button
                      onClick={() => toggleSecret("paystack_secret")}
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400"
                    >
                      {showSecrets["paystack_secret"] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-4 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Payment keys are stored server-side. Edit them via environment variables.
              </p>
            </div>
          </div>

          <div className={sectionCardClass}>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-4">Test Mode</h3>
            <button
              onClick={() => toggleBool("paystack_test_mode")}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors ${
                getBool("paystack_test_mode")
                  ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                  : "bg-white dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
              }`}
            >
              <div className="flex items-center gap-3">
                {getBool("paystack_test_mode") ? (
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                )}
                <div className="text-left">
                  <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                    {getBool("paystack_test_mode") ? "Test Mode Active" : "Live Mode Active"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {getBool("paystack_test_mode")
                      ? "Payments will not be processed. Use test card: 4111 1111 1111 1111"
                      : "Real payments are being processed via Paystack"}
                  </p>
                </div>
              </div>
              {getBool("paystack_test_mode") ? <ToggleRight className="h-6 w-6 text-amber-600" /> : <ToggleLeft className="h-6 w-6 text-slate-400" />}
            </button>
          </div>

          <div className={sectionCardClass}>
            <a
              href="https://dashboard.paystack.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <ExternalLink className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">Open Paystack Dashboard</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">View transactions, settlements, and reports</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-400 ml-auto" />
            </a>
          </div>
        </div>
      )}

      {/* ==================== NOTIFICATIONS TAB ==================== */}
      {activeTab === "notifications" && (
        <div className="space-y-6">
          <div className={sectionCardClass}>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-4">Notification Channels</h3>
            <div className="space-y-3">
              {[
                { key: "push_notifications_enabled", label: "Push Notifications", desc: "Send browser push notifications for orders and updates", icon: Bell },
                { key: "email_notifications_enabled", label: "Email Notifications", desc: "Send email notifications for order status changes", icon: Mail },
                { key: "sms_notifications_enabled", label: "SMS Notifications", desc: "Send SMS alerts for critical updates via Africa's Talking", icon: MessageSquare },
              ].map((item) => {
                const Icon = item.icon;
                const enabled = getBool(item.key);
                return (
                  <button
                    key={item.key}
                    onClick={() => toggleBool(item.key)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors ${
                      enabled
                        ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                        : "bg-white dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${enabled ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`} />
                      <div className="text-left">
                        <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{item.label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                      </div>
                    </div>
                    {enabled ? <ToggleRight className="h-6 w-6 text-emerald-600" /> : <ToggleLeft className="h-6 w-6 text-slate-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={sectionCardClass}>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-4">Notification Events</h3>
            <div className="space-y-2">
              {[
                { key: "notify_new_order", label: "New Order Received" },
                { key: "notify_order_shipped", label: "Order Shipped" },
                { key: "notify_order_delivered", label: "Order Delivered" },
                { key: "notify_low_stock", label: "Low Stock Alert" },
                { key: "notify_prescription_received", label: "Prescription Received" },
                { key: "notify_new_user", label: "New User Registration" },
              ].map((event) => (
                <label
                  key={event.key}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors"
                >
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{event.label}</span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={getBool(event.key) || true}
                      onChange={() => updateSetting(event.key, getBool(event.key) ? "false" : "true")}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 dark:bg-slate-600 peer-checked:bg-emerald-600 rounded-full transition-colors" />
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm" />
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== SEO TAB ==================== */}
      {activeTab === "seo" && (
        <div className="space-y-6">
          <div className={sectionCardClass}>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-4">Meta Tags</h3>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Meta Title</label>
                <input
                  type="text"
                  value={getSetting("seo_meta_title", "Jumarald Pharmacy - Online Pharmacy & Wellness Store")}
                  onChange={(e) => updateSetting("seo_meta_title", e.target.value)}
                  className={inputClass}
                  maxLength={60}
                />
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{getSetting("seo_meta_title", "").length}/60 characters</p>
              </div>
              <div>
                <label className={labelClass}>Meta Description</label>
                <textarea
                  rows={3}
                  value={getSetting("seo_meta_description", "Ghana's trusted online pharmacy. Order prescription & OTC medicines, health products with fast delivery.")}
                  onChange={(e) => updateSetting("seo_meta_description", e.target.value)}
                  className={`${inputClass} resize-none`}
                  maxLength={160}
                />
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{getSetting("seo_meta_description", "").length}/160 characters</p>
              </div>
              <div>
                <label className={labelClass}>OG Image URL</label>
                <input
                  type="url"
                  value={getSetting("seo_og_image", "")}
                  onChange={(e) => updateSetting("seo_og_image", e.target.value)}
                  className={inputClass}
                  placeholder="https://example.com/og-image.jpg"
                />
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Recommended: 1200x630px for social media sharing</p>
              </div>
            </div>
          </div>

          <div className={sectionCardClass}>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-4">Preview</h3>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-600 p-4">
              <p className="text-lg font-medium text-blue-700 dark:text-blue-400 leading-tight mb-1">
                {getSetting("seo_meta_title", "Jumarald Pharmacy - Online Pharmacy & Wellness Store")}
              </p>
              <p className="text-sm text-green-700 dark:text-green-500 mb-1 truncate">
                https://jumaraldpharmacy.com
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                {getSetting("seo_meta_description", "Ghana's trusted online pharmacy. Order prescription & OTC medicines, health products with fast delivery.")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom spacer */}
      <div className="h-8" />
    </div>
  );
}
