"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Pill, FileText, ShoppingCart, Settings, ShieldCheck, Building2, Package, Truck, BarChart3, Bell, Trophy, Megaphone, Stethoscope, ChevronDown, FileBarChart, Database, Users, Bot, Sparkles, Brain } from "lucide-react";

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
    label: "AI & Copilot",
    items: [
      { name: "Pharmacist Copilot", href: "/copilot", icon: Bot },
      { name: "AI Knowledge Base", href: "/ai-knowledge", icon: Brain },
      { name: "AI Analytics", href: "/ai-analytics", icon: Sparkles },
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
      { name: "Reports", href: "/reports", icon: FileBarChart },
      { name: "Marketing", href: "/marketing", icon: Megaphone },
      { name: "Loyalty", href: "/loyalty", icon: Trophy },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Staff & Users", href: "/users", icon: Users },
      { name: "Audit Logs", href: "/audit-logs", icon: ShieldCheck },
      { name: "Notifications", href: "/notifications", icon: Bell },
      { name: "Backups", href: "/backups", icon: Database },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [role, setRole] = React.useState<string>("ADMIN");
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>(
    Object.fromEntries(sections.map((s) => [s.label, true]))
  );

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("jumarald_admin_user");
      if (stored) {
        const u = JSON.parse(stored);
        if (u.role) setRole(u.role);
      }
    } catch {}
  }, []);

  const toggleSection = (label: string) => {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const roleAllowedHrefs: Record<string, string[]> = {
    INVENTORY_CLERK: ["/", "/products", "/inventory"],
    PHARMACIST: ["/", "/products", "/inventory", "/prescriptions", "/copilot", "/ai-knowledge"],
    DOCTOR: ["/", "/prescriptions", "/telehealth", "/copilot", "/ai-knowledge"],
    BRANCH_MANAGER: ["/", "/products", "/inventory", "/orders", "/branches", "/reports"],
    DELIVERY_DRIVER: ["/", "/orders", "/deliveries", "/notifications"],
  };

  const roleModeLabels: Record<string, string> = {
    SUPER_ADMIN: "Super Admin Mode",
    ADMIN: "System Admin Mode",
    PHARMACIST: "Chief Pharmacist Mode",
    INVENTORY_CLERK: "Inventory Clerk Mode",
    DOCTOR: "Medical Doctor Mode",
    BRANCH_MANAGER: "Branch Manager Mode",
    DELIVERY_DRIVER: "Delivery Courier Mode",
  };

  const filteredSections = sections.map((sec) => {
    const allowedHrefs = roleAllowedHrefs[role];
    if (allowedHrefs) {
      return {
        ...sec,
        items: sec.items.filter((item) => allowedHrefs.includes(item.href)),
      };
    }
    return sec;
  }).filter((sec) => sec.items.length > 0);

  return (
    <aside className="w-64 shrink-0 glass-sidebar flex flex-col h-screen sticky top-0 p-4 z-20">
      <div className="flex flex-col h-full">
        <Link href="/" className="block px-2 shrink-0">
          <div className="bg-white/95 p-3 rounded-2xl border border-white/20 shadow-xl shadow-emerald-950/20 backdrop-blur-md">
            <img src="/jumaraldlogo.png" alt="Jumarald Pharmacy Operations" className="h-9 w-auto object-contain mx-auto" />
          </div>
          <p className="text-[10px] text-emerald-200/80 font-bold tracking-widest uppercase text-center mt-2.5">
            Pharmacy Control Panel
          </p>
        </Link>

        <nav className="flex-1 overflow-y-auto space-y-4 text-sm font-medium mt-6 scrollbar-thin" aria-label="Admin navigation">
          {filteredSections.map((section) => (
            <div key={section.label}>
              <button
                onClick={() => toggleSection(section.label)}
                className="flex items-center justify-between w-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-200/60 hover:text-emerald-200 transition-colors"
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
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                          isActive
                            ? "bg-white/20 text-white font-bold border border-white/30 shadow-lg shadow-emerald-950/40 backdrop-blur-md"
                            : "text-emerald-100/70 hover:text-white hover:bg-white/10 border border-transparent"
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${isActive ? "text-emerald-300" : "text-emerald-200/60"}`} />
                        <span>{link.name}</span>
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
            <ShieldCheck className="h-4 w-4 text-emerald-400" /> {roleModeLabels[role] || "Staff Portal Mode"}
          </div>
          <p>&copy; 2026 Jumarald Pharmacy</p>
        </div>
      </div>
    </aside>
  );
}
