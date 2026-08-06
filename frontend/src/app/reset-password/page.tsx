"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Lock, ArrowRight, ShieldCheck, CheckCircle2, Pill, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";
import { API_URL } from "@/lib/api";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!token) {
      toast.error("Invalid or missing reset token");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Password reset failed");
      }

      setSuccess(true);
      toast.success("Password reset successful!");
    } catch (err: any) {
      toast.error(err.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <Card className="p-8 text-center space-y-4 max-w-md">
          <div className="h-14 w-14 bg-red-100 dark:bg-red-950/80 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Invalid Reset Link</h2>
          <p className="text-sm text-slate-500">This password reset link is invalid or has expired.</p>
          <Link href="/forgot-password">
            <Button variant="primary" size="md">Request New Link</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="h-14 w-14 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Pill className="h-7 w-7" />
          </div>
          <Badge variant="emerald">Secure Reset</Badge>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Create New Password
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Enter a strong new password for your account.
          </p>
        </div>

        <Card className="p-8 shadow-xl border-slate-200 dark:border-slate-800">
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
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

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full bg-emerald-600 hover:bg-emerald-700 font-extrabold text-white h-12 mt-2"
                disabled={loading}
              >
                {loading ? "Resetting Password..." : "Reset Password"}
                {!loading && <ArrowRight className="h-4 w-4 ml-1" />}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-4">
              <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Password Reset Complete</h3>
              <p className="text-xs text-slate-500">Your password has been updated successfully.</p>
              <Link href="/login">
                <Button variant="primary" size="md" className="mt-2">Sign In with New Password</Button>
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
