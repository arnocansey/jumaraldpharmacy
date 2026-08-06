"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Pill, FileText, ShoppingCart, Stethoscope, Settings, LogOut, ShieldCheck, Building2, Package, Truck, BarChart3, Bell, Trophy, Megaphone } from "lucide-react";

export function AdminSidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Products", href: "/products", icon: Pill },
    { name: "Inventory", href: "/inventory", icon: Package },
    { name: "Orders", href: "/orders", icon: ShoppingCart },
    { name: "Prescriptions", href: "/prescriptions", icon: FileText },
    { name: "Branches", href: "/branches", icon: Building2 },
    { name: "Deliveries", href: "/deliveries", icon: Truck },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Marketing", href: "/marketing", icon: Megaphone },
    { name: "Loyalty", href: "/loyalty", icon: Trophy },
    { name: "Notifications", href: "/notifications", icon: Bell },
    { name: "Telehealth", href: "/telehealth", icon: Stethoscope },
    { name: "Settings", href: "/settings", icon: Settings },
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

        <nav className="space-y-0.5 text-sm font-medium">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                  isActive ? "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/30" : "text-emerald-200/80 hover:text-white hover:bg-emerald-900/60"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs">{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-emerald-900 text-xs text-emerald-300/70 space-y-2">
        <div className="flex items-center gap-2 text-emerald-300 font-semibold">
          <ShieldCheck className="h-4 w-4 text-emerald-400" /> Chief Pharmacist Mode
        </div>
        <p>© 2026 Jumarald Pharmacy</p>
      </div>
    </aside>
  );
}
