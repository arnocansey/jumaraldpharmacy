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
  Zap,
  BookOpen,
  FileSpreadsheet,
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
      { name: "QuickBooks Sync", href: "/quickbooks", icon: FileSpreadsheet, badge: "QB 19" },
      { name: "Staff & Users", href: "/users", icon: Users },
      { name: "Audit Logs", href: "/audit-logs", icon: ShieldCheck },
      { name: "Notifications", href: "/notifications", icon: Bell },
      { name: "Backups", href: "/backups", icon: Database },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function AdminBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
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

  // Close menus on path change
  useEffect(() => {
    setDrawerOpen(false);
    setQuickActionsOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen || quickActionsOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen, quickActionsOpen]);

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

  const userRole = user?.role || "ADMIN";
  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "CP";

  const isHomeActive = pathname === "/";
  const isProductsActive = pathname.startsWith("/products") || pathname.startsWith("/inventory");
  const isOrdersActive = pathname.startsWith("/orders") || pathname.startsWith("/deliveries");
  const isPrescriptionsActive = pathname.startsWith("/prescriptions");
  const isMoreActive =
    !isHomeActive && !isProductsActive && !isOrdersActive && !isPrescriptionsActive && pathname !== "/login";

  const roleAllowedHrefs: Record<string, string[]> = {
    INVENTORY_CLERK: ["/", "/products", "/inventory", "/quickbooks"],
    PHARMACIST: ["/", "/products", "/inventory", "/quickbooks", "/prescriptions", "/copilot", "/ai-knowledge"],
    DOCTOR: ["/", "/prescriptions", "/telehealth", "/copilot", "/ai-knowledge"],
    BRANCH_MANAGER: ["/", "/products", "/inventory", "/quickbooks", "/orders", "/branches", "/reports"],
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
      {/* ── Fixed Mobile Bottom Navigation Bar (iOS / Android Native Feel) ── */}
      <nav
        aria-label="Mobile Navigation Bar"
        className="fixed bottom-0 inset-x-0 z-40 md:hidden glass-bottom-nav bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-t border-emerald-500/20 dark:border-slate-800 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] transition-transform duration-300 pb-safe"
      >
        <div className="flex items-center justify-between h-16 px-3 max-w-md mx-auto relative">
          {/* Tab 1: Dashboard */}
          <Link
            href="/"
            className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 ${
              isHomeActive
                ? "text-emerald-600 dark:text-emerald-400 font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            {isHomeActive && (
              <span className="absolute top-0 w-8 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            )}
            <div className={`p-1.5 rounded-xl transition-transform active:scale-90 ${isHomeActive ? "bg-emerald-50 dark:bg-emerald-950/60" : ""}`}>
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 font-medium">Home</span>
          </Link>

          {/* Tab 2: Products */}
          <Link
            href="/products"
            className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 ${
              isProductsActive
                ? "text-emerald-600 dark:text-emerald-400 font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            {isProductsActive && (
              <span className="absolute top-0 w-8 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            )}
            <div className={`p-1.5 rounded-xl transition-transform active:scale-90 ${isProductsActive ? "bg-emerald-50 dark:bg-emerald-950/60" : ""}`}>
              <Pill className="h-5 w-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 font-medium">Products</span>
          </Link>

          {/* Center Elevated Action Hub (FAB) */}
          <div className="flex-1 flex flex-col items-center justify-center relative -top-3">
            <button
              type="button"
              onClick={() => setQuickActionsOpen(true)}
              className="h-13 w-13 p-3 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-600/40 ring-4 ring-white dark:ring-slate-900 active:scale-95 transition-transform flex items-center justify-center"
              title="Quick Action / Scan"
            >
              <Sparkles className="h-5 w-5 animate-pulse" />
            </button>
            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 tracking-tight">
              Action Hub
            </span>
          </div>

          {/* Tab 3: Orders */}
          <Link
            href="/orders"
            className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 ${
              isOrdersActive
                ? "text-emerald-600 dark:text-emerald-400 font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            {isOrdersActive && (
              <span className="absolute top-0 w-8 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            )}
            <div className={`p-1.5 rounded-xl transition-transform active:scale-90 ${isOrdersActive ? "bg-emerald-50 dark:bg-emerald-950/60" : ""}`}>
              <ShoppingCart className="h-5 w-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 font-medium">Orders</span>
          </Link>

          {/* Tab 4: More Menu */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 ${
              isMoreActive || drawerOpen
                ? "text-emerald-600 dark:text-emerald-400 font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            {isMoreActive && (
              <span className="absolute top-0 w-8 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            )}
            <div
              className={`p-1.5 rounded-xl transition-transform active:scale-90 relative ${
                isMoreActive || drawerOpen ? "bg-emerald-50 dark:bg-emerald-950/60" : ""
              }`}
            >
              <Menu className="h-5 w-5" />
              {isMoreActive && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* ── Quick Action Hub Bottom Sheet (Triggered by Center FAB) ── */}
      {quickActionsOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setQuickActionsOpen(false)}
          />
          <div className="relative w-full bg-white dark:bg-slate-900 rounded-t-[2.5rem] border-t border-emerald-500/20 dark:border-slate-800 shadow-2xl overflow-hidden p-6 z-10 animate-in slide-in-from-bottom duration-250 pb-safe">
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-5" />

            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-500" />
                  Pharmacy Quick Actions
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Instant mobile tools for counter & inventory ops
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuickActionsOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/products"
                onClick={() => setQuickActionsOpen(false)}
                className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-500/20 hover:border-emerald-500 transition-all flex flex-col gap-2 text-left"
              >
                <div className="p-2 w-fit rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
                  <Plus className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Add Product</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Fast 3-field quick add</p>
                </div>
              </Link>

              <Link
                href="/products"
                onClick={() => setQuickActionsOpen(false)}
                className="p-3.5 rounded-2xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-500/20 hover:border-purple-500 transition-all flex flex-col gap-2 text-left"
              >
                <div className="p-2 w-fit rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/30">
                  <Scan className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Scan Barcode / Box</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">AI packaging vision</p>
                </div>
              </Link>

              <Link
                href="/copilot"
                onClick={() => setQuickActionsOpen(false)}
                className="p-3.5 rounded-2xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-500/20 hover:border-teal-500 transition-all flex flex-col gap-2 text-left"
              >
                <div className="p-2 w-fit rounded-xl bg-teal-600 text-white shadow-md shadow-teal-600/30">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Dr. Jumarald AI</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Drug interactions & AI</p>
                </div>
              </Link>

              <Link
                href="/prescriptions"
                onClick={() => setQuickActionsOpen(false)}
                className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-500/20 hover:border-blue-500 transition-all flex flex-col gap-2 text-left"
              >
                <div className="p-2 w-fit rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Review Rx Queue</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Pending doctor slips</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Slide-up Full Navigation Hub Drawer ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setDrawerOpen(false)}
          />

          <div className="relative w-full max-h-[88vh] bg-white dark:bg-slate-900 rounded-t-[2.5rem] border-t border-emerald-500/20 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300 z-10">
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1" />

            {/* Header */}
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
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 flex items-center justify-between pb-safe">
              <div className="text-[11px] text-slate-400">
                &copy; 2026 Jumarald Pharmacy
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
