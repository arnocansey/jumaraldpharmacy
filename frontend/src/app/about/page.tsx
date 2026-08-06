import React from "react";
import { Pill, ShieldCheck, HeartPulse, Award } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export default function AboutPage() {
  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-12 space-y-10">
      <div className="text-left space-y-3">
        <Badge variant="emerald">About Jumarald Pharmacy</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          Pioneering Digital Pharmaceutical Excellence
        </h1>
        <p className="text-slate-500 text-sm max-w-2xl mx-auto">
          Built on zero-compromise quality, temperature-controlled cold chain logistics, and instant clinical pharmacist verification.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 text-center space-y-3">
          <ShieldCheck className="h-10 w-10 text-brand-600 mx-auto" />
          <h3 className="font-bold text-slate-900 dark:text-white">100% NAFDAC Verification</h3>
          <p className="text-xs text-slate-500">Every drug is sourced directly from licensed global manufacturers with batch serial numbers.</p>
        </Card>
        <Card className="p-6 text-center space-y-3">
          <HeartPulse className="h-10 w-10 text-brand-600 mx-auto" />
          <h3 className="font-bold text-slate-900 dark:text-white">Cold-Chain Assurance</h3>
          <p className="text-xs text-slate-500">Smart sensors maintain 2°C–8°C temperatures during transit for insulin and vaccines.</p>
        </Card>
        <Card className="p-6 text-center space-y-3">
          <Award className="h-10 w-10 text-brand-600 mx-auto" />
          <h3 className="font-bold text-slate-900 dark:text-white">Licensed Pharmacists</h3>
          <p className="text-xs text-slate-500">Board-certified clinical pharmacists review all prescription uploads around the clock.</p>
        </Card>
      </div>
    </div>
  );
}
