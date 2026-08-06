"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search } from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

const DEFAULT_FAQS: FAQ[] = [
  { id: "1", question: "How do I place an order?", answer: "Browse our products, add items to your cart, and proceed to checkout. You can pay via Paystack (card, bank transfer, mobile money) or choose cash on delivery.", category: "Orders" },
  { id: "2", question: "Do I need a prescription for all medicines?", answer: "No. Only prescription medications require a valid prescription from a licensed healthcare provider. You can upload your prescription during checkout.", category: "Prescriptions" },
  { id: "3", question: "How long does delivery take?", answer: "Standard delivery within Greater Accra takes 2-4 hours. Same-day delivery is available for orders placed before 2 PM. Other regions may take 1-3 business days.", category: "Delivery" },
  { id: "4", question: "Can I return medications?", answer: "Unopened, sealed medications can be returned within 7 days. Prescription medications cannot be returned once dispensed. Contact our support team for return requests.", category: "Returns" },
  { id: "5", question: "How does the loyalty program work?", answer: "Earn 10 points for every GHS 1 spent. Points can be redeemed for discounts, free delivery, and consultations. Higher tiers unlock better multipliers and exclusive benefits.", category: "Loyalty" },
  { id: "6", question: "Is my personal health information secure?", answer: "Yes. We use enterprise-grade encryption and comply with data protection regulations. Your health data is never shared with third parties without your explicit consent.", category: "Privacy" },
  { id: "7", question: "Can I book a doctor consultation online?", answer: "Yes! Navigate to our Telehealth section to browse available doctors, check their schedules, and book a consultation. Video consultations are available.", category: "Telehealth" },
  { id: "8", question: "What payment methods do you accept?", answer: "We accept Visa, Mastercard, Mobile Money (MTN, Vodafone, AirtelTigo), bank transfers, and cash on delivery through our Paystack integration.", category: "Payment" },
];

export function FAQAccordion({ faqs = DEFAULT_FAQS }: { faqs?: FAQ[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(faqs.map((f) => f.category).filter(Boolean)));

  const filtered = faqs.filter((faq) => {
    const matchesSearch = !search || faq.question.toLowerCase().includes(search.toLowerCase()) || faq.answer.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !activeCategory || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-2.5">
          <Search className="h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Search FAQs..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setActiveCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${!activeCategory ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            All
          </button>
          {categories.map((cat) => cat && (
            <button key={cat} onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${activeCategory === cat ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((faq) => (
          <div key={faq.id} className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <button onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors">
              <span className="font-semibold text-slate-800 pr-4">{faq.question}</span>
              <motion.div animate={{ rotate: openId === faq.id ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="h-5 w-5 text-slate-400 shrink-0" />
              </motion.div>
            </button>
            <AnimatePresence>
              {openId === faq.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }} className="overflow-hidden">
                  <div className="px-4 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-50 pt-3">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
