"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Gift,
  Trophy,
  Copy,
  Check,
  Users,
  TrendingUp,
  ArrowRight,
  Share2,
  Clock,
  Shield,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Percent,
  Truck,
  Heart,
  Award,
  Zap,
  Info,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

interface LoyaltyAccount {
  totalPoints: number;
  availablePoints: number;
  tier: string;
  totalSpent: number;
  referralCode: string;
  nextTier?: { name: string; threshold: number } | null;
  progressToNext: number;
}

interface TierInfo {
  name: string;
  minSpent: number;
  pointsMultiplier: number;
  benefits: string[];
}

interface Reward {
  id: string;
  name: string;
  type: string;
  points: number;
  value: number;
  description: string;
}

interface HistoryEntry {
  id: string;
  points: number;
  type: string;
  description: string;
  createdAt: string;
}

interface Stats {
  totalMembers: number;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
}

const TIER_ORDER = ["BRONZE", "SILVER", "GOLD", "PLATINUM"];

const TIER_CONFIG: Record<
  string,
  {
    color: string;
    bg: string;
    border: string;
    darkBg: string;
    darkBorder: string;
    icon: string;
    glow: string;
    gradient: string;
  }
> = {
  BRONZE: {
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
    darkBg: "dark:bg-amber-950/40",
    darkBorder: "dark:border-amber-800",
    icon: "bronze",
    glow: "shadow-amber-200/50 dark:shadow-amber-900/30",
    gradient: "from-amber-400 to-amber-600",
  },
  SILVER: {
    color: "text-slate-600 dark:text-slate-300",
    bg: "bg-slate-100 dark:bg-slate-800",
    border: "border-slate-300 dark:border-slate-700",
    darkBg: "dark:bg-slate-800",
    darkBorder: "dark:border-slate-700",
    icon: "silver",
    glow: "shadow-slate-300/50 dark:shadow-slate-800/30",
    gradient: "from-slate-400 to-slate-600",
  },
  GOLD: {
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-950/40",
    border: "border-yellow-200 dark:border-yellow-800",
    darkBg: "dark:bg-yellow-950/40",
    darkBorder: "dark:border-yellow-800",
    icon: "gold",
    glow: "shadow-yellow-200/50 dark:shadow-yellow-900/30",
    gradient: "from-yellow-400 to-yellow-600",
  },
  PLATINUM: {
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
    darkBg: "dark:bg-emerald-950/40",
    darkBorder: "dark:border-emerald-800",
    icon: "platinum",
    glow: "shadow-emerald-200/50 dark:shadow-emerald-900/30",
    gradient: "from-emerald-400 to-emerald-600",
  },
};

const TIER_ICONS: Record<string, string> = {
  BRONZE: "🥉",
  SILVER: "🥈",
  GOLD: "🥇",
  PLATINUM: "💎",
};

const REWARD_TYPE_ICONS: Record<string, React.ReactNode> = {
  DISCOUNT: <Percent className="h-5 w-5" />,
  DELIVERY: <Truck className="h-5 w-5" />,
  CONSULTATION: <Heart className="h-5 w-5" />,
};

const HOW_IT_WORKS = [
  {
    icon: <ShoppingBag className="h-6 w-6" />,
    title: "Shop & Earn",
    description: "Earn 10 points for every GHS 1 spent on purchases. Higher tiers earn multiplied points!",
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    title: "Level Up",
    description: "Spend more to unlock Silver, Gold, and Platinum tiers with increasing benefits.",
  },
  {
    icon: <Gift className="h-6 w-6" />,
    title: "Redeem Rewards",
    description: "Exchange your points for discounts, free delivery, consultations, and more.",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Refer Friends",
    description: "Share your referral code and both you and your friend earn 500 bonus points.",
  },
];

function ShoppingBag({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

export default function LoyaltyPage() {
  const [account, setAccount] = useState<LoyaltyAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [rewardsLoading, setRewardsLoading] = useState(true);
  const [tiers, setTiers] = useState<TierInfo[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [copied, setCopied] = useState(false);
  const [claimingReward, setClaimingReward] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState("");
  const [applyingReferral, setApplyingReferral] = useState(false);
  const [showReferralInput, setShowReferralInput] = useState(false);
  const [activeTab, setActiveTab] = useState<"rewards" | "history" | "how" | "tiers">("rewards");

  useEffect(() => {
    loadAccount();
    loadTiers();
    loadStats();
  }, []);

  async function loadAccount() {
    try {
      const [acc, hist] = await Promise.all([
        apiFetch<LoyaltyAccount>("/loyalty/account"),
        apiFetch<HistoryEntry[]>("/loyalty/history"),
      ]);
      setAccount(acc);
      setHistory(hist);
    } catch {
    } finally {
      setLoading(false);
      setHistoryLoading(false);
    }
  }

  async function loadRewards() {
    try {
      setRewardsLoading(true);
      const rwds = await apiFetch<Reward[]>("/loyalty/rewards");
      setRewards(rwds);
    } catch {
    } finally {
      setRewardsLoading(false);
    }
  }

  async function loadTiers() {
    try {
      const data = await apiFetch<{ tiers: TierInfo[] }>("/loyalty/tiers");
      setTiers(data.tiers);
    } catch {
    }
  }

  async function loadStats() {
    try {
      const data = await apiFetch<Stats>("/loyalty/stats");
      setStats(data);
    } catch {
    }
  }

  function copyReferral() {
    if (!account) return;
    navigator.clipboard.writeText(account.referralCode);
    setCopied(true);
    toast.success("Referral code copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleClaimReward(rewardId: string) {
    if (!account) return;
    setClaimingReward(rewardId);
    try {
      await apiFetch("/loyalty/rewards/claim", {
        method: "POST",
        body: JSON.stringify({ rewardId }),
      });
      toast.success("Reward claimed successfully!");
      setAccount((prev) => {
        if (!prev) return prev;
        const reward = rewards.find((r) => r.id === rewardId);
        return { ...prev, availablePoints: prev.availablePoints - (reward?.points || 0) };
      });
      setHistory((prev) => [
        {
          id: Date.now().toString(),
          points: -(rewards.find((r) => r.id === rewardId)?.points || 0),
          type: "REDEEMED",
          description: `Claimed: ${rewards.find((r) => r.id === rewardId)?.name}`,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    } catch (err: any) {
      toast.error(err.message || "Failed to claim reward");
    } finally {
      setClaimingReward(null);
    }
  }

  async function handleApplyReferral() {
    if (!referralCode.trim()) return;
    setApplyingReferral(true);
    try {
      const res = await apiFetch<{ message: string; bonusPoints: number }>("/loyalty/referral/apply", {
        method: "POST",
        body: JSON.stringify({ referralCode: referralCode.trim() }),
      });
      toast.success(`${res.message}! You earned ${res.bonusPoints} points.`);
      setShowReferralInput(false);
      setReferralCode("");
      loadAccount();
    } catch (err: any) {
      toast.error(err.message || "Failed to apply referral");
    } finally {
      setApplyingReferral(false);
    }
  }

  function shareReferral(platform: "whatsapp" | "facebook" | "twitter") {
    if (!account) return;
    const text = `Join JumeralD Pharmacy and earn 500 bonus points! Use my referral code: ${account.referralCode}`;
    const url = window.location.origin;
    const shareUrls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    };
    window.open(shareUrls[platform], "_blank");
  }

  function getReferralLink(): string {
    return `${window.location.origin}?ref=${account?.referralCode || ""}`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
        {/* Header skeleton */}
        <div className="bg-emerald-900 dark:bg-emerald-950 py-16 px-4">
          <div className="max-w-6xl mx-auto text-center space-y-4">
            <Skeleton className="h-12 w-12 mx-auto rounded-2xl" />
            <Skeleton className="h-10 w-64 mx-auto" />
            <Skeleton className="h-5 w-96 mx-auto" />
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 -mt-8">
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-10 w-48" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 rounded-2xl" />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-64 rounded-2xl" />
              <Skeleton className="h-48 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tierConfig = account ? TIER_CONFIG[account.tier] : TIER_CONFIG.BRONZE;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Hero Header */}
      <div className="bg-emerald-900 dark:bg-emerald-950 text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZG90cyIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2RvdHMpIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIvPjwvc3ZnPg==')] opacity-50" />
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Trophy className="h-12 w-12 mx-auto mb-4 text-emerald-300" />
            <h1 className="text-4xl font-bold mb-3">Loyalty & Rewards</h1>
            <p className="text-emerald-200 text-lg">
              Earn points with every purchase and unlock exclusive benefits
            </p>
            {stats && (
              <div className="flex items-center justify-center gap-8 mt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-300">
                    {stats.totalMembers.toLocaleString()}
                  </p>
                  <p className="text-xs text-emerald-400">Members</p>
                </div>
                <div className="w-px h-8 bg-emerald-700" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-300">
                    {stats.totalPointsEarned.toLocaleString()}
                  </p>
                  <p className="text-xs text-emerald-400">Points Earned</p>
                </div>
                <div className="w-px h-8 bg-emerald-700" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-300">
                    {stats.totalPointsRedeemed.toLocaleString()}
                  </p>
                  <p className="text-xs text-emerald-400">Rewards Claimed</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 -mt-8 relative z-20">
        {/* Points Balance Card */}
        {account && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "rounded-2xl shadow-lg p-6 mb-8 border",
              "bg-white dark:bg-slate-900",
              tierConfig.border
            )}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                  Available Points
                </p>
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-4xl font-bold text-emerald-600 dark:text-emerald-400"
                >
                  {account.availablePoints.toLocaleString()}
                </motion.p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Ready to redeem
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Earned</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  {account.totalPoints.toLocaleString()}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Lifetime points</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Current Tier</p>
                <div className="inline-flex items-center gap-2">
                  <span className="text-2xl">{TIER_ICONS[account.tier]}</span>
                  <span
                    className={cn(
                      "px-4 py-1.5 rounded-full text-sm font-bold border",
                      tierConfig.bg,
                      tierConfig.color,
                      tierConfig.border
                    )}
                  >
                    {account.tier}
                  </span>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  {(account.totalPoints * (tiers.find((t) => t.name === account.tier)?.pointsMultiplier || 1)).toFixed(1)}x multiplier
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Spent</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  GHS {account.totalSpent.toFixed(2)}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  {(account.totalPoints / Math.max(account.totalSpent, 1) * 10).toFixed(1)} pts/GHS earned
                </p>
              </div>
            </div>

            {/* Tier Progress */}
            {account.nextTier && (
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      Progress to {TIER_ICONS[account.nextTier.name]} {account.nextTier.name}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    {account.progressToNext.toFixed(0)}%
                  </span>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${account.progressToNext}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={cn(
                      "h-full bg-gradient-to-r rounded-full",
                      tierConfig.gradient
                    )}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Spend GHS {(account.nextTier.threshold - account.totalSpent).toFixed(2)} more
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    GHS {account.totalSpent.toFixed(0)} / GHS {account.nextTier.threshold.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {account.tier === "PLATINUM" && (
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  🎉 You&apos;ve reached the highest tier! Enjoy all exclusive benefits.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: "rewards" as const, label: "Rewards", icon: <Gift className="h-4 w-4" /> },
            { id: "history" as const, label: "Points History", icon: <Clock className="h-4 w-4" /> },
            { id: "how" as const, label: "How It Works", icon: <Info className="h-4 w-4" /> },
            { id: "tiers" as const, label: "Tier Benefits", icon: <Award className="h-4 w-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === "rewards" && rewards.length === 0) loadRewards();
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                activeTab === tab.id
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-200 dark:shadow-emerald-900/30"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {/* Rewards Tab */}
              {activeTab === "rewards" && (
                <motion.div
                  key="rewards"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
                    Rewards Catalog
                  </h2>
                  {rewardsLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-48 rounded-2xl" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {rewards.map((reward, i) => {
                        const canAfford = (account?.availablePoints || 0) >= reward.points;
                        return (
                          <motion.div
                            key={reward.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={cn(
                              "rounded-2xl border p-5 transition-all",
                              "bg-white dark:bg-slate-900",
                              canAfford
                                ? "border-slate-100 dark:border-slate-800 hover:shadow-lg hover:-translate-y-0.5"
                                : "border-slate-100 dark:border-slate-800 opacity-60"
                            )}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="bg-emerald-100 dark:bg-emerald-900/40 p-2.5 rounded-xl text-emerald-600 dark:text-emerald-400">
                                {REWARD_TYPE_ICONS[reward.type] || <Gift className="h-5 w-5" />}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                  {reward.points} pts
                                </span>
                              </div>
                            </div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1">
                              {reward.name}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                              {reward.description}
                            </p>
                            <button
                              onClick={() => handleClaimReward(reward.id)}
                              disabled={!canAfford || claimingReward === reward.id}
                              className={cn(
                                "w-full py-2.5 rounded-xl text-sm font-semibold transition-all",
                                canAfford
                                  ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                                  : "bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                              )}
                            >
                              {claimingReward === reward.id ? (
                                <span className="flex items-center justify-center gap-2">
                                  <span className="animate-spin h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full" />
                                  Claiming...
                                </span>
                              ) : canAfford ? (
                                "Redeem"
                              ) : (
                                `Need ${reward.points - (account?.availablePoints || 0)} more pts`
                              )}
                            </button>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* History Tab */}
              {activeTab === "history" && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
                    Points History
                  </h2>
                  {historyLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 rounded-2xl" />
                      ))}
                    </div>
                  ) : history.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <Clock className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                      <p className="text-slate-500 dark:text-slate-400">No points history yet</p>
                      <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                        Start shopping to earn your first points!
                      </p>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
                      <div className="space-y-1">
                        {history.map((h, i) => (
                          <motion.div
                            key={h.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="relative flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                          >
                            <div
                              className={cn(
                                "relative z-10 flex items-center justify-center w-10 h-10 rounded-full shrink-0",
                                h.points > 0
                                  ? "bg-emerald-100 dark:bg-emerald-900/40"
                                  : "bg-red-100 dark:bg-red-900/40"
                              )}
                            >
                              {h.points > 0 ? (
                                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Gift className="h-4 w-4 text-red-500 dark:text-red-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                                {h.description || h.type}
                              </p>
                              <p className="text-xs text-slate-400 dark:text-slate-500">
                                {new Date(h.createdAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                            <span
                              className={cn(
                                "text-sm font-bold shrink-0",
                                h.points > 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-red-500 dark:text-red-400"
                              )}
                            >
                              {h.points > 0 ? "+" : ""}
                              {h.points.toLocaleString()}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* How It Works Tab */}
              {activeTab === "how" && (
                <motion.div
                  key="how"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
                    How It Works
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {HOW_IT_WORKS.map((step, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                            <span className="font-bold text-sm">{i + 1}</span>
                          </div>
                          <div className="text-emerald-600 dark:text-emerald-400">{step.icon}</div>
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">
                          {step.title}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {step.description}
                        </p>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">
                      Points Calculation
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Base Rate</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                          10 <span className="text-sm font-normal">pts/GHS</span>
                        </p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Points Expiry</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                          365 <span className="text-sm font-normal">days</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tier Benefits Tab */}
              {activeTab === "tiers" && (
                <motion.div
                  key="tiers"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
                    Tier Benefits Comparison
                  </h2>

                  {/* Mobile tier cards */}
                  <div className="lg:hidden space-y-4">
                    {tiers.map((tier, i) => {
                      const config = TIER_CONFIG[tier.name];
                      const isCurrentTier = account?.tier === tier.name;
                      return (
                        <motion.div
                          key={tier.name}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className={cn(
                            "rounded-2xl border p-5 transition-all",
                            "bg-white dark:bg-slate-900",
                            config.border,
                            isCurrentTier && "ring-2 ring-emerald-500 dark:ring-emerald-400"
                          )}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{TIER_ICONS[tier.name]}</span>
                              <div>
                                <h3 className={cn("font-bold text-lg", config.color)}>
                                  {tier.name}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                  Spend GHS {tier.minSpent.toLocaleString()}+
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                {tier.pointsMultiplier}x
                              </p>
                              <p className="text-xs text-slate-400 dark:text-slate-500">multiplier</p>
                            </div>
                          </div>
                          <ul className="space-y-2">
                            {tier.benefits.map((benefit, j) => (
                              <li key={j} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                                {benefit}
                              </li>
                            ))}
                          </ul>
                          {isCurrentTier && (
                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                Your Current Tier
                              </span>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Desktop comparison table */}
                  <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                          <th className="text-left p-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                            Benefit
                          </th>
                          {tiers.map((tier) => {
                            const config = TIER_CONFIG[tier.name];
                            return (
                              <th
                                key={tier.name}
                                className={cn(
                                  "p-4 text-center",
                                  account?.tier === tier.name && "bg-emerald-50 dark:bg-emerald-900/20"
                                )}
                              >
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-2xl">{TIER_ICONS[tier.name]}</span>
                                  <span className={cn("font-bold text-sm", config.color)}>
                                    {tier.name}
                                  </span>
                                  {account?.tier === tier.name && (
                                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">
                                      Current
                                    </span>
                                  )}
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-50 dark:border-slate-800/50">
                          <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                            Minimum Spend
                          </td>
                          {tiers.map((tier) => (
                            <td
                              key={tier.name}
                              className={cn(
                                "p-4 text-center text-sm font-medium text-slate-700 dark:text-slate-200",
                                account?.tier === tier.name && "bg-emerald-50 dark:bg-emerald-900/20"
                              )}
                            >
                              GHS {tier.minSpent.toLocaleString()}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b border-slate-50 dark:border-slate-800/50">
                          <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                            Points Multiplier
                          </td>
                          {tiers.map((tier) => (
                            <td
                              key={tier.name}
                              className={cn(
                                "p-4 text-center text-sm font-bold text-emerald-600 dark:text-emerald-400",
                                account?.tier === tier.name && "bg-emerald-50 dark:bg-emerald-900/20"
                              )}
                            >
                              {tier.pointsMultiplier}x
                            </td>
                          ))}
                        </tr>
                        {["1x points on all purchases", "1.5x points on all purchases", "2x points on all purchases", "3x points on all purchases"].map(
                          (benefit, i) => (
                            <tr key={benefit} className="border-b border-slate-50 dark:border-slate-800/50">
                              <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                                Points on Purchases
                              </td>
                              {tiers.map((tier) => (
                                <td
                                  key={tier.name}
                                  className={cn(
                                    "p-4 text-center",
                                    account?.tier === tier.name && "bg-emerald-50 dark:bg-emerald-900/20"
                                  )}
                                >
                                  {i === TIER_ORDER.indexOf(tier.name) ? (
                                    <Check className="h-5 w-5 text-emerald-500 mx-auto" />
                                  ) : (
                                    <span className="text-slate-300 dark:text-slate-600 text-sm">
                                      {["1x", "1.5x", "2x", "3x"][TIER_ORDER.indexOf(tier.name)]}
                                    </span>
                                  )}
                                </td>
                              ))}
                            </tr>
                          )
                        )}
                        <tr className="border-b border-slate-50 dark:border-slate-800/50">
                          <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                            Birthday Reward
                          </td>
                          {tiers.map((tier) => (
                            <td
                              key={tier.name}
                              className={cn(
                                "p-4 text-center",
                                account?.tier === tier.name && "bg-emerald-50 dark:bg-emerald-900/20"
                              )}
                            >
                              <Check className="h-5 w-5 text-emerald-500 mx-auto" />
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b border-slate-50 dark:border-slate-800/50">
                          <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                            Free Delivery
                          </td>
                          {tiers.map((tier) => (
                            <td
                              key={tier.name}
                              className={cn(
                                "p-4 text-center text-sm text-slate-600 dark:text-slate-300",
                                account?.tier === tier.name && "bg-emerald-50 dark:bg-emerald-900/20"
                              )}
                            >
                              {tier.name === "BRONZE" ? (
                                <span className="text-slate-300 dark:text-slate-600">-</span>
                              ) : tier.name === "SILVER" ? (
                                "Over GHS 100"
                              ) : (
                                <Check className="h-5 w-5 text-emerald-500 mx-auto" />
                              )}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b border-slate-50 dark:border-slate-800/50">
                          <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                            Priority Support
                          </td>
                          {tiers.map((tier) => (
                            <td
                              key={tier.name}
                              className={cn(
                                "p-4 text-center",
                                account?.tier === tier.name && "bg-emerald-50 dark:bg-emerald-900/20"
                              )}
                            >
                              {["GOLD", "PLATINUM"].includes(tier.name) ? (
                                <Check className="h-5 w-5 text-emerald-500 mx-auto" />
                              ) : (
                                <span className="text-slate-300 dark:text-slate-600">-</span>
                              )}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b border-slate-50 dark:border-slate-800/50">
                          <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                            Exclusive Offers
                          </td>
                          {tiers.map((tier) => (
                            <td
                              key={tier.name}
                              className={cn(
                                "p-4 text-center",
                                account?.tier === tier.name && "bg-emerald-50 dark:bg-emerald-900/20"
                              )}
                            >
                              {tier.name === "PLATINUM" ? (
                                <Check className="h-5 w-5 text-emerald-500 mx-auto" />
                              ) : (
                                <span className="text-slate-300 dark:text-slate-600">-</span>
                              )}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                            Personal Pharmacist
                          </td>
                          {tiers.map((tier) => (
                            <td
                              key={tier.name}
                              className={cn(
                                "p-4 text-center",
                                account?.tier === tier.name && "bg-emerald-50 dark:bg-emerald-900/20"
                              )}
                            >
                              {tier.name === "PLATINUM" ? (
                                <Check className="h-5 w-5 text-emerald-500 mx-auto" />
                              ) : (
                                <span className="text-slate-300 dark:text-slate-600">-</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Referral Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-emerald-100 dark:bg-emerald-900/40 p-2 rounded-xl">
                  <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Refer a Friend</h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Share your referral code and both earn <strong className="text-emerald-600 dark:text-emerald-400">500 bonus points</strong>!
              </p>

              {account && (
                <>
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl p-3 mb-4">
                    <code className="flex-1 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400 text-lg tracking-wider">
                      {account.referralCode}
                    </code>
                    <button
                      onClick={copyReferral}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        copied
                          ? "bg-emerald-500 text-white"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      )}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Share via
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => shareReferral("whatsapp")}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#25D366]/10 text-[#25D366] text-sm font-medium hover:bg-[#25D366]/20 transition-colors"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        WhatsApp
                      </button>
                      <button
                        onClick={() => shareReferral("facebook")}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#1877F2]/10 text-[#1877F2] text-sm font-medium hover:bg-[#1877F2]/20 transition-colors"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        Facebook
                      </button>
                      <button
                        onClick={() => shareReferral("twitter")}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#1DA1F2]/10 text-[#1DA1F2] text-sm font-medium hover:bg-[#1DA1F2]/20 transition-colors"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                        </svg>
                        Twitter
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(getReferralLink());
                        toast.success("Referral link copied!");
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                      Copy Referral Link
                    </button>
                  </div>
                </>
              )}
            </motion.div>

            {/* Apply Referral Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-amber-100 dark:bg-amber-900/40 p-2 rounded-xl">
                  <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Have a Code?</h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Enter a friend&apos;s referral code to earn 500 bonus points.
              </p>
              {showReferralInput ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="Enter referral code"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase tracking-wider"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowReferralInput(false);
                        setReferralCode("");
                      }}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleApplyReferral}
                      disabled={applyingReferral || !referralCode.trim()}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      {applyingReferral ? "Applying..." : "Apply"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowReferralInput(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                >
                  <Sparkles className="h-4 w-4" />
                  Apply Referral Code
                </button>
              )}
            </motion.div>

            {/* Quick Stats */}
            {account && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6"
              >
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Points Value</span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      ~GHS {(account.availablePoints * 0.01).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Points Multiplier</span>
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {tiers.find((t) => t.name === account.tier)?.pointsMultiplier || 1}x
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Tier Progress</span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {account.progressToNext.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Total Transactions</span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {history.length}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
