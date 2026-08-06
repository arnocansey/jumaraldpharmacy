"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, ShieldCheck, Thermometer, Stethoscope, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export function HeroCarousel() {
  const slides = [
    {
      id: 1,
      image: "/images/hero-pharmacy.jpg",
      badge: "Ghana's Premier E-Pharmacy",
      title: "Certified Medicines & Cold-Chain Express Delivery",
      subtitle: "FDA Ghana certified prescription drugs, diabetic monitors, and wellness essentials delivered straight to your door with 2°C–8°C thermal insulation.",
      primaryCta: { text: "Upload Prescription", href: "/prescriptions/upload" },
      secondaryCta: { text: "Browse Shop", href: "/shop" },
    },
    {
      id: 2,
      image: "/images/diabetic-banner.jpg",
      badge: "Limited Time Offer — 24% OFF",
      title: "Diabetic Monitors & Blood Glucose Strips",
      subtitle: "Save big on SD Codefree Glucose Kits, OneTouch Select Plus Meters, and essential diagnostic devices with GPHC pharmacist support.",
      primaryCta: { text: "Shop Diabetic Care", href: "/shop?category=diabetic-care" },
      secondaryCta: { text: "View Offers", href: "/shop" },
    },
    {
      id: 3,
      image: "/images/telehealth-banner.jpg",
      badge: "24/7 Virtual Clinic",
      title: "Consult Licensed Doctors & Pharmacists Online",
      subtitle: "Get digital prescriptions, clinical advice, and chronic medication renewals without waiting in clinic queues.",
      primaryCta: { text: "Consult Doctor Now", href: "/telehealth" },
      secondaryCta: { text: "Learn More", href: "/about" },
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl min-h-[480px] flex items-center bg-slate-950 text-white">
      {/* Background Image Carousel Slides */}
      {slides.map((slide, idx) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover object-center scale-105 transform transition-transform duration-10000 filter brightness-[0.4]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
        </div>
      ))}

      {/* Content Area */}
      <div className="relative z-20 mx-auto max-w-7xl px-6 sm:px-12 py-16 space-y-6 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          <span>{slides[currentSlide].badge}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white drop-shadow-md">
          {slides[currentSlide].title}
        </h1>

        <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-medium">
          {slides[currentSlide].subtitle}
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <Link href={slides[currentSlide].primaryCta.href}>
            <Button variant="primary" size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-lg shadow-emerald-600/30">
              <span>{slides[currentSlide].primaryCta.text}</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
          <Link href={slides[currentSlide].secondaryCta.href}>
            <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 backdrop-blur-md">
              {slides[currentSlide].secondaryCta.text}
            </Button>
          </Link>
        </div>

        <div className="pt-4 flex items-center gap-6 text-xs font-semibold text-emerald-400/90 border-t border-white/10">
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> FDA Ghana Certified</span>
          <span className="flex items-center gap-1.5"><Thermometer className="h-4 w-4" /> 2°C–8°C Cold-Chain</span>
        </div>
      </div>

      {/* Slide Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md transition-all border border-white/10"
        aria-label="Previous Slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md transition-all border border-white/10"
        aria-label="Next Slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`h-2.5 rounded-full transition-all ${
              idx === currentSlide ? "w-8 bg-emerald-500" : "w-2.5 bg-white/40 hover:bg-white/70"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
