"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Pill, FileText, ShoppingCart, Stethoscope, Settings, LogOut, ShieldCheck } from "lucide-react";

export function AdminSidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Executive Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Product & Inventory", href: "/products", icon: Pill },
    { name: "Prescription Queue", href: "/prescriptions", icon: FileText },
    { name: "Order Fulfillment", href: "/orders", icon: ShoppingCart },
    { name: "Telehealth Doctors", href: "/telehealth", icon: Stethoscope },
    { name: "System Settings & RBAC", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-emerald-950 border-r border-emerald-900 flex flex-col justify-between p-4 min-h-screen">
      <div className="space-y-6">
        <Link href="/" className="block px-2">
          <div className="bg-white p-2.5 rounded-xl shadow-md">
            <img src="/jumaraldlogo.png" alt="Jumarald Pharmacy Operations" className="h-9 w-auto object-contain mx-auto" />
          </div>
          <p className="text-[10px] text-emerald-300 font-semibold tracking-wider uppercase text-center mt-2">
            Admin Operations Panel
          </p>
        </Link>

        <nav className="space-y-1 text-sm font-medium">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                  isActive ? "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/30" : "text-emerald-200/80 hover:text-white hover:bg-emerald-900/60"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-emerald-900 text-xs text-emerald-300/70 space-y-2">
        <div className="flex items-center gap-2 text-emerald-300 font-semibold">
          <ShieldCheck className="h-4 w-4 text-emerald-400" /> Chief Pharmacist Mode
        </div>
        <p>© 2026 Jumarald Pharmacy Control Panel</p>
      </div>
    </aside>
  );
}
