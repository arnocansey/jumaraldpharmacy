"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Bell, Search, LogOut, Sun, Moon, Monitor, X } from "lucide-react";

export function AdminHeader() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("jumarald_admin_user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("jumarald_admin_token");
    localStorage.removeItem("jumarald_admin_user");
    router.replace("/login");
  };

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "CP";

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const ThemeIcon = !mounted ? Monitor : theme === "dark" ? Moon : theme === "system" ? Monitor : Sun;

  return (
    <header className="h-16 glass-header px-4 sm:px-6 flex items-center justify-between z-20 shrink-0 relative">
      {/* Mobile Branding (Visible only on mobile screens < md) */}
      <div className="flex items-center gap-2.5 md:hidden">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-emerald-600 p-1.5 rounded-xl shadow-md shadow-emerald-600/20">
            <img
              src="/jumaraldlogo.png"
              alt="Jumarald Logo"
              className="h-6 w-auto object-contain brightness-0 invert"
              onError={(e) => {
                // Fallback if logo path differs
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 block leading-tight">
              Jumarald
            </span>
            <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">
              Pharmacy Ops
            </span>
          </div>
        </Link>
      </div>

      {/* Desktop Search Bar (Hidden on mobile) */}
      <div className="hidden md:flex items-center gap-2.5 w-80">
        <Search className="h-4 w-4 text-emerald-500 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products, orders, patients..."
          className="w-full h-9 px-3 rounded-xl text-xs bg-emerald-500/10 dark:bg-slate-900/60 border border-emerald-500/20 dark:border-white/10 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-slate-400 dark:placeholder:text-slate-500 backdrop-blur-md transition-all"
        />
      </div>

      {/* Mobile Search Overlay / Expandable Bar */}
      {mobileSearchOpen && (
        <div className="absolute inset-x-0 inset-y-0 bg-white dark:bg-slate-900 px-4 flex items-center gap-2 z-30 md:hidden animate-in fade-in duration-150">
          <Search className="h-4 w-4 text-emerald-500 shrink-0" />
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, orders, patients..."
            className="w-full h-10 px-3 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border-none text-slate-800 dark:text-slate-100 focus:outline-none placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={() => setMobileSearchOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Search Trigger Button */}
        <button
          type="button"
          onClick={() => setMobileSearchOpen(true)}
          className="md:hidden p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Search"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Theme Switcher */}
        <button
          type="button"
          onClick={cycleTheme}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={`Theme: ${theme}`}
        >
          <ThemeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        {/* Notification Bell */}
        <Link
          href="/notifications"
          className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Notifications"
        >
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500" />
        </Link>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-800">
          <Link
            href="/settings"
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center font-bold text-white text-xs shadow-sm ring-2 ring-emerald-500/20 hover:scale-105 transition-transform shrink-0"
            title={`${user?.name || "Admin"} (Settings)`}
          >
            {initials}
          </Link>

          {/* Desktop User Info */}
          <div className="hidden sm:block text-xs">
            <p className="font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {user?.name || "Admin"}
            </p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold leading-tight">
              {user?.role?.replace("_", " ") || "Administrator"}
            </p>
          </div>

          {/* Desktop Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="hidden sm:block p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
