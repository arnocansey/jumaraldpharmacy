"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { Package, Truck, CheckCircle, Clock, MapPin, Phone } from "lucide-react";

interface DeliveryData {
  trackingNumber: string;
  status: string;
  estimatedTime?: string;
  order: { orderNumber: string; totalAmount: number; status: string };
  driver?: { name: string; phone: string };
  branch?: { name: string; address: string };
  statusHistory: { status: string; notes?: string; createdAt: string }[];
}

const STATUS_STEPS = ["PREPARING", "PACKED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "NEARBY", "DELIVERED"];
const STATUS_LABELS: Record<string, string> = {
  PREPARING: "Being Prepared", PACKED: "Packed & Ready", ASSIGNED: "Driver Assigned",
  PICKED_UP: "Picked Up", IN_TRANSIT: "In Transit", NEARBY: "Nearby", DELIVERED: "Delivered",
};

export default function TrackByNumberPage({ params }: { params: Promise<{ trackingNumber: string }> }) {
  const [data, setData] = useState<DeliveryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  useEffect(() => {
    params.then((p) => {
      setTrackingNumber(p.trackingNumber);
      apiFetch<DeliveryData>(`/deliveries/track/${p.trackingNumber}`)
        .then(setData)
        .catch((err: any) => setError(err.message || "Tracking number not found"))
        .finally(() => setLoading(false));
    });
  }, [params]);

  function getStepIndex(status: string) { return STATUS_STEPS.indexOf(status); }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" /></div>;

  if (error) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-md">
        <Package className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-red-700 mb-2">Not Found</h2>
        <p className="text-red-600">{error}</p>
      </div>
    </div>
  );

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div><p className="text-sm text-slate-500">Tracking Number</p><p className="text-lg font-bold text-slate-800 font-mono">{data.trackingNumber}</p></div>
            <div className="text-right"><p className="text-sm text-slate-500">Status</p><span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-700">{STATUS_LABELS[data.status]}</span></div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between relative">
              {STATUS_STEPS.map((step, i) => {
                const currentIdx = getStepIndex(data.status);
                const isCompleted = i <= currentIdx;
                const isCurrent = i === currentIdx;
                return (
                  <div key={step} className="flex flex-col items-center flex-1 relative z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isCompleted ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"} ${isCurrent ? "ring-4 ring-emerald-200" : ""}`}>
                      {isCompleted ? <CheckCircle className="h-4 w-4" /> : i + 1}
                    </div>
                    <p className={`text-xs mt-2 text-center ${isCompleted ? "text-emerald-700 font-semibold" : "text-slate-400"}`}>{STATUS_LABELS[step]}</p>
                  </div>
                );
              })}
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-200 -z-0" />
              <div className="absolute top-4 left-0 h-0.5 bg-emerald-500 -z-0" style={{ width: `${(getStepIndex(data.status) / (STATUS_STEPS.length - 1)) * 100}%` }} />
            </div>
          </div>

          {data.driver && (
            <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center"><Truck className="h-5 w-5 text-emerald-600" /></div>
                <div><p className="text-sm font-semibold text-slate-800">{data.driver.name}</p><p className="text-xs text-slate-500">Delivery Driver</p></div>
              </div>
              <a href={`tel:${data.driver.phone}`} className="bg-emerald-600 text-white p-2 rounded-full hover:bg-emerald-700"><Phone className="h-4 w-4" /></a>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
