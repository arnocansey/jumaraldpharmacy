"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, Eye, EyeOff, Shield, Heart, Activity } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("jumarald_admin_token");
    if (token) {
      router.replace("/");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Invalid login credentials");
      }

      const allowedRoles = ["SUPER_ADMIN", "ADMIN", "PHARMACIST", "INVENTORY_CLERK", "BRANCH_MANAGER", "DOCTOR", "DELIVERY_DRIVER"];
      if (!allowedRoles.includes(data.user.role)) {
        throw new Error("Access denied. Admin or Staff privileges required.");
      }

      localStorage.setItem("jumarald_admin_token", data.token);
      localStorage.setItem("jumarald_admin_user", JSON.stringify(data.user));

      toast.success(`Welcome, ${data.user.name}!`);
      router.replace("/");
    } catch (err: any) {
      toast.error(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      {/* Left Panel — Medical/Pharmacy Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-white overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="/pharmacy-login.jpg"
            alt="Jumarald Pharmacy"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/90 via-emerald-900/70 to-emerald-900/50" />
        </div>

          <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full h-full">
          {/* Header */}
          <div className="flex items-center gap-3">
            <img src="/jumaraldlogo.png" alt="Jumarald Pharmacy" className="h-12 w-auto" />
          </div>

          {/* Main Content */}
          <div className="space-y-10">
            <div className="space-y-4">
              <h1 className="text-5xl xl:text-6xl font-extrabold text-white leading-[1.1]">
                Your Health
                <br />
                <span className="text-emerald-300">Our Heartbeat</span>
              </h1>
              <p className="text-emerald-100/70 text-base max-w-md leading-relaxed">
                Manage prescriptions, track inventory, monitor sales analytics, and ensure seamless pharmacy operations — all from one secure dashboard.
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-8">
              {[
                { value: "1,000+", label: "Products Managed" },
                { value: "24/7", label: "Operations Support" },
                { value: "100%", label: "GPHC Compliant" },
              ].map((stat, i) => (
                <div key={i}>
                  <p className="text-2xl font-extrabold text-emerald-300">{stat.value}</p>
                  <p className="text-xs text-emerald-100/50 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Shield, title: "Secure Access", desc: "Encrypted & audited" },
                { icon: Activity, title: "Live Analytics", desc: "Real-time insights" },
                { icon: Heart, title: "Patient Care", desc: "Prescription tracking" },
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <f.icon className="h-5 w-5 text-emerald-300" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{f.title}</p>
                    <p className="text-[11px] text-emerald-200/50 mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-emerald-200/30">
              &copy; 2026 Jumarald Pharmacy &amp; Wellness. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-200/30">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              System Operational
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-white h-full">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3">
            <img src="/jumaraldlogo.png" alt="Jumarald Pharmacy" className="h-12 w-auto" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Sign in
            </h2>
            <p className="text-sm text-slate-500">
              Enter your credentials to access the admin panel
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@jumaraldpharmacy.com"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                <span className="text-xs text-slate-600">Remember me</span>
              </label>
              <button type="button" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40"
              disabled={loading}
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Access Dashboard
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-6 border-t border-slate-100">
            <p className="text-center text-[11px] text-slate-400 leading-relaxed">
              Protected by enterprise-grade security.
              <br />
              All access attempts are logged and monitored.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
