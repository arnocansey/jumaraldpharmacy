"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Pill,
  ShoppingCart,
  FileText,
  Menu,
  X,
  Package,
  Truck,
  Bot,
  Brain,
  Sparkles,
  Building2,
  Stethoscope,
  BarChart3,
  FileBarChart,
  Megaphone,
  Trophy,
  Users,
  ShieldCheck,
  Bell,
  Database,
  Settings,
  LogOut,
  Sun,
  Moon,
  Monitor,
  ChevronRight,
  Plus,
  Scan,
  Layers,
} from "lucide-react";
import { useTheme } from "next-themes";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const allSections: NavSection[] = [
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
      { name: "Pharmacist Copilot", href: "/copilot", icon: Bot, badge: "AI" },
      { name: "AI Knowledge Base", href: "/ai-knowledge", icon: Brain },
      { name: "AI Analytics", href: "/ai-analytics", icon: Sparkles },
    ],
  },
  {
    label: "Network & Care",
    items: [
      { name: "Branches", href: "/branches", icon: Building2 },
      { name: "Telehealth", href: "/telehealth", icon: Stethoscope },
    ],
  },
  {
    label: "Growth & Insights",
    items: [
      { name: "Analytics", href: "/analytics", icon: BarChart3 },
      { name: "Reports", href: "/reports", icon: FileBarChart },
      { name: "Marketing", href: "/marketing", icon: Megaphone },
      { name: "Loyalty Program", href: "/loyalty", icon: Trophy },
    ],
  },
  {
    label: "System & Management",
    items: [
      { name: "Staff & Users", href: "/users", icon: Users },
      { name: "Audit Logs", href: "/audit-logs", icon: ShieldCheck },
      { name: "Notifications", href: "/notifications", icon: Bell },
      { name: "Backups", href: "/backups", icon: Database },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

const primaryTabs = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Products", href: "/products", icon: Pill },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Prescriptions", href: "/prescriptions", icon: FileText },
];

export function AdminBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("jumarald_admin_user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {}
  }, []);

  // Close drawer on path change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const handleLogout = () => {
    localStorage.removeItem("jumarald_admin_token");
    localStorage.removeItem("jumarald_admin_user");
    router.replace("/login");
  };

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const ThemeIcon = !mounted ? Monitor : theme === "dark" ? Moon : theme === "system" ? Monitor : Sun;

  // Check if current route is one of the secondary routes (not in primary tabs)
  const isSecondaryActive =
    !primaryTabs.some((tab) => tab.href === pathname) && pathname !== "/login";

  const userRole = user?.role || "ADMIN";
  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "CP";

  const roleAllowedHrefs: Record<string, string[]> = {
    INVENTORY_CLERK: ["/", "/products", "/inventory"],
    PHARMACIST: ["/", "/products", "/inventory", "/prescriptions", "/copilot", "/ai-knowledge"],
    DOCTOR: ["/", "/prescriptions", "/telehealth", "/copilot", "/ai-knowledge"],
    BRANCH_MANAGER: ["/", "/products", "/inventory", "/orders", "/branches", "/reports"],
    DELIVERY_DRIVER: ["/", "/orders", "/deliveries", "/notifications"],
  };

  const filteredSections = allSections
    .map((sec) => {
      const allowedHrefs = roleAllowedHrefs[userRole];
      if (allowedHrefs) {
        return {
          ...sec,
          items: sec.items.filter((item) => allowedHrefs.includes(item.href)),
        };
      }
      return sec;
    })
    .filter((sec) => sec.items.length > 0);

  return (
    <>
      {/* ── Fixed Mobile Bottom Navigation Bar ── */}
      <nav
        aria-label="Mobile Navigation Bar"
        className="fixed bottom-0 inset-x-0 z-40 md:hidden glass-bottom-nav bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-t border-emerald-500/20 dark:border-slate-800 shadow-[0_-4px_25px_rgba(0,0,0,0.1)] transition-transform duration-300 pb-safe"
      >
        <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
          {primaryTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 group ${
                  isActive
                    ? "text-emerald-600 dark:text-emerald-400 font-bold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {/* Active Indicator Top Pill */}
                {isActive && (
                  <span className="absolute top-0 w-8 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                )}

                <div
                  className={`p-1.5 rounded-xl transition-transform duration-200 group-active:scale-90 ${
                    isActive ? "bg-emerald-50 dark:bg-emerald-950/60" : ""
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] tracking-tight mt-0.5 leading-tight">{tab.name}</span>
              </Link>
            );
          })}

          {/* 5th Tab: "More / All Sections" Drawer Trigger */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 group ${
              isSecondaryActive || drawerOpen
                ? "text-emerald-600 dark:text-emerald-400 font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            {isSecondaryActive && (
              <span className="absolute top-0 w-8 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            )}

            <div
              className={`p-1.5 rounded-xl transition-transform duration-200 group-active:scale-90 relative ${
                isSecondaryActive || drawerOpen ? "bg-emerald-50 dark:bg-emerald-950/60" : ""
              }`}
            >
              <Menu className="h-5 w-5" />
              {isSecondaryActive && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 leading-tight">More</span>
          </button>
        </div>
      </nav>

      {/* ── Slide-up Mobile Navigation Hub Drawer ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer Sheet */}
          <div className="relative w-full max-h-[88vh] bg-white dark:bg-slate-900 rounded-t-[2rem] border-t border-emerald-500/20 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300 z-10">
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1" />

            {/* Header: User Info & Controls */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-white text-sm shadow-md shadow-emerald-500/20">
                  {initials}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {user?.name || "Jumarald Staff"}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      {userRole.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cycleTheme}
                  className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Toggle Theme"
                >
                  <ThemeIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Drawer Quick Action Shortcuts */}
            <div className="px-6 py-3 bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-emerald-500/10 grid grid-cols-2 gap-2">
              <Link
                href="/products"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-500/20 text-xs font-bold text-emerald-700 dark:text-emerald-300 shadow-sm"
              >
                <Plus className="h-4 w-4 text-emerald-500" />
                <span>Upload Product</span>
              </Link>
              <Link
                href="/copilot"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-purple-500/20 text-xs font-bold text-purple-700 dark:text-purple-300 shadow-sm"
              >
                <Bot className="h-4 w-4 text-purple-500" />
                <span>Pharmacist Copilot</span>
              </Link>
            </div>

            {/* Categorized Navigation List */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
              {filteredSections.map((section) => (
                <div key={section.label} className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                    {section.label}
                  </h4>
                  <div className="grid grid-cols-1 gap-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setDrawerOpen(false)}
                          className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                            isActive
                              ? "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/25"
                              : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon
                              className={`h-4 w-4 ${
                                isActive ? "text-white" : "text-emerald-500 dark:text-emerald-400"
                              }`}
                            />
                            <span>{item.name}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {item.badge && (
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300/30">
                                {item.badge}
                              </span>
                            )}
                            <ChevronRight
                              className={`h-3.5 w-3.5 ${
                                isActive ? "text-emerald-200" : "text-slate-400"
                              }`}
                            />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Drawer Footer: Logout */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 flex items-center justify-between">
              <div className="text-[11px] text-slate-400">
                &copy; 2026 Jumarald Pharmacy Control
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
