"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
      <Link href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors flex items-center gap-1">
        <Home className="h-3 w-3" />
        <span className="sr-only">Home</span>
      </Link>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-600" />
          {item.href ? (
            <Link href={item.href} className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors font-medium">
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-800 dark:text-slate-200 font-semibold">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
