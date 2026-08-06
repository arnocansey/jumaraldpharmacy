"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2, Pill } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";
import { API_URL } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      await res.json();
      setSubmitted(true);
      toast.success("If an account exists, a reset link has been sent!");
    } catch (err: any) {
      setSubmitted(true);
      toast.success("If an account exists, a reset link has been sent!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="h-14 w-14 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Pill className="h-7 w-7" />
          </div>
          <Badge variant="emerald">Account Recovery</Badge>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Reset Password
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Enter your registered patient email address to receive password reset instructions.
          </p>
        </div>

        <Card className="p-8 shadow-xl border-slate-200 dark:border-slate-800">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="kofi.owusu@example.com"
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
                {loading ? "Sending Email..." : "Send Reset Instructions"}
                {!loading && <ArrowRight className="h-4 w-4 ml-1" />}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-4">
              <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Check Your Inbox</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                If an account exists with <strong className="text-slate-900 dark:text-white">{email}</strong>, we&apos;ve sent a secure password reset link.
              </p>
              <Button
                variant="outline"
                size="md"
                onClick={() => setSubmitted(false)}
                className="text-xs font-semibold mt-2"
              >
                Resend Link
              </Button>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-600 dark:text-slate-300 hover:text-emerald-600"
            >
              <ArrowLeft className="h-4 w-4" /> Return to Sign In
            </Link>
          </div>
        </Card>

        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-600" /> Protected by 256-bit GPHC Encrypted Portal
        </div>
      </div>
    </div>
  );
}
