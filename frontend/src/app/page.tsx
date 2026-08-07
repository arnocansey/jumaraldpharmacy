"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Pill,
  UploadCloud,
  ShieldCheck,
  Truck,
  Stethoscope,
  Sparkles,
  ArrowRight,
  Plus,
  Star,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { MOCK_CATEGORIES, MOCK_PRODUCTS, MOCK_DOCTORS, MOCK_FAQS } from "@/lib/mockData";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { toast } from "sonner";
import { HeroCarousel } from "@/components/home/HeroCarousel";

export default function HomePage() {
  const { addToCart } = useCartStore();
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const handleQuickAdd = (product: (typeof MOCK_PRODUCTS)[0]) => {
    addToCart(product, 1);
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
          <Link href="/shop" className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
            <span>View All</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {MOCK_CATEGORIES.map((cat) => (
            <Link key={cat.id} href={`/shop?category=${cat.slug}`}>
              <Card hoverEffect className="text-center p-5 space-y-3 cursor-pointer group">
                <div className="h-12 w-12 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Pill className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                    {cat.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{cat.itemCount}+ Items</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
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
              <Link href="/shop?category=diabetic-care" className="inline-block pt-2">
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
          <Link href="/shop" className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
            <span>Browse Catalog</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_PRODUCTS.map((product) => (
            <Card key={product.id} hoverEffect className="flex flex-col justify-between p-6 space-y-4">
              <div className="space-y-3">
                <div className="relative h-48 w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    width={400}
                    height={192}
                    quality={80}
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+"
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.requiresPrescription && (
                    <div className="absolute top-3 left-3">
                      <Badge variant="amber">Rx Required</Badge>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-brand-600">{product.brand}</span>
                  <span>•</span>
                  <span>{product.dosageForm}</span>
                </div>

                <Link href={`/shop/${product.slug}`}>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-brand-600 transition-colors">
                    {product.name}
                  </h3>
                </Link>

                <p className="text-xs text-slate-500 line-clamp-2">{product.description}</p>

                <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold">
                  <Star className="h-4 w-4 fill-amber-400" />
                  <span>{product.rating}</span>
                  <span className="text-slate-400 font-normal">({product.reviewCount} reviews)</span>
                </div>
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

                <Button variant="primary" size="sm" onClick={() => handleQuickAdd(product)}>
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
            </Card>
          ))}
        </div>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MOCK_DOCTORS.map((doctor) => (
              <Card key={doctor.id} className="bg-slate-900/90 backdrop-blur-md border-slate-800 p-6 space-y-4 shadow-xl">
                <div className="flex items-center gap-4">
                  <Image src={doctor.avatarUrl} alt={doctor.name} width={64} height={64} quality={80} placeholder="blur" blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+" className="h-16 w-16 rounded-full object-cover border-2 border-emerald-500" />
                  <div>
                    <h3 className="font-bold text-white text-base">{doctor.name}</h3>
                    <p className="text-xs text-emerald-400 font-semibold">{doctor.specialty}</p>
                    <p className="text-[11px] text-slate-400">{doctor.experience}</p>
                  </div>
                </div>

                <div className="pt-2 text-xs space-y-1.5 text-slate-300 border-t border-slate-800">
                  <div className="flex justify-between">
                    <span>Consultation Fee:</span>
                    <span className="font-bold text-white">{formatCurrency(doctor.consultFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Next Slot:</span>
                    <span className="text-emerald-400 font-medium">{doctor.nextAvailable}</span>
                  </div>
                </div>

                <Link href="/telehealth" className="block pt-2">
                  <Button variant="primary" size="md" className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold">
                    <Stethoscope className="h-4 w-4" /> Book Appointment
                  </Button>
                </Link>
              </Card>
            ))}
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
