"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bot,
  X,
  Send,
  Sparkles,
  ShieldAlert,
  Stethoscope,
  Pill,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ShoppingCart,
  ChevronRight,
  RefreshCw,
  Plus,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";

import { usePathname } from "next/navigation";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  products?: Array<{ id: string; name: string; price: number; slug: string }>;
  triage?: {
    severity: "LOW" | "MODERATE" | "HIGH" | "URGENT";
    suggestDoctorConsultation: boolean;
    emergencyWarning?: string;
  };
  timestamp: string;
}

const QUICK_PROMPTS = [
  "What OTC medicines help with severe migraine?",
  "Is Vitamin C safe to take with antibiotics?",
  "Check symptoms: Fever, body aches, and chills for 2 days",
  "Recommend immune boosters in stock",
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export function AIAssistantWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "interactions" | "prescription">("chat");
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "model",
      text: "Hello! I'm Dr. Jumarald AI, your 24/7 personal clinical pharmacy assistant. How can I assist with your health or medications today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hide floating widget if user is on full-screen AI assistant page
  if (pathname === "/ai-assistant") {
    return null;
  }

  // Interaction State
  const [drugList, setDrugList] = useState<string[]>(["Paracetamol", "Ibuprofen"]);
  const [newDrug, setNewDrug] = useState("");
  const [interactionResult, setInteractionResult] = useState<any>(null);
  const [checkingInteractions, setCheckingInteractions] = useState(false);

  // Prescription Explainer State
  const [rxText, setRxText] = useState("");
  const [rxResult, setRxResult] = useState<any>(null);
  const [explainingRx, setExplainingRx] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSendMessage(textToSend?: string) {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          message: text,
          channel: "WEB_WIDGET",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Consultation failed");

      if (data.conversationId) setConversationId(data.conversationId);

      const products = data.executedTools
        ? data.executedTools.find((t: any) => t.name === "searchProducts")?.output?.products
        : [];

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "model",
        text: data.reply || "No response received.",
        products: products || [],
        triage: {
          severity: data.riskLevel || "LOW",
          suggestDoctorConsultation: data.isEscalated || data.riskLevel === "EMERGENCY",
          emergencyWarning: data.riskLevel === "EMERGENCY" ? "Emergency alert: Seek emergency care if severe." : undefined,
        },
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      toast.error(err.message || "Failed to reach Dr. Jumarald AI");
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "model",
          text: "I am experiencing network connectivity issues. Please try again or consult our Telehealth Doctors.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyzeInteractions() {
    if (drugList.length < 2) {
      toast.error("Please add at least 2 medications to test for interactions.");
      return;
    }

    setCheckingInteractions(true);
    setInteractionResult(null);

    try {
      const res = await fetch(`${API_URL}/ai/check-interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drugs: drugList }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Analysis failed");
      setInteractionResult(data);
    } catch (err: any) {
      toast.error(err.message || "Interaction analysis failed");
    } finally {
      setCheckingInteractions(false);
    }
  }

  async function handleExplainRx() {
    if (!rxText.trim()) {
      toast.error("Please enter or paste prescription text");
      return;
    }

    setExplainingRx(true);
    setRxResult(null);

    try {
      const res = await fetch(`${API_URL}/ai/explain-prescription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prescriptionText: rxText }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Decoding failed");
      setRxResult(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to decode prescription");
    } finally {
      setExplainingRx(false);
    }
  }

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative group bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-3.5 sm:p-4 rounded-full shadow-2xl flex items-center justify-center border-2 border-emerald-400/40"
        >
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-300"></span>
          </span>
          <Bot className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap text-xs font-bold pl-0 group-hover:pl-2">
            Ask Dr. Jumarald AI
          </span>
        </motion.button>
      </div>

      {/* Floating Modal Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] h-[580px] max-h-[80vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-4 flex items-center justify-between border-b border-emerald-500/20">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-600/90 flex items-center justify-center shadow-lg shadow-emerald-600/40 border border-emerald-400/30">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                    Dr. Jumarald AI <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">Clinical 3.0</span>
                  </h3>
                  <p className="text-[11px] text-slate-300 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> 24/7 AI Pharmacy & Symptom Assistant
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-1 text-xs font-bold text-slate-600 dark:text-slate-300">
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "chat"
                    ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                    : "hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Bot className="h-3.5 w-3.5" /> AI Chat
              </button>
              <button
                onClick={() => setActiveTab("interactions")}
                className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "interactions"
                    ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                    : "hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Pill className="h-3.5 w-3.5" /> Drug Checker
              </button>
              <button
                onClick={() => setActiveTab("prescription")}
                className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "prescription"
                    ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                    : "hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <FileText className="h-3.5 w-3.5" /> Decode Rx
              </button>
            </div>

            {/* TAB 1: CHAT & SYMPTOM TRIAGE */}
            {activeTab === "chat" && (
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50 dark:bg-slate-900/50">
                {/* Messages Body */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[88%] p-3.5 rounded-2xl space-y-2 ${
                          m.role === "user"
                            ? "bg-emerald-600 text-white rounded-br-xs shadow-md shadow-emerald-600/20"
                            : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-xs border border-slate-200 dark:border-slate-700 shadow-xs"
                        }`}
                      >
                        <p className="whitespace-pre-line leading-relaxed">{m.text}</p>

                        {/* Emergency Warning Badge */}
                        {m.triage?.emergencyWarning && (
                          <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                            <span>{m.triage.emergencyWarning}</span>
                          </div>
                        )}

                        {/* Suggested Doctor Consultation */}
                        {m.triage?.suggestDoctorConsultation && (
                          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              Online Doctors Available
                            </span>
                            <Link
                              href="/telehealth"
                              onClick={() => setIsOpen(false)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center gap-1"
                            >
                              <Stethoscope className="h-3 w-3" /> Book Consultation
                            </Link>
                          </div>
                        )}

                        {/* Recommended Products */}
                        {m.products && m.products.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-1.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              In-Stock Recommended Remedies:
                            </p>
                            {m.products.map((p) => (
                              <div
                                key={p.id}
                                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                              >
                                <div>
                                  <p className="font-bold text-slate-800 dark:text-slate-100">{p.name}</p>
                                  <p className="text-[10px] font-semibold text-emerald-600">GHS {p.price.toFixed(2)}</p>
                                </div>
                                <Link
                                  href={`/shop/${p.slug}`}
                                  onClick={() => setIsOpen(false)}
                                  className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold hover:bg-emerald-200 text-[10px] flex items-center gap-1"
                                >
                                  View <ChevronRight className="h-3 w-3" />
                                </Link>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 px-1">{m.timestamp}</span>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex items-center gap-2 text-slate-400 text-xs italic">
                      <Bot className="h-4 w-4 animate-bounce text-emerald-500" />
                      <span>Dr. Jumarald AI is thinking...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Prompts */}
                <div className="p-2 overflow-x-auto flex items-center gap-1.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
                  {QUICK_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt)}
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 transition-colors border border-slate-200 dark:border-slate-700"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                {/* Input Area */}
                <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Ask about symptoms, dosages, remedies..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1 h-10 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs border border-transparent focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={loading || !input.trim()}
                    className="h-10 w-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-md shadow-emerald-600/30"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: DRUG INTERACTION ANALYZER */}
            {activeTab === "interactions" && (
              <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 text-sm">
                    <Pill className="h-4 w-4 text-emerald-600" /> Multi-Drug Interaction Scanner
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Add 2 or more medications to analyze clinical contraindications and safety warnings.
                  </p>
                </div>

                {/* Medication Chips */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-400">Active Medications List:</label>
                  <div className="flex flex-wrap gap-2">
                    {drugList.map((drug, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold"
                      >
                        {drug}
                        <button
                          onClick={() => setDrugList((prev) => prev.filter((_, i) => i !== index))}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Add Medication Input */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add medication (e.g. Amoxicillin)"
                      value={newDrug}
                      onChange={(e) => setNewDrug(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newDrug.trim()) {
                          setDrugList([...drugList, newDrug.trim()]);
                          setNewDrug("");
                        }
                      }}
                      className="flex-1 h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        if (newDrug.trim()) {
                          setDrugList([...drugList, newDrug.trim()]);
                          setNewDrug("");
                        }
                      }}
                      className="h-9 px-3 rounded-xl bg-slate-200 dark:bg-slate-700 font-bold text-xs flex items-center gap-1 hover:bg-emerald-600 hover:text-white transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAnalyzeInteractions}
                  disabled={checkingInteractions || drugList.length < 2}
                  className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 disabled:opacity-40 transition-all"
                >
                  {checkingInteractions ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" /> Scanning Interactions...
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="h-4 w-4" /> Run Interaction Scan
                    </>
                  )}
                </button>

                {/* Interaction Analysis Results */}
                {interactionResult && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-100">Scan Status:</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          interactionResult.severity === "SEVERE"
                            ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300"
                            : interactionResult.severity === "MODERATE"
                            ? "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                        }`}
                      >
                        {interactionResult.severity}
                      </span>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300">{interactionResult.summary}</p>

                    {interactionResult.details && interactionResult.details.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        {interactionResult.details.map((item: any, idx: number) => (
                          <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                            <p className="font-bold text-slate-800 dark:text-slate-100">
                              {item.drugA} + {item.drugB}
                            </p>
                            <p className="text-slate-500 dark:text-slate-400">{item.effect}</p>
                            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                              💡 Advice: {item.recommendation}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: DECODE PRESCRIPTION */}
            {activeTab === "prescription" && (
              <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 text-sm">
                    <FileText className="h-4 w-4 text-emerald-600" /> AI Prescription Decoder
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Paste doctor notes or prescription shorthand to receive a clear patient breakdown.
                  </p>
                </div>

                <textarea
                  rows={4}
                  placeholder="e.g. Tab Amoxicillin 500mg TDS x 7 days after food, Tab Paracetamol 1g BD PRN"
                  value={rxText}
                  onChange={(e) => setRxText(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />

                <button
                  onClick={handleExplainRx}
                  disabled={explainingRx || !rxText.trim()}
                  className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 disabled:opacity-40 transition-all"
                >
                  {explainingRx ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" /> Decoding Prescription...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Decode & Explain Rx
                    </>
                  )}
                </button>

                {/* Prescription Result */}
                {rxResult && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-3">
                    <p className="font-bold text-slate-800 dark:text-slate-100">{rxResult.summary}</p>

                    {rxResult.medications && (
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold uppercase text-slate-400">Decoded Medications:</label>
                        {rxResult.medications.map((m: any, idx: number) => (
                          <div key={idx} className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                            <div className="flex justify-between font-bold text-slate-800 dark:text-slate-100">
                              <span>{m.name}</span>
                              <span className="text-emerald-600">{m.dosage}</span>
                            </div>
                            <p className="text-slate-500">Frequency: {m.frequency}</p>
                            <p className="text-slate-500">Duration: {m.duration}</p>
                            <p className="text-emerald-600 font-medium">Purpose: {m.purpose}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {rxResult.precautions && rxResult.precautions.length > 0 && (
                      <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <label className="block text-[10px] font-bold uppercase text-slate-400">Precautions & Safety:</label>
                        {rxResult.precautions.map((p: string, idx: number) => (
                          <p key={idx} className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            <span>{p}</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
