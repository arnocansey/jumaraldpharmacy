"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

const TESTIMONIALS = [
  { id: 1, name: "Ama Mensah", role: "Loyal Customer", content: "Jumarald Pharmacy has been my go-to for all health needs. Their delivery is fast and the pharmacists are always helpful and professional.", rating: 5 },
  { id: 2, name: "Kofi Asante", role: "Business Owner", content: "The online ordering system is incredibly convenient. I can order my monthly prescriptions and they arrive within hours. Highly recommend!", rating: 5 },
  { id: 3, name: "Efua Boateng", role: "Mother of Three", content: "Having a reliable pharmacy that delivers to my doorstep is a lifesaver. The telehealth consultation feature is amazing for my family's needs.", rating: 5 },
  { id: 4, name: "Dr. Kwame Nkrumah", role: "Healthcare Professional", content: "As a doctor, I appreciate the quality of medications and the professional service Jumarald provides to my patients.", rating: 5 },
  { id: 5, name: "Abena Osei", role: "Student", content: "Affordable prices and genuine products. The loyalty program rewards are fantastic - I've saved so much on my health purchases.", rating: 4 },
];

export function TestimonialCarousel() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((c) => (c + 1) % TESTIMONIALS.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((c) => (c - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

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
