"use client";

import Link from "next/link";
import { ShieldAlert, CheckCircle2, AlertTriangle, FileText, Lock, UserX, Stethoscope } from "lucide-react";

export default function AcceptableUsePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-16 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
            <ShieldAlert className="h-4 w-4" /> Policy Compliance & Security
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Acceptable Use Policy (AUP)
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm max-w-2xl mx-auto">
            Rules and guidelines governing the use of Jumarald Pharmacy & Wellness digital services, telehealth platform, and AI clinical assistant in Ghana.
          </p>
          <p className="text-xs text-slate-400">Effective Date: January 1, 2026 · Last Updated: August 2026</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200 dark:border-slate-700 space-y-8 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              1. Overview & Purpose
            </h2>
            <p>
              This Acceptable Use Policy (&quot;AUP&quot;) outlines the terms governing your access to and use of Jumarald Pharmacy & Wellness (&quot;Jumarald&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) online web application, mobile interfaces, telehealth consultation portal, prescription upload service, and AI clinical assistant (&quot;Dr. Jumarald AI&quot;).
            </p>
            <p>
              By accessing or using any part of Jumarald Pharmacy digital services, you agree to strictly comply with this AUP, Ghana FDA regulations, Pharmacy Council guidelines, and the Data Protection Act (Act 843).
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              2. Prohibited Uses & Prescription Integrity
            </h2>
            <p>You agree NOT to engage in any of the following prohibited activities:</p>
            <ul className="space-y-2 list-disc list-inside bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm">
              <li><strong>Fraudulent Prescriptions:</strong> Uploading, submitting, or transmitting fake, forged, altered, copied, or stolen medical prescriptions.</li>
              <li><strong>Controlled Substance Misuse:</strong> Attempting to obtain controlled narcotics or prescription-only medicines (POM) without a legitimate, verifiable prescription issued by a licensed Ghanaian physician.</li>
              <li><strong>Identity Theft & Impersonation:</strong> Impersonating any licensed doctor, pharmacist, nurse, Jumarald staff member, or another patient.</li>
              <li><strong>Unauthorized Resale:</strong> Purchasing prescription medications or health products for commercial resale or distribution without pharmaceutical licensing.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-blue-500" />
              3. AI Clinical Assistant (&quot;Dr. Jumarald AI&quot;) Guidelines
            </h2>
            <p>
              Our virtual clinical assistant, <strong>Dr. Jumarald AI</strong>, is engineered to provide health education, symptom triage, OTC product discovery, and drug interaction guidance.
            </p>
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 space-y-2 text-xs sm:text-sm">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                Medical Emergency & AI Disclaimer:
              </p>
              <p>
                Dr. Jumarald AI does NOT provide definitive medical diagnoses or replace in-person doctor consultations. In case of life-threatening emergencies (chest pain, acute dyspnea, stroke, severe bleeding), call Ghana Emergency Services (<strong>112 / 193</strong>) or visit the nearest ER immediately.
              </p>
            </div>
            <p className="pt-2 font-medium text-slate-900 dark:text-white">Prohibited AI Abuse includes:</p>
            <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm pl-2">
              <li>Attempting prompt-injection or jailbreaking attacks to override clinical safety guardrails.</li>
              <li>Automated bot querying or scraping of AI responses.</li>
              <li>Using AI outputs to forge medical documentation or bypass pharmacist verification.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="h-5 w-5 text-purple-500" />
              4. System Abuse & Security Protection
            </h2>
            <p>Users are strictly forbidden from attempting any activity that compromises platform security, including:</p>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm">
              <li>Probing, scanning, or testing system vulnerabilities without explicit written authorization.</li>
              <li>Launching Distributed Denial of Service (DDoS) attacks or automated API flooding.</li>
              <li>Extracting, harvesting, or scraping product catalog, pricing, or customer data.</li>
              <li>Interfering with real-time Socket connections or WebPush notifications.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserX className="h-5 w-5 text-rose-500" />
              5. Monitoring, Enforcement & Account Revocation
            </h2>
            <p>
              Jumarald Pharmacy reserves the right to audit prescription uploads, monitor API request rates, and verify user credentials to maintain regulatory compliance.
            </p>
            <p>
              Violations of this AUP may result in immediate account suspension, cancellation of orders, forfeiture of loyalty rewards, and reporting to legal law enforcement agencies or the Pharmacy Council of Ghana.
            </p>
          </section>

          {/* Section 6 */}
          <section className="pt-6 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Superintendent Pharmacist Oversight: Pharm. Philip Bruce-Tagoe</span>
            </div>
            <Link
              href="/terms"
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
            >
              Read Terms of Service →
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
