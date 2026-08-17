import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, MapPin, ShieldCheck, HeartPulse, Clock, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-800 rounded-t-3xl sm:rounded-t-[2.5rem]">
      <div className="w-full px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center">
              <div className="bg-white p-2.5 rounded-xl inline-block shadow-md">
                <Image src="/jumaraldlogo.png" alt="Jumarald Pharmacy and Wellness Center" width={40} height={40} className="h-10 w-auto object-contain" />
              </div>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Your premier Ghanaian online pharmacy offering certified pharmaceuticals, telehealth consultations, and express cold-chain delivery straight to your doorstep across Ghana.
            </p>
            <div className="flex flex-col gap-1.5 pt-2 text-xs font-semibold text-emerald-400">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-400" /> 100% FDA Ghana Verified</span>
              <span className="flex items-center gap-1.5"><HeartPulse className="h-4 w-4 text-emerald-400" /> Superintendent: Pharm. Philip Bruce-Tagoe (GPHC Reg. No. 2050984)</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/shop" className="hover:text-emerald-400 transition-colors">Shop Medicines</Link></li>
              <li><Link href="/prescriptions/upload" className="hover:text-emerald-400 transition-colors">Upload Prescription</Link></li>
              <li><Link href="/telehealth" className="hover:text-emerald-400 transition-colors">Consult a Doctor</Link></li>
              <li><Link href="/categories" className="hover:text-emerald-400 transition-colors">Product Categories</Link></li>
              <li><Link href="/faq" className="hover:text-emerald-400 transition-colors">Help & FAQ</Link></li>
            </ul>
          </div>

          {/* Col 3: Categories */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Categories</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/categories" className="hover:text-emerald-400 transition-colors">All Categories</Link></li>
              <li><Link href="/shop" className="hover:text-emerald-400 transition-colors">Prescription Drugs</Link></li>
              <li><Link href="/shop" className="hover:text-emerald-400 transition-colors">Over The Counter (OTC)</Link></li>
              <li><Link href="/shop" className="hover:text-emerald-400 transition-colors">Vitamins & Supplements</Link></li>
              <li><Link href="/shop" className="hover:text-emerald-400 transition-colors">Personal Care & Wellness</Link></li>
            </ul>
          </div>

          {/* Col 4: Contact & Hours */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Facility & Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Prampram N-8 Vakpor Street, Greater Accra Region (GN-0019-1625), Ghana</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>+233 54 477 2483 / +233 30 200 4800 (Call)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <MessageCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>+233 54 477 2483 (WhatsApp)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>care@jumaraldpharmacy.com</span>
              </li>
              <li className="flex items-center gap-2.5 text-xs text-emerald-400 font-semibold pt-1">
                <Clock className="h-4 w-4 shrink-0" />
                <span>Pharmacist Support (Mon-Sun: 8:00 AM - 8:00 PM GMT)</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-500 space-y-1">
          <p>© {new Date().getFullYear()} Jumarald Pharmacy & Wellness Ltd. All rights reserved.</p>
          <p className="text-slate-600">Superintendent Pharmacist: Pharm. Philip Bruce-Tagoe (RC Pharm | GPHC Reg. No. 2050984)</p>
        </div>
      </div>
    </footer>
  );
}
