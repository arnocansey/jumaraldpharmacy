"use client";

import React, { useState } from "react";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { toast } from "sonner";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Thank you for contacting Jumarald Pharmacy! Our care team will respond shortly.");
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-12 space-y-10">
      <div className="text-left space-y-3">
        <Badge variant="blue">Get In Touch</Badge>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Contact Jumarald Healthcare</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">Pharmacy Facility & Headquarters</h3>
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <p className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Prampram N-8 Vakpor Street, Behind Yellow House, Greater Accra Region (GN-0019-1625), Ghana</span>
              </p>
              <p className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-emerald-600 shrink-0" />
                <span>+233 54 477 2483 / +233 30 200 4800</span>
              </p>
              <p className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-emerald-600 shrink-0" />
                <span>care@jumaraldpharmacy.com</span>
              </p>
              <p className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-emerald-600 shrink-0" />
                <span>Open 24 Hours / 7 Days a Week</span>
              </p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
              <p className="font-bold">Superintendent Pharmacist:</p>
              <p>Pharm. Philip Bruce-Tagoe (RC Pharm | GPHC Reg. No. 2050984)</p>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Your Name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm"
              />
              <input
                type="email"
                placeholder="Your Email Address"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm"
              />
              <textarea
                rows={4}
                placeholder="How can our clinical team help you today?"
                required
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm"
              />
              <Button type="submit" variant="primary" size="lg" className="w-full">
                Send Message
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
