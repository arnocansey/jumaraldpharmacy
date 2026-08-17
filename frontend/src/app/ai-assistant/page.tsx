"use client";

import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Send,
  Bot,
  User,
  ShieldAlert,
  ShoppingBag,
  Mic,
  MicOff,
  Volume2,
  Clock,
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { cleanAIMessageText } from "@/lib/utils";

interface ToolResult {
  name: string;
  output: {
    products?: Array<{
      id: string;
      name: string;
      slug: string;
      price: number;
      category?: string;
      requiresPrescription: boolean;
    }>;
    [key: string]: unknown;
  };
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent?: string;
  riskLevel?: string;
  executedTools?: ToolResult[];
  isEscalated?: boolean;
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I am Dr. Jumarald AI, your personal clinical pharmacy & health assistant. How can I assist you with your health, medications, or orders today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCartStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
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
          channel: "WEB_FULLSCREEN",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to contact AI assistant");

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply,
        intent: data.intent,
        riskLevel: data.riskLevel,
        executedTools: data.executedTools,
        isEscalated: data.isEscalated,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleVoiceInput = () => {
    const win = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onstart: () => void;
        onresult: (event: { results: Array<Array<{ transcript: string }>> }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onstart: () => void;
        onresult: (event: { results: Array<Array<{ transcript: string }>> }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
      };
    };

    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      toast.error("Voice speech recognition is not supported in your browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      toast.info("Listening... Speak your query clearly.");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
      handleSendMessage(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast.error("Could not capture audio clearly.");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const speakText = (text: string) => {
    if (!("speechSynthesis" in window)) {
      toast.error("Text-to-Speech not supported in your browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pt-16">
      {/* Header Banner */}
      <div className="border-b border-emerald-500/20 bg-slate-900/60 backdrop-blur-xl px-6 py-4 flex items-center justify-between sticky top-16 z-30 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-inner">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white flex items-center gap-2">
              Dr. Jumarald AI <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" />
            </h1>
            <p className="text-xs text-emerald-400 font-semibold">
              Clinical Assistant &bull; AI assists. Pharmacists decide.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/telehealth"
            className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <Clock className="h-3.5 w-3.5" /> Book Telehealth Doctor
          </Link>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 flex flex-col justify-between">
        <div className="space-y-4 mb-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="h-8 w-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0 mt-1">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-emerald-600 text-white font-medium shadow-lg shadow-emerald-600/20"
                    : "bg-slate-900/90 border border-white/10 text-slate-100 shadow-xl backdrop-blur-md"
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1">
                  <span className="text-[11px] font-extrabold opacity-75 uppercase tracking-wider">
                    {msg.role === "user" ? "You" : "Dr. Jumarald AI"}
                  </span>
                  {msg.role === "assistant" && (
                    <button
                      onClick={() => speakText(msg.content)}
                      className="text-slate-400 hover:text-emerald-400 p-1 rounded transition-colors"
                      title="Read aloud"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Emergency Alert Banner */}
                {msg.riskLevel === "EMERGENCY" && (
                  <div className="my-2 p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs font-bold flex items-start gap-2">
                    <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-black text-rose-300 mb-0.5">Emergency Triage Alert</p>
                      <p>If symptoms persist or worsen, visit the nearest hospital or call 112.</p>
                    </div>
                  </div>
                )}

                <div className="whitespace-pre-wrap">{cleanAIMessageText(msg.content)}</div>

                {/* Executed Tools Cards (e.g. Products / Orders) */}
                {msg.executedTools && msg.executedTools.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
                    {msg.executedTools.map((t, idx) => {
                      if (t.name === "searchProducts" && t.output?.products) {
                        return (
                          <div key={idx} className="space-y-2">
                            <p className="text-xs font-extrabold text-emerald-400 flex items-center gap-1.5">
                              <ShoppingBag className="h-3.5 w-3.5" /> In-Stock Products Found:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {t.output.products.map((p) => (
                                <div
                                  key={p.id}
                                  className="p-3 rounded-xl bg-slate-950/80 border border-white/10 flex flex-col justify-between gap-2"
                                >
                                  <div>
                                    <p className="font-bold text-white text-xs">{p.name}</p>
                                    <p className="text-[11px] text-slate-400">{p.category}</p>
                                    <p className="text-emerald-400 font-extrabold text-xs mt-1">
                                      GHS {Number(p.price).toFixed(2)}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => {
                                      addToCart(
                                        {
                                          id: p.id,
                                          name: p.name,
                                          slug: p.slug,
                                          price: p.price,
                                          requiresPrescription: p.requiresPrescription,
                                          stockQuantity: 10,
                                          images: [],
                                          category: p.category || "General Pharmacy",
                                        },
                                        1
                                      );
                                      toast.success(`Added ${p.name} to cart!`);
                                    }}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-1.5 rounded-lg transition-all flex items-center justify-center gap-1"
                                  >
                                    <ShoppingBag className="h-3 w-3" /> Add to Cart
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="h-8 w-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 mt-1 font-bold text-xs">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-slate-400 text-xs font-semibold">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 animate-spin">
                <Bot className="h-4 w-4" />
              </div>
              <span>Dr. Jumarald AI is reasoning and evaluating clinical tools...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="space-y-3 sticky bottom-4">
          {/* Quick Prompts */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            {[
              "Find Vitamin C under GH₵50",
              "Check Paracetamol & Amoxicillin Interaction",
              "What to take for dry cough?",
              "Where is my delivery?",
            ].map((promptText, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(promptText)}
                className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-slate-300 font-semibold hover:text-white transition-all shadow-md"
              >
                {promptText}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-2xl border border-emerald-500/30 p-2 rounded-2xl shadow-2xl"
          >
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`p-3 rounded-xl border transition-all ${
                isListening
                  ? "bg-rose-600 text-white border-rose-400 animate-pulse"
                  : "bg-white/5 text-slate-400 hover:text-white border-white/10"
              }`}
              title="Voice Input"
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about medications, symptoms, or search products..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-slate-500 px-2 font-medium"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white p-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/30"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
