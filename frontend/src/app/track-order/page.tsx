"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Package, Truck, CheckCircle, Clock, MapPin, Phone, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface DeliveryData {
  trackingNumber: string;
  status: string;
  estimatedTime?: string;
  actualDelivery?: string;
  order: { orderNumber: string; totalAmount: number; status: string };
  driver?: { name: string; phone: string };
  branch?: { name: string; address: string };
  statusHistory: { status: string; notes?: string; createdAt: string }[];
}

const STATUS_STEPS = ["PREPARING", "PACKED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "NEARBY", "DELIVERED"];

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

export default function TrackOrderPage() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [data, setData] = useState<DeliveryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!trackingNumber.trim()) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const result = await apiFetch<DeliveryData>(`/deliveries/track/${trackingNumber.trim()}`);
      setData(result);
    } catch (err: any) {
      setError(err.message || "Tracking number not found");
    } finally {
      setLoading(false);
    }
  }

  function getStepIndex(status: string) {
    return STATUS_STEPS.indexOf(status);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="bg-emerald-900 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Truck className="h-12 w-12 mx-auto mb-4 text-emerald-300" />
            <h1 className="text-4xl font-bold mb-3">Track Your Order</h1>
            <p className="text-emerald-200 text-lg">Enter your tracking number to see real-time delivery status</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-6">
        <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-lg p-4 flex items-center gap-3">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Enter tracking number (e.g., TRK-XXXXXX)"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            className="flex-1 outline-none text-slate-700 placeholder:text-slate-400 font-mono"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Tracking..." : "Track"}
          </button>
        </form>
      </div>

      {error && (
        <div className="max-w-3xl mx-auto px-4 mt-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-center">{error}</div>
        </div>
      )}

      {data && (
        <div className="max-w-3xl mx-auto px-4 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-slate-500">Order Number</p>
                <p className="text-lg font-bold text-slate-800 font-mono">{data.order.orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  data.status === "DELIVERED" ? "bg-green-100 text-green-700" :
                  data.status === "FAILED" ? "bg-red-100 text-red-700" :
                  "bg-emerald-100 text-emerald-700"
                }`}>
                  {STATUS_LABELS[data.status] || data.status}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between relative">
                {STATUS_STEPS.map((step, i) => {
                  const currentIdx = getStepIndex(data.status);
                  const isCompleted = i <= currentIdx;
                  const isCurrent = i === currentIdx;
                  return (
                    <div key={step} className="flex flex-col items-center flex-1 relative z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        isCompleted ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                      } ${isCurrent ? "ring-4 ring-emerald-200" : ""}`}>
                        {isCompleted ? <CheckCircle className="h-4 w-4" /> : i + 1}
                      </div>
                      <p className={`text-xs mt-2 text-center ${isCompleted ? "text-emerald-700 font-semibold" : "text-slate-400"}`}>
                        {STATUS_LABELS[step]}
                      </p>
                    </div>
                  );
                })}
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-200 -z-0" />
                <div className="absolute top-4 left-0 h-0.5 bg-emerald-500 -z-0" style={{ width: `${(getStepIndex(data.status) / (STATUS_STEPS.length - 1)) * 100}%` }} />
              </div>
            </div>

            {data.estimatedTime && (
              <div className="bg-emerald-50 rounded-xl p-4 flex items-center gap-3 mb-4">
                <Clock className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Estimated Delivery</p>
                  <p className="text-sm text-emerald-600">{new Date(data.estimatedTime).toLocaleString()}</p>
                </div>
              </div>
            )}

            {data.driver && (
              <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Truck className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{data.driver.name}</p>
                    <p className="text-xs text-slate-500">Delivery Driver</p>
                  </div>
                </div>
                <a href={`tel:${data.driver.phone}`} className="bg-emerald-600 text-white p-2 rounded-full hover:bg-emerald-700">
                  <Phone className="h-4 w-4" />
                </a>
              </div>
            )}
          </motion.div>

          {data.branch && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-800 mb-3">Dispatched From</h3>
              <div className="flex items-start gap-3 text-sm text-slate-600">
                <MapPin className="h-4 w-4 text-emerald-500 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-800">{data.branch.name}</p>
                  <p>{data.branch.address}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
