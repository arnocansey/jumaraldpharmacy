"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  ArrowRight,
  Navigation,
  CircleDot,
  Loader2,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useSocketContext } from "@/app/providers";

interface DeliveryData {
  trackingNumber: string;
  status: string;
  estimatedTime?: string;
  actualDelivery?: string;
  order: { orderNumber: string; totalAmount: number; status: string };
  driver?: { name: string; phone: string; currentLocation?: { lat: number; lng: number } };
  branch?: { name: string; address: string };
  statusHistory: { status: string; notes?: string; createdAt: string }[];
}

const STATUS_STEPS = [
  "PREPARING",
  "PACKED",
  "ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
  "NEARBY",
  "DELIVERED",
];

const STATUS_LABELS: Record<string, string> = {
  PREPARING: "Being Prepared",
  PACKED: "Packed & Ready",
  ASSIGNED: "Driver Assigned",
  PICKED_UP: "Picked Up",
  IN_TRANSIT: "In Transit",
  NEARBY: "Nearby",
  DELIVERED: "Delivered",
  FAILED: "Delivery Failed",
  CANCELLED: "Cancelled",
};

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded ${className}`} />
  );
}

function LoadingSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2"><SkeletonPulse className="h-3 w-24" /><SkeletonPulse className="h-6 w-40" /></div>
          <SkeletonPulse className="h-8 w-28 rounded-full" />
        </div>
        <div className="flex items-center justify-between">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <SkeletonPulse className="h-8 w-8 rounded-full" />
              <SkeletonPulse className="h-2 w-12" />
            </div>
          ))}
        </div>
        <SkeletonPulse className="h-16 w-full rounded-xl" />
        <SkeletonPulse className="h-16 w-full rounded-xl" />
      </div>
    </div>
  );
}

function ETACountdown({ estimatedTime }: { estimatedTime: string }) {
  const [remaining, setRemaining] = useState("");
  const [progress, setProgress] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const target = new Date(estimatedTime).getTime();
    const elapsed = target - Date.now();
    // Assume 30min total window for progress
    const totalWindow = 30 * 60 * 1000;
    const start = target - totalWindow;
    startRef.current = start;

    function tick() {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setRemaining("Arriving now");
        setProgress(100);
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemaining(`${mins}m ${secs}s`);
      const pct = Math.min(100, Math.max(0, ((now - start) / totalWindow) * 100));
      setProgress(pct);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [estimatedTime]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border border-emerald-200 dark:border-emerald-700/50 rounded-xl p-4"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="relative">
          <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-emerald-500 rounded-full animate-ping" />
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
            Estimated Delivery
          </p>
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
            {remaining}
          </p>
        </div>
      </div>
      <div className="w-full bg-emerald-200 dark:bg-emerald-800 rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 text-right">
        {new Date(estimatedTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </p>
    </motion.div>
  );
}

function DriverLocationCard({ driver }: { driver: NonNullable<DeliveryData["driver"]> }) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 relative flex items-center justify-center">
        <div className="absolute inset-0 opacity-20">
          <svg viewBox="0 0 400 200" className="w-full h-full">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-400" />
              </pattern>
            </defs>
            <rect width="400" height="200" fill="url(#grid)" />
            <line x1="50" y1="180" x2="350" y2="180" stroke="currentColor" strokeWidth="3" className="text-slate-300" strokeDasharray="8,4" />
            <line x1="100" y1="160" x2="300" y2="100" stroke="currentColor" strokeWidth="2" className="text-emerald-400" />
          </svg>
        </div>
        <div className="relative z-10 flex flex-col items-center gap-2">
          <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-pulse">
            <Navigation className="h-6 w-6 text-white" />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-slate-800/80 px-3 py-1 rounded-full backdrop-blur-sm">
            Driver En Route
          </p>
        </div>
      </div>
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center">
            <Truck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {driver.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Delivery Driver</p>
          </div>
        </div>
        <a
          href={`tel:${driver.phone}`}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-emerald-700 active:scale-95 transition-all shadow-md shadow-emerald-600/20"
        >
          <Phone className="h-4 w-4" />
          <span className="text-sm">Call Driver</span>
        </a>
      </div>
    </div>
  );
}

function StatusTimeline({ history }: { history: DeliveryData["statusHistory"] }) {
  if (!history || history.length === 0) return null;

  const sorted = [...history].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">
        Delivery Timeline
      </h3>
      <div className="space-y-0">
        {sorted.map((entry, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative flex items-start gap-3 pb-4 last:pb-0"
          >
            <div className="flex flex-col items-center">
              <div
                className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                  i === 0
                    ? "bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-900/40"
                    : "bg-slate-300 dark:bg-slate-600"
                }`}
              />
              {i < sorted.length - 1 && (
                <div className="w-px flex-1 bg-slate-200 dark:bg-slate-700 mt-1" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium ${
                  i === 0
                    ? "text-slate-800 dark:text-slate-100"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {STATUS_LABELS[entry.status] || entry.status}
              </p>
              {entry.notes && (
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                  {entry.notes}
                </p>
              )}
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {new Date(entry.createdAt).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ProgressStepper({ status }: { status: string }) {
  const currentIdx = STATUS_STEPS.indexOf(status);

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        {STATUS_STEPS.map((step, i) => {
          const isCompleted = i <= currentIdx;
          const isCurrent = i === currentIdx;

          return (
            <div key={step} className="flex flex-col items-center flex-1 relative z-10">
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1 : 1,
                  backgroundColor: isCompleted ? "#10b981" : "#e2e8f0",
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold relative ${
                  isCurrent ? "text-white" : isCompleted ? "text-white" : "text-slate-500 dark:text-slate-400"
                } dark:${isCompleted ? "" : "bg-slate-600"}`}
              >
                {isCompleted ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <span>{i + 1}</span>
                )}
                {isCurrent && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-emerald-400"
                    animate={{ scale: [1, 1.4, 1], opacity: [1, 0, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
              </motion.div>
              <p
                className={`text-[10px] mt-2 text-center leading-tight max-w-[60px] ${
                  isCompleted
                    ? "text-emerald-700 dark:text-emerald-400 font-semibold"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {STATUS_LABELS[step]}
              </p>
            </div>
          );
        })}
      </div>
      {/* Track lines */}
      <div className="absolute top-[18px] left-0 right-0 flex items-center px-0 z-0">
        <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
            initial={{ width: 0 }}
            animate={{
              width: `${(Math.max(0, currentIdx) / (STATUS_STEPS.length - 1)) * 100}%`,
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [data, setData] = useState<DeliveryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);

  const { on, off, isConnected } = useSocketContext();

  const handleStatusUpdate = useCallback(
    (payload: { trackingNumber: string; status: string; driver?: DeliveryData["driver"] }) => {
      setData((prev) => {
        if (!prev || prev.trackingNumber !== payload.trackingNumber) return prev;
        const newHistory = [
          ...prev.statusHistory,
          { status: payload.status, createdAt: new Date().toISOString() },
        ];
        return {
          ...prev,
          status: payload.status,
          driver: payload.driver || prev.driver,
          statusHistory: newHistory,
        };
      });
    },
    []
  );

  const handleLocationUpdate = useCallback(
    (payload: { trackingNumber: string; lat: number; lng: number }) => {
      if (data && data.trackingNumber === payload.trackingNumber) {
        setDriverLocation({ lat: payload.lat, lng: payload.lng });
      }
    },
    [data]
  );

  useEffect(() => {
    on("delivery:statusUpdate", handleStatusUpdate);
    on("delivery:locationUpdate", handleLocationUpdate);
    return () => {
      off("delivery:statusUpdate", handleStatusUpdate);
      off("delivery:locationUpdate", handleLocationUpdate);
    };
  }, [on, off, handleStatusUpdate, handleLocationUpdate]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!trackingNumber.trim()) return;
    setLoading(true);
    setError("");
    setData(null);
    setDriverLocation(null);
    try {
      const result = await apiFetch<DeliveryData>(`/deliveries/track/${trackingNumber.trim()}`);
      setData(result);
      if (result.driver?.currentLocation) {
        setDriverLocation(result.driver.currentLocation);
      }
    } catch (err: any) {
      setError(err.message || "Tracking number not found");
    } finally {
      setLoading(false);
    }
  }

  const isTransitActive = data
    ? ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "NEARBY"].includes(data.status)
    : false;
  const isDelivered = data?.status === "DELIVERED";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
      {/* Hero */}
      <div className="bg-emerald-900 dark:bg-emerald-950 text-white py-14 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 800 300">
            <circle cx="100" cy="150" r="200" fill="white" />
            <circle cx="700" cy="50" r="150" fill="white" />
          </svg>
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Truck className="h-12 w-12 mx-auto mb-4 text-emerald-300" />
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Track Your Order</h1>
            <p className="text-emerald-200 text-lg">
              Real-time delivery tracking — stay updated every step
            </p>
          </motion.div>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-3xl mx-auto px-4 -mt-5">
        <form
          onSubmit={handleSearch}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-3 flex items-center gap-3 border border-slate-100 dark:border-slate-700"
        >
          <div className="pl-2">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Enter tracking number (e.g., TRK-XXXXXX)"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            className="flex-1 outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400 font-mono text-sm bg-transparent"
          />
          <button
            type="submit"
            disabled={loading || !trackingNumber.trim()}
            className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Search className="h-4 w-4" />
                Track
              </>
            )}
          </button>
        </form>
        {isConnected && (
          <div className="flex items-center gap-1.5 mt-2 justify-end">
            <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs text-slate-400">Live updates active</span>
          </div>
        )}
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-3xl mx-auto px-4 mt-6"
          >
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-400 text-center flex items-center justify-center gap-2">
              <Package className="h-4 w-4" />
              {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading skeleton */}
      {loading && <LoadingSkeleton />}

      {/* Results */}
      <AnimatePresence>
        {data && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto px-4 py-8 space-y-5"
          >
            {/* Order Header Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Order Number
                  </p>
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-100 font-mono">
                    {data.order.orderNumber}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Status
                  </p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      isDelivered
                        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                        : data.status === "FAILED"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                        : data.status === "CANCELLED"
                        ? "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                    }`}
                  >
                    {STATUS_LABELS[data.status] || data.status}
                  </span>
                </div>
              </div>

              {/* Progress Stepper */}
              <div className="mb-6 px-1">
                <ProgressStepper status={data.status} />
              </div>

              {/* ETA */}
              {data.estimatedTime && !isDelivered && (
                <ETACountdown estimatedTime={data.estimatedTime} />
              )}

              {/* Delivered confirmation */}
              {isDelivered && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-800 dark:text-green-200">
                      Delivered Successfully
                    </p>
                    {data.actualDelivery && (
                      <p className="text-sm text-green-600 dark:text-green-400">
                        {new Date(data.actualDelivery).toLocaleString()}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Map + Driver */}
            {isTransitActive && data.driver && (
              <DriverLocationCard driver={data.driver} />
            )}

            {/* Driver info when not in active transit */}
            {data.driver && !isTransitActive && (
              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center">
                    <Truck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {data.driver.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Delivery Driver</p>
                  </div>
                </div>
                <a
                  href={`tel:${data.driver.phone}`}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 active:scale-95 transition-all text-sm font-semibold"
                >
                  <Phone className="h-4 w-4" />
                  Call
                </a>
              </div>
            )}

            {/* Branch info */}
            {data.branch && (
              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
                  Dispatched From
                </h3>
                <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <MapPin className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {data.branch.name}
                    </p>
                    <p>{data.branch.address}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Status History Timeline */}
            {data.statusHistory && data.statusHistory.length > 0 && (
              <StatusTimeline history={data.statusHistory} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
