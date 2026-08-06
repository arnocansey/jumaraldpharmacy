"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, LogOut } from "lucide-react";

export function AdminHeader() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
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

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3 w-80">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search products, orders, patients..."
          className="w-full h-9 px-3 rounded-lg text-xs bg-slate-50 text-slate-900 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="h-9 w-9 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-xs shadow-sm">
            {initials}
          </div>
          <div className="text-xs">
            <p className="font-bold text-slate-900">{user?.name || "Admin"}</p>
            <p className="text-slate-500">{user?.role?.replace("_", " ") || "Administrator"}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
