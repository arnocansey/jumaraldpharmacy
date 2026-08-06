"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, FileText, Calendar, User, Clock, CheckCircle, Mail, Phone, ShieldCheck, LogOut, UploadCloud, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { API_URL } from "@/lib/api";

export default function PatientDashboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"orders" | "prescriptions" | "profile">("orders");
  const [user, setUser] = useState<{ id?: string; name: string; email: string; phone?: string; role?: string } | null>(null);

  const [orders, setOrders] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("jumarald_user");
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        router.push("/login");
      }
    } catch (e) {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem("jumarald_token");
    if (!token) return;

    setDataLoading(true);
    Promise.all([
      fetch(`${API_URL}/orders/my`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json()).catch(() => []),
      fetch(`${API_URL}/prescriptions/my`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json()).catch(() => []),
    ]).then(([orders, rxs]) => {
      setOrders(Array.isArray(orders) ? orders : []);
      setPrescriptions(Array.isArray(rxs) ? rxs : []);
    }).finally(() => setDataLoading(false));
  }, []);

  const getInitials = (name: string) => {
    if (!name) return "PT";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleSignOut = () => {
    localStorage.removeItem("jumarald_token");
    localStorage.removeItem("jumarald_user");
    window.dispatchEvent(new Event("jumarald_auth_change"));
    router.push("/login");
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
        <p className="text-sm font-semibold text-slate-500">Loading Patient Account...</p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-10 space-y-8">
      {/* Account Hero Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8 rounded-3xl bg-slate-950 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-10 -mt-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="flex items-center gap-5 relative z-10">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-2xl font-black shadow-lg shadow-emerald-600/30 text-white">
            {getInitials(user.name)}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white">{user.name}</h1>
              <Badge variant="emerald" className="bg-emerald-500 text-white font-bold text-[10px]">Verified Patient</Badge>
            </div>
            <p className="text-xs text-slate-400 font-medium flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-emerald-400" /> {user.email}</span>
              {user.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-emerald-400" /> {user.phone}</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 w-full md:w-auto">
          <Link href="/prescriptions/upload" className="w-full md:w-auto">
            <Button variant="primary" size="md" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md">
              <UploadCloud className="h-4 w-4" /> Upload Rx
            </Button>
          </Link>
          <Button variant="outline" size="md" onClick={handleSignOut} className="border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white">
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-8 text-sm font-bold">
        <button
          onClick={() => setTab("orders")}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            tab === "orders" ? "border-b-2 border-emerald-600 text-emerald-600" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <ShoppingBag className="h-4 w-4" /> Order History
        </button>
        <button
          onClick={() => setTab("prescriptions")}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            tab === "prescriptions" ? "border-b-2 border-emerald-600 text-emerald-600" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <FileText className="h-4 w-4" /> Prescription Vault
        </button>
        <button
          onClick={() => setTab("profile")}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            tab === "profile" ? "border-b-2 border-emerald-600 text-emerald-600" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <User className="h-4 w-4" /> Account Details
        </button>
      </div>

      {/* Tab Contents */}
      {tab === "orders" && (
        <div className="space-y-4">
          {dataLoading ? (
            <div className="flex items-center justify-center py-12 gap-3 text-slate-400">
              <div className="animate-spin h-5 w-5 border-2 border-emerald-600 border-t-transparent rounded-full" />
              <span className="text-sm">Loading your orders...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <ShoppingBag className="h-10 w-10 text-slate-200 mx-auto" />
              <p className="text-sm text-slate-400 font-medium">No orders yet. Start shopping!</p>
              <Link href="/shop"><Button variant="primary" size="sm">Browse Medicines</Button></Link>
            </div>
          ) : (
            orders.map((order: any) => (
              <Card key={order.id} className="p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <span className="font-extrabold text-slate-900 dark:text-white text-base">{order.orderNumber}</span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString("en-GH", { day: "2-digit", month: "short", year: "numeric" })} • {order.orderItems?.length ?? 0} Items
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={order.status === "DELIVERED" ? "emerald" : "blue"}>{order.status}</Badge>
                  <span className="font-extrabold text-slate-900 dark:text-white text-base">{formatCurrency(order.totalAmount)}</span>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === "prescriptions" && (
        <div className="space-y-4">
          {dataLoading ? (
            <div className="flex items-center justify-center py-12 gap-3 text-slate-400">
              <div className="animate-spin h-5 w-5 border-2 border-emerald-600 border-t-transparent rounded-full" />
              <span className="text-sm">Loading prescriptions...</span>
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <FileText className="h-10 w-10 text-slate-200 mx-auto" />
              <p className="text-sm text-slate-400 font-medium">No prescriptions uploaded yet.</p>
              <Link href="/prescriptions/upload"><Button variant="primary" size="sm">Upload Prescription</Button></Link>
            </div>
          ) : (
            prescriptions.map((rx: any) => (
              <Card key={rx.id} className="p-5 flex items-center justify-between shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm font-mono">{rx.id.slice(0, 8).toUpperCase()}</span>
                    <Badge variant={rx.status === "APPROVED" ? "emerald" : "blue"}>{rx.status.replace("_", " ")}</Badge>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{rx.patientNotes || "No patient notes"}</p>
                  {rx.pharmacistNote && <p className="text-[11px] text-emerald-600">Pharmacist: {rx.pharmacistNote}</p>}
                  <p className="text-[11px] text-slate-400">{new Date(rx.createdAt).toLocaleDateString("en-GH")}</p>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === "profile" && (
        <Card className="p-8 space-y-6 max-w-2xl">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">Personal Patient Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-xs font-semibold text-slate-500 block">Full Name</label>
              <p className="font-bold text-slate-900 dark:text-white mt-1">{user.name}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block">Email Address</label>
              <p className="font-bold text-slate-900 dark:text-white mt-1">{user.email}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block">Phone Number</label>
              <p className="font-bold text-slate-900 dark:text-white mt-1">{user.phone || "Not specified"}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block">Account Security</label>
              <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <ShieldCheck className="h-4 w-4" /> 256-bit Encrypted
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
