"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Gift, Trophy, Copy, Check, Users, TrendingUp, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface LoyaltyAccount {
  totalPoints: number;
  availablePoints: number;
  tier: string;
  totalSpent: number;
  referralCode: string;
  nextTier?: { name: string; threshold: number } | null;
  progressToNext: number;
}

const TIER_CONFIG: Record<string, { color: string; bg: string; icon: string; benefits: string[] }> = {
  BRONZE: { color: "text-amber-700", bg: "bg-amber-100", icon: "🥉", benefits: ["1x points on all purchases", "Birthday reward"] },
  SILVER: { color: "text-slate-600", bg: "bg-slate-200", icon: "🥈", benefits: ["1.5x points on all purchases", "Birthday reward", "Free delivery over GHS 100"] },
  GOLD: { color: "text-yellow-600", bg: "bg-yellow-100", icon: "🥇", benefits: ["2x points on all purchases", "Birthday reward", "Free delivery on all orders", "Priority support"] },
  PLATINUM: { color: "text-emerald-700", bg: "bg-emerald-100", icon: "💎", benefits: ["3x points on all purchases", "Birthday reward", "Free delivery on all orders", "Priority support", "Exclusive offers", "Personal pharmacist"] },
};

export default function LoyaltyPage() {
  const [account, setAccount] = useState<LoyaltyAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [acc, hist, rwds] = await Promise.all([
        apiFetch<LoyaltyAccount>("/loyalty/account"),
        apiFetch<any[]>("/loyalty/history"),
        apiFetch<any[]>("/loyalty/rewards"),
      ]);
      setAccount(acc);
      setHistory(hist);
      setRewards(rwds);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  function copyReferral() {
    if (!account) return;
    navigator.clipboard.writeText(account.referralCode);
    setCopied(true);
    toast.success("Referral code copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
    </div>
  );

  const tierConfig = account ? TIER_CONFIG[account.tier] : TIER_CONFIG.BRONZE;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="bg-emerald-900 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-emerald-300" />
            <h1 className="text-4xl font-bold mb-3">Loyalty & Rewards</h1>
            <p className="text-emerald-200 text-lg">Earn points with every purchase and unlock exclusive benefits</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-8">
        {account && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-sm text-slate-500 mb-1">Available Points</p>
                <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-4xl font-bold text-emerald-600">
                  {account.availablePoints.toLocaleString()}
                </motion.p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-500 mb-1">Total Earned</p>
                <p className="text-2xl font-bold text-slate-800">{account.totalPoints.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-500 mb-1">Current Tier</p>
                <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${tierConfig.bg} ${tierConfig.color}`}>
                  {tierConfig.icon} {account.tier}
                </span>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-500 mb-1">Total Spent</p>
                <p className="text-2xl font-bold text-slate-800">GHS {account.totalSpent.toFixed(2)}</p>
              </div>
            </div>

            {account.nextTier && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Progress to {account.nextTier.name}</span>
                  <span className="text-sm font-semibold text-emerald-600">{account.progressToNext.toFixed(0)}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${account.progressToNext}%` }} transition={{ duration: 1 }} className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full" />
                </div>
                <p className="text-xs text-slate-400 mt-1">Spend GHS {(account.nextTier.threshold - account.totalSpent).toFixed(2)} more to reach {account.nextTier.name}</p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Rewards Catalog</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rewards.map((reward, i) => (
                <motion.div key={reward.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="bg-emerald-100 p-2 rounded-xl"><Gift className="h-5 w-5 text-emerald-600" /></div>
                    <span className="text-sm font-bold text-emerald-600">{reward.points} pts</span>
                  </div>
                  <h3 className="font-bold text-slate-800 mb-1">{reward.name}</h3>
                  <p className="text-sm text-slate-500 mb-3">{reward.description}</p>
                  <button className="w-full bg-emerald-50 text-emerald-700 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-colors">
                    Redeem
                  </button>
                </motion.div>
              ))}
            </div>
          </div>

          <div>
            <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
              <h3 className="font-bold text-slate-800 mb-4">Refer a Friend</h3>
              <p className="text-sm text-slate-500 mb-4">Share your referral code and both earn 500 bonus points!</p>
              {account && (
                <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-3">
                  <code className="flex-1 text-center font-mono font-bold text-emerald-600 text-lg">{account.referralCode}</code>
                  <button onClick={copyReferral} className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3 className="font-bold text-slate-800 mb-4">Points History</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {history.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No points history yet</p>
                ) : (
                  history.slice(0, 10).map((h) => (
                    <div key={h.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-slate-700">{h.description || h.type}</p>
                        <p className="text-xs text-slate-400">{new Date(h.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`font-bold ${h.points > 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {h.points > 0 ? "+" : ""}{h.points}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
