"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Truck, CheckCircle2, Clock, MapPin, ShieldCheck, Thermometer, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = (params?.id as string) || "JUM-984210";

  const timeline = [
    { title: "Order Placed & Paystack Mobile Money Confirmed", time: "Aug 5, 2026 - 10:15 AM", done: true },
    { title: "Prescription Verified by Superintendent Pharmacist", time: "Aug 5, 2026 - 10:28 AM", done: true },
    { title: "Insulated & Thermal Sensor Sealed at Prampram Hub", time: "Aug 5, 2026 - 11:00 AM", done: true },
    { title: "Handed over to Express Cold-Chain Logistics Rider", time: "Aug 5, 2026 - 11:45 AM", done: true },
    { title: "Out for Final Delivery (En Route via N1 Highway)", time: "In Transit", current: true },
    { title: "Doorstep Delivery & Cold-Chain Handshake", time: "Estimated 1:30 PM", done: false },
  ];

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-10 space-y-8">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Badge variant="emerald">Live Ghana Dispatch Tracking</Badge>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Order #{orderId}
          </h1>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 shadow-sm">
          <Thermometer className="h-4 w-4 text-emerald-600 animate-pulse" /> Thermal Sensor: 4.1°C (Safe 2°C–8°C Range)
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Timeline */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 space-y-6">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
              <Truck className="h-5 w-5 text-emerald-600" /> Fulfillment Timeline
            </h3>

            <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {timeline.map((step, idx) => (
                <div key={idx} className="flex items-start gap-4 relative">
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-white shrink-0 z-10 ${
                      step.done
                        ? "bg-emerald-600"
                        : step.current
                        ? "bg-amber-500 animate-pulse"
                        : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold ${step.current ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-white"}`}>
                      {step.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{step.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Courier & Delivery Info */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <MapPin className="h-5 w-5 text-emerald-600" /> Delivery Address
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>Kofi Owusu</strong><br />
              24 Boundary Road, East Legon<br />
              Accra, Greater Accra Region, Ghana
            </p>
          </Card>

          <Card className="p-6 space-y-3 bg-slate-900 text-white border-slate-800">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" /> Verified Superintendent Pharmacist
            </h3>
            <div className="text-xs space-y-1 text-slate-300">
              <p className="font-bold text-emerald-400">Pharm. Philip Bruce-Tagoe</p>
              <p>RC Pharm | GPHC Reg. No. 2050984</p>
              <p className="text-[11px] text-slate-400 pt-1">
                Verified: Batch number, storage temperature, and expiry compliance audited prior to dispatch.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
