"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Check } from "lucide-react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    setTimeout(() => {
      setStatus("success");
      setEmail("");
      setTimeout(() => setStatus("idle"), 3000);
    }, 1000);
  }

  return (
    <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-3xl p-8 md:p-12 text-white backdrop-blur-sm">
      <div className="max-w-xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h3 className="text-2xl md:text-3xl font-bold mb-3">Stay Updated with Health Tips</h3>
          <p className="text-emerald-100 mb-6">Subscribe for exclusive offers, health advice, and new product alerts.</p>

          {status === "success" ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center justify-center gap-2 text-lg font-semibold">
              <Check className="h-6 w-6" /> Subscribed successfully!
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-white/20 border border-white/30 rounded-xl px-4 py-3 text-white placeholder:text-emerald-200 outline-none focus:ring-2 focus:ring-white/50"
                required
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="bg-white text-emerald-700 px-6 py-3 rounded-xl font-bold hover:bg-emerald-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {status === "loading" ? (
                  <div className="animate-spin h-4 w-4 border-2 border-emerald-600 border-t-transparent rounded-full" />
                ) : (
                  <><Send className="h-4 w-4" /> Subscribe</>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
