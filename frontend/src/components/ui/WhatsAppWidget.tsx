"use client";

import React, { useState } from "react";
import { MessageCircle, X, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";

const WHATSAPP_NUMBER = "2330544772483";
const PRESET_MESSAGES = [
  { label: "Order Inquiry", message: "Hi Jumarald, I'd like to place an order for medication." },
  { label: "Prescription Help", message: "Hi Jumarald, I need help uploading my prescription." },
  { label: "Delivery Status", message: "Hi Jumarald, I'd like to check the status of my delivery." },
  { label: "General Inquiry", message: "Hi Jumarald, I have a question about a product." },
];

export function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState("");

  const openWhatsApp = (message: string) => {
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`, "_blank");
  };

  const handleCustomSend = () => {
    if (customMessage.trim()) {
      openWhatsApp(customMessage);
      setCustomMessage("");
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="mb-4 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="bg-emerald-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-sm">Jumarald Pharmacy</p>
                  <p className="text-xs text-emerald-100">Usually replies within minutes</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Choose a quick message or type your own:
            </p>

            <div className="space-y-2">
              {PRESET_MESSAGES.map((preset, i) => (
                <button
                  key={i}
                  onClick={() => openWhatsApp(preset.message)}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors text-sm text-slate-700 dark:text-slate-300"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type your message..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCustomSend()}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleCustomSend}
                disabled={!customMessage.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            <a
              href={`tel:+${WHATSAPP_NUMBER}`}
              className="flex items-center justify-center gap-2 w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Phone className="h-4 w-4" />
              Call instead: +233 054-477-2483
            </a>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all ${
          isOpen
            ? "bg-slate-600 hover:bg-slate-700"
            : "bg-emerald-500 hover:bg-emerald-600 animate-pulse"
        }`}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <MessageCircle className="h-6 w-6 text-white" />
        )}
      </button>
    </div>
  );
}
