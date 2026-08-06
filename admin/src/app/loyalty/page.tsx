"use client";

import { useState, useEffect } from "react";
import { Trophy, Users, Star, TrendingUp } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface LoyaltyStats {
  totalMembers: number;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  tierDistribution: { tier: string; _count: number }[];
  topMembers: { totalSpent: number; totalPoints: number; tier: string; user: { name: string; email: string } }[];
}

const TIER_COLORS: Record<string, string> = {
  BRONZE: "bg-amber-100 text-amber-700",
  SILVER: "bg-slate-200 text-slate-700",
  GOLD: "bg-yellow-100 text-yellow-700",
  PLATINUM: "bg-emerald-100 text-emerald-700",
};

export default function LoyaltyAdminPage() {
  const [stats, setStats] = useState<LoyaltyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<LoyaltyStats>("/loyalty/stats")
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8"><div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-slate-200 rounded-2xl" />)}</div></div>;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Loyalty Management</h1>
        <p className="text-slate-500 text-sm">Monitor loyalty program performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <Users className="h-8 w-8 text-emerald-500 mb-2" />
          <p className="text-2xl font-bold text-slate-800">{stats?.totalMembers || 0}</p>
          <p className="text-sm text-slate-500">Total Members</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <TrendingUp className="h-8 w-8 text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-slate-800">{(stats?.totalPointsEarned || 0).toLocaleString()}</p>
          <p className="text-sm text-slate-500">Points Earned</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <Star className="h-8 w-8 text-purple-500 mb-2" />
          <p className="text-2xl font-bold text-slate-800">{(stats?.totalPointsRedeemed || 0).toLocaleString()}</p>
          <p className="text-sm text-slate-500">Points Redeemed</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <Trophy className="h-8 w-8 text-amber-500 mb-2" />
          <p className="text-2xl font-bold text-slate-800">{stats?.tierDistribution?.length || 0}</p>
          <p className="text-sm text-slate-500">Active Tiers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="font-bold text-slate-800 mb-4">Tier Distribution</h3>
          <div className="space-y-3">
            {stats?.tierDistribution?.map((t) => (
              <div key={t.tier} className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${TIER_COLORS[t.tier] || "bg-slate-100 text-slate-600"}`}>{t.tier}</span>
                <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (t._count / Math.max(stats.totalMembers, 1)) * 100)}%` }} />
                </div>
                <span className="text-sm font-semibold text-slate-700">{t._count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="font-bold text-slate-800 mb-4">Top Members</h3>
          <div className="space-y-3">
            {stats?.topMembers?.map((m, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <span className="text-lg font-bold text-slate-400 w-6">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{m.user.name}</p>
                  <p className="text-xs text-slate-400">{m.user.email}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${TIER_COLORS[m.tier]}`}>{m.tier}</span>
                <span className="text-sm font-bold text-emerald-600">GHS {m.totalSpent.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
