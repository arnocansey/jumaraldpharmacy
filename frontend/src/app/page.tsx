"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Pill,
  Stethoscope,
  ArrowRight,
  Plus,
  Star,
  HelpCircle,
  Package,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { MOCK_FAQS } from "@/lib/mockData";
import { formatCurrency } from "@/lib/utils";
import { useCartStore, CartProduct } from "@/store/useCartStore";
import { toast } from "sonner";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { API_URL } from "@/lib/api";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  _count?: {
    products?: number;
  };
}

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
  requiresPrescription: boolean;
  category?: string | { id: string; name: string; slug: string };
  images: string[];
  dosageForm?: string;
  brand?: {
    name?: string;
  };
  rating?: number;
  reviewCount?: number;
}

export default function HomePage() {
  const { addToCart } = useCartStore();
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      setLoading(true);
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch(`${API_URL}/products/categories`).then((r) => r.json()),
          fetch(`${API_URL}/products?limit=6&inStockOnly=true`).then((r) => r.json()),
        ]);

        setCategories(Array.isArray(catRes) ? catRes : []);
        setProducts(prodRes.products || []);
      } catch (err) {
        console.error("Failed to load landing page data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadHomeData();
  }, []);

  const handleQuickAdd = (product: ProductItem) => {
    const cartProduct: CartProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      stockQuantity: product.stockQuantity,
      requiresPrescription: product.requiresPrescription || false,
      images: product.images || [],
      category: product.category || "uncategorized",
      brand: product.brand?.name,
    };
    addToCart(cartProduct, 1);
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <div className="space-y-20 pb-20">
      {/* HERO CAROUSEL SECTION WITH BACKGROUND PICTURES */}
      <section className="pt-6 px-4 sm:px-8 lg:px-12 w-full">
        <HeroCarousel />
      </section>

      {/* FEATURED CATEGORIES GRID */}
      <section className="w-full px-4 sm:px-8 lg:px-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Top Health Categories
            </h2>
            <p className="text-sm text-slate-500 mt-1">Browse authentic healthcare products by category</p>
          </div>
          <Link href="/shop" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            <span>View All</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
            <span className="text-xs">Loading health categories...</span>
          </div>
        ) : categories.length === 0 ? (
          <Card className="p-8 text-center text-slate-400 space-y-2">
            <Pill className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No categories added yet</p>
            <p className="text-xs text-slate-400">Categories added by administration will appear here automatically.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/shop?category=${cat.slug}`}>
                <Card hoverEffect className="text-center p-5 space-y-3 cursor-pointer group">
                  <div className="h-12 w-12 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Pill className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                      {cat.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{cat._count?.products || 0}+ Items</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* PROMOTIONAL CARE PACKAGES & FLASH SALE BANNERS WITH BACKGROUND PICTURES */}
      <section className="w-full px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-8 rounded-3xl relative overflow-hidden text-white space-y-4 shadow-xl border border-emerald-800">
            <Image src="/images/hero-pharmacy.jpg" alt="Health Care Packages" fill quality={85} placeholder="blur" blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMWYyOTM3Ii8+PC9zdmc+" className="absolute inset-0 w-full h-full object-cover filter brightness-[0.35]" />
            <div className="relative z-10 space-y-3">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl" />
              <Badge variant="emerald" className="bg-emerald-500 text-white font-bold">Special Care Offer</Badge>
              <h3 className="text-2xl font-extrabold tracking-tight">Get Healthier Together</h3>
              <p className="text-sm text-emerald-100 max-w-sm">
                Book 2 Care Packages or Chronic Medication Subscriptions & Get <strong className="text-amber-300">25% OFF</strong> on your 2nd package.
              </p>
              <Link href="/shop" className="inline-block pt-2">
                <Button variant="primary" size="md" className="bg-white text-emerald-950 hover:bg-emerald-50 font-bold">
                  <span>Book Care Package</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="p-8 rounded-3xl relative overflow-hidden text-white space-y-4 shadow-xl border border-slate-800">
            <Image src="/images/diabetic-banner.jpg" alt="Diabetic Diagnostic Monitors" fill quality={85} placeholder="blur" blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMWYyOTM3Ii8+PC9zdmc+" className="absolute inset-0 w-full h-full object-cover filter brightness-[0.35]" />
            <div className="relative z-10 space-y-3">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl" />
              <Badge variant="amber">Limited Time Flash Sale</Badge>
              <h3 className="text-2xl font-extrabold tracking-tight">Flat 24% OFF Diagnostic Monitors</h3>
              <p className="text-sm text-slate-300 max-w-sm">
                Save big on SD Codefree Glucose Kits, OneTouch Select Plus Meters, and Blood Pressure devices.
              </p>
              <Link href="/shop" className="inline-block pt-2">
                <Button variant="primary" size="md" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">
                  <span>Shop Diagnostic Sale</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* BEST SELLERS & FEATURED MEDICINES */}
      <section className="w-full px-4 sm:px-8 lg:px-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <Badge variant="blue" className="mb-2">Best Sellers</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Featured Pharmaceuticals & OTC
            </h2>
          </div>
          <Link href="/shop" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            <span>Browse Catalog</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
            <span className="text-xs">Loading featured medicines...</span>
          </div>
        ) : products.length === 0 ? (
          <Card className="p-10 text-center text-slate-400 space-y-2">
            <Package className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No products in catalog yet</p>
            <p className="text-xs text-slate-400">All products have been cleared. Products added via admin dashboard will appear here.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} hoverEffect className="flex flex-col justify-between p-6 space-y-4">
                <div className="space-y-3">
                  <div className="relative h-48 w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        width={400}
                        height={192}
                        quality={80}
                        placeholder="blur"
                        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjFmNWY5"/>
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-300">
                        <Package className="h-10 w-10" />
                      </div>
                    )}
                    {product.requiresPrescription && (
                      <div className="absolute top-3 left-3">
                        <Badge variant="amber">Rx Required</Badge>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    {product.brand?.name && <span className="font-semibold text-emerald-600">{product.brand.name}</span>}
                    {product.dosageForm && (
                      <>
                        <span>•</span>
                        <span>{product.dosageForm}</span>
                      </>
                    )}
                  </div>

                  <Link href={`/shop/${product.slug}`}>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-emerald-600 transition-colors">
                      {product.name}
                    </h3>
                  </Link>

                  <p className="text-xs text-slate-500 line-clamp-2">{product.description}</p>

                  {product.rating && product.rating > 0 ? (
                    <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold">
                      <Star className="h-4 w-4 fill-amber-400" />
                      <span>{product.rating.toFixed(1)}</span>
                      <span className="text-slate-400 font-normal">({product.reviewCount || 0} reviews)</span>
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(product.price)}
                    </span>
                    {product.compareAtPrice && (
                      <span className="ml-2 text-xs text-slate-400 line-through">
                        {formatCurrency(product.compareAtPrice)}
                      </span>
                    )}
                  </div>

                  <Button variant="primary" size="sm" onClick={() => handleQuickAdd(product)} disabled={product.stockQuantity === 0}>
                    <Plus className="h-4 w-4" /> Add
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* TELEHEALTH DOCTOR SPOTLIGHT WITH BACKGROUND PICTURE */}
      <section className="relative overflow-hidden bg-slate-950 text-white py-20">
        <Image src="/images/telehealth-banner.jpg" alt="Telehealth Medical Clinic" fill quality={85} placeholder="blur" blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMWYyOTM3Ii8+PC9zdmc+" className="absolute inset-0 w-full h-full object-cover filter brightness-[0.25]" />
        <div className="relative z-10 w-full px-4 sm:px-8 lg:px-12 space-y-10">
          <div className="text-left max-w-2xl space-y-3">
            <Badge variant="emerald" className="bg-emerald-500 text-white font-bold">Online Consultations</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Speak with Certified Physicians Online</h2>
            <p className="text-slate-300 text-sm font-medium">Get virtual consultations, medical advice, and instant prescription issuance from your home.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            <Card className="bg-slate-900/90 backdrop-blur-md border-slate-800 p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl border border-emerald-500/40">
                  <Stethoscope className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Pharm. Philip Bruce-Tagoe</h3>
                  <p className="text-xs text-emerald-400 font-semibold">Superintendent Pharmacist & Clinical Manager</p>
                  <p className="text-[11px] text-slate-400">GPHC Reg. No. 2050984 • 15+ Yrs Experience</p>
                </div>
              </div>

              <div className="pt-2 text-xs space-y-1.5 text-slate-300 border-t border-slate-800">
                <div className="flex justify-between">
                  <span>Consultation Channel:</span>
                  <span className="font-bold text-emerald-400">WhatsApp & Phone Hotline</span>
                </div>
                <div className="flex justify-between">
                  <span>Operating Hours:</span>
                  <span className="text-slate-200 font-medium">Mon–Sun 8:00 AM – 8:00 PM</span>
                </div>
              </div>

              <a
                href="https://wa.me/233544772483?text=Hello%20Pharm.%20Philip%20Bruce-Tagoe,%20I%20have%20a%20medication%20question"
                target="_blank"
                rel="noopener noreferrer"
                className="block pt-1"
              >
                <Button variant="primary" size="md" className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold">
                  <Stethoscope className="h-4 w-4" /> Consult Superintendent Pharmacist
                </Button>
              </a>
            </Card>

            <Card className="bg-slate-900/90 backdrop-blur-md border-slate-800 p-6 space-y-4 shadow-xl flex flex-col justify-between">
              <div className="space-y-3">
                <Badge variant="blue" className="bg-blue-600 text-white font-bold">Doctor Booking Portal</Badge>
                <h3 className="font-bold text-white text-lg">Onboarding Specialist Physicians</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  We are expanding our telehealth network with licensed Ghanaian general physicians and specialists. Access online prescription renewals and virtual appointments.
                </p>
              </div>

              <Link href="/telehealth" className="block pt-2">
                <Button variant="outline" size="md" className="w-full border-slate-700 text-slate-200 hover:bg-slate-800 font-bold">
                  <span>Explore Telehealth Portal</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQS SECTION */}
      <section className="w-full px-4 sm:px-8 lg:px-12 space-y-8">
        <div className="text-left space-y-2">
          <Badge variant="blue">Help & Answers</Badge>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {MOCK_FAQS.map((faq, idx) => (
            <Card
              key={idx}
              className="p-5 cursor-pointer transition-all"
              onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
            >
              <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white text-base">
                <span className="flex items-center gap-3">
                  <HelpCircle className="h-5 w-5 text-brand-600 shrink-0" />
                  {faq.question}
                </span>
                <span className="text-xl">{activeFaq === idx ? "−" : "+"}</span>
              </div>
              {activeFaq === idx && (
                <p className="mt-3 pl-8 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                  {faq.answer}
                </p>
              )}
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
