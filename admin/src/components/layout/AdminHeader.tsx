"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Bell, Search, LogOut, Sun, Moon, Monitor } from "lucide-react";

export function AdminHeader() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
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
    <header className="h-16 glass-header px-6 flex items-center justify-between z-20">
      <div className="flex items-center gap-3 w-80">
        <Search className="h-4 w-4 text-emerald-400" />
        <input
          type="text"
          placeholder="Search products, orders, patients..."
          className="w-full h-9 px-3 rounded-xl text-xs bg-emerald-500/10 dark:bg-slate-900/60 border border-emerald-500/20 dark:border-white/10 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-slate-400 dark:placeholder:text-slate-500 backdrop-blur-md"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={cycleTheme}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title={`Current theme: ${theme}`}
        >
          <ThemeIcon className="h-5 w-5" />
        </button>

        <button className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700">
          <div className="h-9 w-9 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-xs shadow-sm">
            {initials}
          </div>
          <div className="text-xs">
            <p className="font-bold text-slate-900 dark:text-slate-100">{user?.name || "Admin"}</p>
            <p className="text-slate-500 dark:text-slate-400">{user?.role?.replace("_", " ") || "Administrator"}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
