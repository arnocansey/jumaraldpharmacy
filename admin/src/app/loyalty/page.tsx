"use client";

import { useState, useEffect } from "react";
import { Trophy, Users, Star, TrendingUp } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface LoyaltyStats { totalMembers: number; totalPointsEarned: number; totalPointsRedeemed: number; tierDistribution: { tier: string; _count: number }[]; topMembers: { totalSpent: number; tier: string; user: { name: string; email: string } }[]; }
const TIER_COLORS: Record<string, string> = { BRONZE: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400", SILVER: "bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300", GOLD: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400", PLATINUM: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" };

export default function LoyaltyAdminPage() {
  const [stats, setStats] = useState<LoyaltyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { apiFetch<LoyaltyStats>("/loyalty/stats").then(setStats).catch(() => {}).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="w-full"><div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-2xl" />)}</div></div>;

  return (
    <div className="w-full">
      <div className="mb-6"><h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Loyalty Management</h1><p className="text-slate-500 dark:text-slate-400 text-sm">Monitor loyalty program performance</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Users, label: "Total Members", value: stats?.totalMembers || 0, color: "text-emerald-500" },
          { icon: TrendingUp, label: "Points Earned", value: (stats?.totalPointsEarned || 0).toLocaleString(), color: "text-blue-500" },
          { icon: Star, label: "Points Redeemed", value: (stats?.totalPointsRedeemed || 0).toLocaleString(), color: "text-purple-500" },
          { icon: Trophy, label: "Active Tiers", value: stats?.tierDistribution?.length || 0, color: "text-amber-500" },
        ].map((s) => <div key={s.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5"><s.icon className={`h-8 w-8 ${s.color} mb-2`} /><p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{s.value}</p><p className="text-sm text-slate-500 dark:text-slate-400">{s.label}</p></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Tier Distribution</h3>
          <div className="space-y-3">{stats?.tierDistribution?.map((t) => <div key={t.tier} className="flex items-center gap-3"><span className={`px-3 py-1 rounded-full text-xs font-bold ${TIER_COLORS[t.tier]}`}>{t.tier}</span><div className="flex-1 h-6 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (t._count / Math.max(stats.totalMembers, 1)) * 100)}%` }} /></div><span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t._count}</span></div>)}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Top Members</h3>
          <div className="space-y-3">{stats?.topMembers?.map((m, i) => <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl"><span className="text-lg font-bold text-slate-400 w-6">#{i + 1}</span><div className="flex-1 min-w-0"><p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{m.user.name}</p></div><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${TIER_COLORS[m.tier]}`}>{m.tier}</span><span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">GHS {m.totalSpent.toLocaleString()}</span></div>)}</div>
        </div>
      </div>
    </div>
  );
}
