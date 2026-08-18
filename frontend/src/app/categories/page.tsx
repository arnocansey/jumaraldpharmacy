"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, PackageOpen } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CategorySkeleton } from "@/components/ui/Skeleton";
import { API_URL } from "@/lib/api";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  _count?: { products: number };
}

const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  "prescription-medications": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80",
  "over-the-counter": "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=800&q=80",
  "vitamins-supplements": "https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=800&q=80",
  "personal-care": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80",
  "baby-child-health": "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&q=80",
  "medical-devices": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
  "first-aid": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=800&q=80",
  "chronic-disease": "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80",
  "womens-health": "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&q=80",
  "mens-health": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&q=80",
  "elderly-care": "https://images.unsplash.com/photo-1581579438747-1dc8d1e05dd0?w=800&q=80",
  "nutrition-food": "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&q=80",
  "malaria": "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&q=80",
  "diabetes": "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80",
  "hypertension": "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80",
  "respiratory": "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&q=80",
  "pain-management": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80",
  "digestive-health": "https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=800&q=80",
  "skin-care": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80",
  "allergy-sinus": "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=800&q=80",
};

const DEFAULT_FALLBACK = "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/products/categories`)
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-12 space-y-10">
      <div className="text-left space-y-3">
        <Badge variant="emerald">Explore Medicine Departments</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          Pharmaceutical & Health Categories
        </h1>
        <p className="text-slate-500 text-sm max-w-2xl">
          Browse verified prescription medications, over-the-counter treatments,
          wellness supplements, and medical devices.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <CategorySkeleton key={i} />
          ))}
        </div>
      ) : error || categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-5">
            <PackageOpen className="h-10 w-10 text-slate-400 dark:text-slate-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            No Categories Found
          </h2>
          <p className="text-sm text-slate-500 max-w-md">
            {error
              ? "We couldn't load categories right now. Please try again later."
              : "Categories will appear here once they are added to the catalogue."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((cat) => {
            const catImage = cat.imageUrl || CATEGORY_FALLBACK_IMAGES[cat.slug] || DEFAULT_FALLBACK;
            return (
              <Link key={cat.id} href={`/shop?category=${cat.slug}`}>
                <Card
                  hoverEffect
                  className="p-6 space-y-4 h-full flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="overflow-hidden rounded-2xl h-44 border border-slate-200 dark:border-slate-800">
                      <Image
                        src={catImage}
                        alt={cat.name}
                        width={400}
                        height={176}
                        quality={80}
                        placeholder="blur"
                        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+"
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-xl group-hover:text-brand-600 transition-colors">
                      {cat.name}
                    </h3>
                    {cat.description && (
                      <p className="text-xs text-slate-500 mt-1">
                        {cat.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-bold text-brand-600">
                    {cat._count?.products ?? 0} Products
                  </span>
                  <span className="font-bold text-brand-600 flex items-center gap-1">
                    Browse
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Card>
            </Link>
          );
        })}
        </div>
      )}
    </div>
  );
}
