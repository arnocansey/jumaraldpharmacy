"use client";

import React, { useState } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does prescription upload and verification work?",
      a: "Upload a clear photo or PDF of your doctor's prescription. Our licensed clinical pharmacists verify the authenticity, dosage, and drug interactions promptly during operating hours (typically within 1–2 hours) before dispatching your order.",
    },
    {
      q: "How does Jumarald guarantee cold-chain storage for temperature-sensitive drugs?",
      a: "Biological medications like insulin and vaccines are packed in thermal-insulated containers equipped with active temperature data loggers maintaining 2°C–8°C throughout transit.",
    },
    {
      q: "Can I consult a doctor or pharmacist online?",
      a: "Yes! You can connect with our superintendent pharmacist or licensed physicians under the Telehealth section.",
    },
    {
      q: "What payment methods are supported?",
      a: "We support instant online payments via Paystack (MTN MoMo, Vodafone Cash, AirtelTigo, Credit/Debit Cards) as well as Pay on Delivery for verified orders.",
    },
    {
      q: "Are all medications FDA Ghana certified?",
      a: "100% yes. All pharmaceuticals and health products are sourced directly from licensed manufacturers registered with Food and Drugs Authority (FDA) Ghana.",
    },
  ];

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-12 space-y-8">
      <div className="text-left space-y-3">
        <Badge variant="blue">Help & Support</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          Frequently Asked Questions
        </h1>
        <p className="text-slate-500 text-sm max-w-lg">
          Find instant answers to questions regarding prescription verification, cold-chain delivery, payment options, and telehealth appointments.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <Card key={idx} className="overflow-hidden">
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-5 text-left font-bold text-slate-900 dark:text-white flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <span className="flex items-center gap-3 text-base">
                  <HelpCircle className="h-5 w-5 text-brand-600 shrink-0" /> {faq.q}
                </span>
                <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/50">
                  {faq.a}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
