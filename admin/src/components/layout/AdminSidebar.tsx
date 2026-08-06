"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Pill, FileText, ShoppingCart, Settings, ShieldCheck, Building2, Package, Truck, BarChart3, Bell, Trophy, Megaphone, Stethoscope, ChevronDown } from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: any;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    label: "Operations",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Products", href: "/products", icon: Pill },
      { name: "Inventory", href: "/inventory", icon: Package },
      { name: "Orders", href: "/orders", icon: ShoppingCart },
      { name: "Prescriptions", href: "/prescriptions", icon: FileText },
      { name: "Deliveries", href: "/deliveries", icon: Truck },
    ],
  },
  {
    label: "Network",
    items: [
      { name: "Branches", href: "/branches", icon: Building2 },
      { name: "Telehealth", href: "/telehealth", icon: Stethoscope },
    ],
  },
  {
    label: "Growth",
    items: [
      { name: "Analytics", href: "/analytics", icon: BarChart3 },
      { name: "Marketing", href: "/marketing", icon: Megaphone },
      { name: "Loyalty", href: "/loyalty", icon: Trophy },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Notifications", href: "/notifications", icon: Bell },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>(
    Object.fromEntries(sections.map((s) => [s.label, true]))
  );

  const toggleSection = (label: string) => {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside className="w-64 shrink-0 bg-emerald-950 dark:bg-emerald-950 border-r border-emerald-900 dark:border-emerald-900 flex flex-col h-screen sticky top-0 p-4">
      <div className="flex flex-col h-full">
        <Link href="/" className="block px-2 shrink-0">
          <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl shadow-md">
            <img src="/jumaraldlogo.png" alt="Jumarald Pharmacy Operations" className="h-9 w-auto object-contain mx-auto" />
          </div>
          <p className="text-[10px] text-emerald-300 font-semibold tracking-wider uppercase text-center mt-2">
            Admin Operations Panel
          </p>
        </Link>

        <nav className="flex-1 overflow-y-auto space-y-4 text-sm font-medium mt-6 scrollbar-thin scrollbar-thumb-emerald-800 scrollbar-track-transparent" aria-label="Admin navigation">
          {sections.map((section) => (
            <div key={section.label}>
              <button
                onClick={() => toggleSection(section.label)}
                className="flex items-center justify-between w-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400/60 hover:text-emerald-300 transition-colors"
                aria-expanded={openSections[section.label]}
              >
                {section.label}
                <ChevronDown className={`h-3 w-3 transition-transform ${openSections[section.label] ? "" : "-rotate-90"}`} />
              </button>
              {openSections[section.label] && (
                <div className="space-y-0.5 mt-1">
                  {section.items.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                          isActive
                            ? "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/30"
                            : "text-emerald-200/80 hover:text-white hover:bg-emerald-900/60"
                        }`}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-xs">{link.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="pt-4 border-t border-emerald-900 text-xs text-emerald-300/70 space-y-2 shrink-0 mt-auto">
          <div className="flex items-center gap-2 text-emerald-300 font-semibold">
            <ShieldCheck className="h-4 w-4 text-emerald-400" /> Chief Pharmacist Mode
          </div>
          <p>&copy; 2026 Jumarald Pharmacy</p>
        </div>
      </div>
    </aside>
  );
}
