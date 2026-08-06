"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, Pill, Eye, EyeOff } from "lucide-react";
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

      const allowedRoles = ["SUPER_ADMIN", "ADMIN", "PHARMACIST"];
      if (!allowedRoles.includes(data.user.role)) {
        throw new Error("Access denied. Admin privileges required.");
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
    <div className="min-h-screen flex items-center justify-center px-4 bg-emerald-950">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="h-14 w-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Pill className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Admin Control Panel
          </h1>
          <p className="text-xs text-emerald-300/70 max-w-xs mx-auto">
            Jumarald Pharmacy Operations Portal
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@jumaraldpharmacy.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Signing In..." : "Access Control Panel"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-emerald-300/50">
          Authorized personnel only. All access is logged and audited.
        </p>
      </div>
    </div>
  );
}
