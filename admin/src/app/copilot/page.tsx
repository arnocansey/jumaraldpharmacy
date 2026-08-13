"use client";

import { useState, useEffect } from "react";
import { Sparkles, ShieldAlert, CheckCircle, Clock, Eye, MessageSquare, Bot, User, Send, ExternalLink, FileText } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface Escalation {
  id: string;
  reason: string;
  severity: string;
  summary: string;
  status: string;
  pharmacistNotes?: string;
  createdAt: string;
  conversation?: {
    messages: Array<{ id: string; role: string; content: string; createdAt: string }>;
  };
}

export default function PharmacistCopilotPage() {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Escalation | null>(null);
  const [note, setNote] = useState("");

  // AI Copilot Helper state
  const [copilotQuery, setCopilotQuery] = useState("");
  const [copilotReply, setCopilotReply] = useState("");
  const [askingCopilot, setAskingCopilot] = useState(false);

  useEffect(() => {
    loadEscalations();
  }, []);

  async function loadEscalations() {
    try {
      const data = await apiFetch<any>("/ai/escalations");
      setEscalations(data.escalations || []);
    } catch {
      toast.error("Failed to load AI escalations queue");
    } finally {
      setLoading(false);
    }
  }

  async function handleResolve(id: string) {
    try {
      await apiFetch(`/ai/escalations/${id}/resolve`, {
        method: "PUT",
        body: JSON.stringify({ pharmacistNotes: note }),
      });
      toast.success("Escalation resolved by Pharmacist");
      setSelected(null);
      setNote("");
      loadEscalations();
    } catch {
      toast.error("Failed to resolve escalation");
    }
  }

  async function handleAskCopilot() {
    if (!copilotQuery.trim()) return;
    setAskingCopilot(true);
    setCopilotReply("");

    try {
      const res = await apiFetch<any>("/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message: `[PHARMACIST COPILOT QUERY] ${copilotQuery}`,
          channel: "PHARMACIST_COPILOT",
        }),
      });

      setCopilotReply(res.reply);
    } catch (err: any) {
      toast.error("Copilot lookup failed: " + err.message);
    } finally {
      setAskingCopilot(false);
    }
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          Pharmacist AI Copilot &amp; Escalation Queue <Sparkles className="h-5 w-5 text-emerald-500 animate-pulse" />
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Review live AI patient escalations, high-risk safety alerts, and leverage the Clinical AI Copilot.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Escalations Queue */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-200">Patient Escalations Queue</h2>

          {loading ? (
            <div className="glass-panel p-6 rounded-2xl animate-pulse">Loading escalations...</div>
          ) : escalations.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl text-center text-slate-400">
              No open patient escalations at this time.
            </div>
          ) : (
            escalations.map((esc) => (
              <div
                key={esc.id}
                onClick={() => {
                  setSelected(esc);
                  setNote(esc.pharmacistNotes || "");
                }}
                className={`glass-panel rounded-2xl p-5 cursor-pointer transition-all ${
                  selected?.id === esc.id ? "ring-2 ring-emerald-500 bg-emerald-500/5" : "hover:bg-slate-900/40"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      esc.severity === "EMERGENCY"
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {esc.severity} SEVERITY
                  </span>
                  <span className="text-xs text-slate-400">{new Date(esc.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 className="font-bold text-white text-base mb-1">{esc.reason}</h3>
                <p className="text-xs text-slate-300 line-clamp-2">&ldquo;{esc.summary}&rdquo;</p>
              </div>
            ))
          )}
        </div>

        {/* Right Column: AI Pharmacist Copilot Tool */}
        <div className="space-y-4">
          <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Bot className="h-5 w-5 text-emerald-400" /> Superintendent AI Assistant
          </h2>
          <div className="bg-slate-950 border border-white/10 p-5 rounded-2xl space-y-4">
            <p className="text-xs text-slate-400">
              Ask Dr. Jumarald AI clinical reference questions, drug substitution rules, or inventory lookup.
            </p>

            <textarea
              value={copilotQuery}
              onChange={(e) => setCopilotQuery(e.target.value)}
              placeholder="e.g. Find alternatives for Amoxicillin 500mg in stock..."
              className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none focus:border-emerald-400"
              rows={3}
            />

            <button
              onClick={handleAskCopilot}
              disabled={askingCopilot || !copilotQuery.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30"
            >
              <Sparkles className="h-4 w-4" />
              {askingCopilot ? "Reasoning..." : "Ask Clinical Copilot"}
            </button>

            {copilotReply && (
              <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 text-xs text-slate-200 space-y-2">
                <p className="font-bold text-emerald-400">Clinical Copilot Response:</p>
                <p className="whitespace-pre-wrap">{copilotReply}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
