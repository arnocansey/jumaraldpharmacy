"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

interface TestimonialItem {
  id: number | string;
  name: string;
  role: string;
  content: string;
  rating: number;
}

const TESTIMONIALS: TestimonialItem[] = [];

export function TestimonialCarousel() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const next = useCallback(() => {
    if (TESTIMONIALS.length === 0) return;
    setDirection(1);
    setCurrent((c) => (c + 1) % TESTIMONIALS.length);
  }, []);

  const prev = useCallback(() => {
    if (TESTIMONIALS.length === 0) return;
    setDirection(-1);
    setCurrent((c) => (c - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  }, []);

  useEffect(() => {
    if (TESTIMONIALS.length === 0) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  if (TESTIMONIALS.length === 0) {
    return null;
  }

  const t = TESTIMONIALS[current];

  return (
    <div className="relative max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-12 text-center relative overflow-hidden">
        <Quote className="h-12 w-12 text-emerald-200 mx-auto mb-6" />

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            initial={{ opacity: 0, x: direction * 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -50 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-lg md:text-xl text-slate-700 mb-6 leading-relaxed italic">
              &ldquo;{t.content}&rdquo;
            </p>

            <div className="flex items-center justify-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`h-5 w-5 ${s <= t.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-200"}`} />
              ))}
            </div>

            <p className="font-bold text-slate-800">{t.name}</p>
            <p className="text-sm text-slate-500">{t.role}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <button onClick={prev} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white shadow-lg rounded-full p-2 hover:bg-slate-50 transition-colors">
        <ChevronLeft className="h-5 w-5 text-slate-600" />
      </button>
      <button onClick={next} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white shadow-lg rounded-full p-2 hover:bg-slate-50 transition-colors">
        <ChevronRight className="h-5 w-5 text-slate-600" />
      </button>

      <div className="flex items-center justify-center gap-2 mt-6">
        {TESTIMONIALS.map((_, i) => (
          <button key={i} onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${i === current ? "bg-emerald-500" : "bg-slate-200"}`} />
        ))}
      </div>
    </div>
  );
}
