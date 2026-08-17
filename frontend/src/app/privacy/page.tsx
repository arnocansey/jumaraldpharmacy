"use client";

import Link from "next/link";
import { Lock, Eye, Database, Shield, Server, CheckCircle } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-16 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
            <Lock className="h-4 w-4" /> Ghana Data Protection Act 2012 (Act 843)
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Privacy & Data Protection Policy
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm max-w-2xl mx-auto">
            How Jumarald Pharmacy & Wellness collects, protects, uses, and encrypts your medical records, prescription uploads, and personal information.
          </p>
          <p className="text-xs text-slate-400">Effective Date: January 1, 2026 · Last Updated: August 2026</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200 dark:border-slate-700 space-y-8 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Eye className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              1. Information We Collect
            </h2>
            <p>
              To provide safe pharmaceutical care and doorstep delivery, we collect the following categories of personal and medical data:
            </p>
            <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <li><strong>Personal Identifiers:</strong> Name, phone number, email address, physical delivery address, and Ghana Digital Address.</li>
              <li><strong>Health & Clinical Data:</strong> Uploaded prescription photos/PDFs, doctor notes, drug allergy history, and clinical telehealth notes.</li>
              <li><strong>Transaction & Payment Data:</strong> Order history and Paystack transaction references (we do NOT store raw credit card numbers or PINs).</li>
              <li><strong>AI Interaction Logs:</strong> Anonymous queries submitted to Dr. Jumarald AI for clinical quality assurance and safety auditing.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-500" />
              2. How We Use Your Data
            </h2>
            <p>Your data is processed strictly for the following purposes:</p>
            <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">
              <li>Verifying prescriptions and dispensing genuine medicines under Superintendent Pharmacist supervision.</li>
              <li>Fulfilling orders and delivering cold-chain shipments to your delivery address.</li>
              <li>Enabling telehealth consultations with certified physicians.</li>
              <li>Sending SMS or WebPush order tracking updates and refill reminders.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Server className="h-5 w-5 text-purple-500" />
              3. Data Security & Storage Architecture
            </h2>
            <p>
              Patient data is stored in our secure, encrypted Neon PostgreSQL database with SSL/TLS transmission encryption. Passwords are salted and hashed using `bcrypt`. Prescription uploads are processed via secure memory buffers and encrypted Cloudinary CDN storage with restricted access permissions.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" />
              4. Patient Rights Under Act 843
            </h2>
            <p>
              Under the Data Protection Act 2012 (Act 843) of Ghana, you have the right to request access to your personal data, request correction of inaccurate records, or request deletion of your account and data.
            </p>
            <p>
              To exercise your data protection rights, contact our Data Protection Officer at <a href="mailto:privacy@jumaraldpharmacy.com" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">privacy@jumaraldpharmacy.com</a>.
            </p>
          </section>

          {/* Section Footer */}
          <section className="pt-6 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span>Registered Data Protection Controller · Ghana DPC Compliant</span>
            </div>
            <Link
              href="/acceptable-use"
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
            >
              Read Acceptable Use Policy →
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
