"use client";

import Link from "next/link";
import { ShieldCheck, FileCheck, RefreshCw, Truck, Pill, AlertCircle } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-16 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
            <ShieldCheck className="h-4 w-4" /> FDA Ghana & Pharmacy Council Approved
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Terms of Service & Dispensing Policy
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm max-w-2xl mx-auto">
            Legal terms governing medication sales, prescription verification, telehealth consultations, payments, and cold-chain delivery at Jumarald Pharmacy & Wellness.
          </p>
          <p className="text-xs text-slate-400">Effective Date: January 1, 2026 · Last Updated: August 2026</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200 dark:border-slate-700 space-y-8 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              1. Acceptance of Terms
            </h2>
            <p>
              Welcome to <strong>Jumarald Pharmacy & Wellness Ltd.</strong> (&quot;Jumarald&quot;, &quot;we&quot;, &quot;our&quot;). By creating an account, browsing our online catalog, ordering medicines, or using our Telehealth and AI Assistant services, you agree to bound by these Terms of Service.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Pill className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              2. Prescription Medication (POM) Dispensing Rules
            </h2>
            <p>
              In strict accordance with the Pharmacy Council of Ghana and the Food and Drugs Authority (FDA Ghana):
            </p>
            <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <li><strong>Mandatory Verification:</strong> Medicines marked as &quot;Prescription Required&quot; will only be dispensed after review and digital verification by our licensed Superintendent Pharmacist (Pharm. Philip Bruce-Tagoe, Reg. No. 2050984) or duty clinical team.</li>
              <li><strong>Doctor Details:</strong> Uploaded prescriptions must contain legible practitioner credentials, date, patient name, dosage instructions, and official stamp.</li>
              <li><strong>Right of Refusal:</strong> We reserve the right to decline dispensing any medication if the prescription appears invalid, altered, expired, or poses clinical harm.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-500" />
              3. Delivery & Cold-Chain Protocol
            </h2>
            <p>
              We provide express doorstep delivery across Greater Accra and nationwide Ghana, as well as branch pickup at our Prampram location.
            </p>
            <p>
              Temperature-sensitive pharmaceuticals (e.g. Insulin, Vaccines, Biologics) are transported in temperature-monitored cold chain packaging. Recipients must ensure an authorized adult is available to receive temperature-sensitive deliveries.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-amber-500" />
              4. Return & Refund Policy for Pharmaceuticals
            </h2>
            <p>
              Due to FDA Ghana safety regulations, <strong>prescription medications and temperature-sensitive items cannot be returned or refunded once dispatched</strong>, except in cases of shipping errors or damaged goods reported within 24 hours of delivery.
            </p>
            <p>
              Unopened OTC wellness products or personal care items may be eligible for exchange within 7 days of purchase upon inspection.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-500" />
              5. Telehealth & AI Consultation Disclaimers
            </h2>
            <p>
              Online consultations with our Telehealth Doctors or interactions with Dr. Jumarald AI do not replace emergency medical response. If you suffer acute chest pain, anaphylaxis, severe head trauma, or profuse bleeding, contact emergency medical services immediately.
            </p>
          </section>

          {/* Section Footer */}
          <section className="pt-6 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <span>Facility Contact: 030 398 3047 / 054 477 2483 · care@jumaraldpharmacy.com</span>
            <Link
              href="/privacy"
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
            >
              Read Privacy Policy →
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
