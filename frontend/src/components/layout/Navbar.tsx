"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Pill, Search, ShoppingBag, UploadCloud, Stethoscope, Menu, X, Sun, Moon, LogIn, UserPlus, User, LogOut, LayoutDashboard } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/store/useCartStore";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { totalItemCount } = useCartStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<{ name: string; email: string; role?: string } | null>(null);

  const loadUser = () => {
    try {
      const stored = localStorage.getItem("jumarald_user");
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    }
  };

  useEffect(() => {
    loadUser();
    window.addEventListener("jumarald_auth_change", loadUser);
    return () => window.removeEventListener("jumarald_auth_change", loadUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("jumarald_token");
    localStorage.removeItem("jumarald_user");
    window.dispatchEvent(new Event("jumarald_auth_change"));
    router.push("/");
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Shop Medicines", href: "/shop" },
    { name: "Categories", href: "/categories" },
    { name: "Health Conditions", href: "/health-conditions" },
    { name: "Prescription Upload", href: "/prescriptions/upload" },
    { name: "Telehealth Care", href: "/telehealth" },
    { name: "Health Blog", href: "/blog" },
    { name: "About Jumarald", href: "/about" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full glass-card border-b border-slate-200/80 dark:border-slate-800">
      <div className="w-full px-4 sm:px-8 lg:px-12">
        <div className="flex h-20 items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center group">
            <img src="/jumaraldlogo.png" alt="Jumarald Pharmacy and Wellness Center" className="h-11 w-auto object-contain group-hover:scale-105 transition-transform" />
          </Link>

          {/* Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-md relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search prescription drugs, vitamins, brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl text-sm bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>

          {/* Right Action Icons & Auth Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Prescription Upload Quick Button */}
            <Link href="/prescriptions/upload" className="hidden xl:inline-flex">
              <Button variant="glass" size="md">
                <UploadCloud className="h-4 w-4 text-emerald-600" />
                <span>Upload Rx</span>
              </Button>
            </Link>

            {/* Cart Icon */}
            <Link href="/cart" className="relative p-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <ShoppingBag className="h-6 w-6" />
              {totalItemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white shadow-md animate-pulse">
                  {totalItemCount}
                </span>
              )}
            </Link>

            {/* User Auth Menu */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              {user ? (
                <div className="flex items-center gap-2">
                  <Link href="/dashboard">
                    <Button variant="outline" size="md" className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold hover:bg-emerald-100">
                      <User className="h-4 w-4 text-emerald-600" />
                      <span>{user.name}</span>
                    </Button>
                  </Link>
                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    className="p-2.5 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="outline" size="md" className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-800">
                      <LogIn className="h-4 w-4 text-emerald-600" />
                      <span>Sign In</span>
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="primary" size="md" className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-sm">
                      <UserPlus className="h-4 w-4" />
                      <span>Register</span>
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Hamburger Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8 py-2.5 border-t border-slate-200/50 dark:border-slate-800/50 text-sm font-medium">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors py-1 ${
                  isActive
                    ? "text-emerald-600 dark:text-emerald-400 font-bold border-b-2 border-emerald-600"
                    : "text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden glass-card border-b border-slate-200 dark:border-slate-800 px-4 pt-2 pb-6 space-y-3">
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search medicines..."
              className="w-full h-11 pl-10 pr-4 rounded-xl text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-medium text-slate-700 dark:text-slate-200 hover:text-emerald-600"
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            {user ? (
              <div className="space-y-2">
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="md" className="w-full bg-emerald-600 text-white font-bold">
                    <User className="h-4 w-4" /> Patient Dashboard ({user.name})
                  </Button>
                </Link>
                <Button variant="outline" size="md" onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full text-red-600 border-red-200 font-bold">
                  <LogOut className="h-4 w-4" /> Sign Out
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="md" className="w-full font-bold">
                    <LogIn className="h-4 w-4 text-emerald-600" /> Sign In
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="md" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold">
                    <UserPlus className="h-4 w-4" /> Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
