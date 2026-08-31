"use client";

import { useState, useEffect } from "react";
import { Sparkles, Activity, ShieldAlert, CheckCircle, MessageSquare, Bot, ArrowUpRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

export default function AIAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      const data = await apiFetch<any>("/ai/analytics");
      setAnalytics(data.analytics);
    } catch {
      toast.error("Failed to load AI Analytics");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          AI Platform Analytics <Activity className="h-5 w-5 text-emerald-500" />
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Monitor conversation throughput, safety guardrail triggers, intent distribution, and resolution performance.
        </p>
      </div>

      {loading ? (
        <div className="glass-panel p-8 rounded-2xl animate-pulse">Loading analytics data...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="glass-panel p-5 rounded-2xl space-y-2">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Total Conversations</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{analytics?.totalConversations || 0}</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <ArrowUpRight className="h-3.5 w-3.5" /> Active patient sessions
            </p>
          </div>

          <div className="glass-panel p-5 rounded-2xl space-y-2">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Total Messages Processed</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{analytics?.totalMessages || 0}</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" /> Multi-turn intent interactions
            </p>
          </div>

          <div className="glass-panel p-5 rounded-2xl space-y-2">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">AI Resolution Rate</p>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{analytics?.activeResolutionRate || "100%"}</p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Resolved without human escalation</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl space-y-2">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Pharmacist Escalations</p>
            <p className="text-3xl font-black text-amber-500 dark:text-amber-400">{analytics?.totalEscalations || 0}</p>
            <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5" /> Safety guardrail handoffs
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
