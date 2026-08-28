"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { AdminBottomNav } from "@/components/layout/AdminBottomNav";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (pathname === "/login") {
      setAuthorized(true);
      return;
    }

    const token = localStorage.getItem("jumarald_admin_token");
    if (!token) {
      router.replace("/login");
    } else {
      setAuthorized(true);
    }
  }, [pathname, router]);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="antialiased h-screen flex overflow-hidden bg-gradient-to-br from-emerald-50/80 via-teal-50/50 to-slate-100 dark:from-slate-950 dark:via-emerald-950/60 dark:to-slate-900 text-slate-800 dark:text-slate-100 font-sans relative">
      {/* Pharmacy Ambient Medical Light Blobs */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-emerald-400/20 dark:bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed top-1/3 right-0 w-[30rem] h-[30rem] bg-teal-400/15 dark:bg-teal-500/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed -bottom-40 left-1/3 w-[32rem] h-[32rem] bg-emerald-300/20 dark:bg-emerald-600/10 rounded-full blur-[150px] pointer-events-none z-0" />

      <a href="#admin-main" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-emerald-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-xl focus:font-bold focus:outline-none focus:ring-2 focus:ring-emerald-300">
        Skip to main content
      </a>
      
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden z-10">
        <AdminHeader />
        <main id="admin-main" className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 pb-24 md:pb-6 scrollbar-thin">
          {children}
        </main>
      </div>

      <AdminBottomNav />
    </div>
  );
}
