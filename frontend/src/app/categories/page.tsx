import React from "react";
import Link from "next/link";
import { Pill, Heart, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { MOCK_CATEGORIES } from "@/lib/mockData";

export default function CategoriesPage() {
  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-12 space-y-10">
      <div className="text-left space-y-3">
        <Badge variant="emerald">Explore Medicine Departments</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          Pharmaceutical & Health Categories
        </h1>
        <p className="text-slate-500 text-sm max-w-2xl">
          Browse verified prescription medications, over-the-counter treatments, wellness supplements, and medical devices.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {MOCK_CATEGORIES.map((cat) => (
          <Link key={cat.id} href={`/shop?category=${cat.slug}`}>
            <Card hoverEffect className="p-6 space-y-4 h-full flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="overflow-hidden rounded-2xl h-44 border border-slate-200 dark:border-slate-800">
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-xl group-hover:text-brand-600 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{cat.description}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-brand-600">
                <span>Browse Products</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
