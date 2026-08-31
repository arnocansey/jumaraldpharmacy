"use client";

import { useState } from "react";
import { Sparkles, FileText, Search, Plus, CheckCircle, Database } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

export default function AIKnowledgePage() {
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("Ghana Health Service / Jumarald Formulary");
  const [category, setCategory] = useState("Clinical Guidelines");
  const [content, setContent] = useState("");
  const [ingesting, setIngesting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  async function handleIngest() {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    setIngesting(true);

    try {
      const data = await apiFetch<any>("/ai/knowledge/ingest", {
        method: "POST",
        body: JSON.stringify({ title, source, category, content }),
      });

      toast.success(`Document ingested! Created ${data.chunksCreated} vector chunks.`);
      setTitle("");
      setContent("");
    } catch (err: any) {
      toast.error("Ingestion failed: " + err.message);
    } finally {
      setIngesting(false);
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);

    try {
      const data = await apiFetch<any>(`/ai/knowledge/search?query=${encodeURIComponent(searchQuery)}`);
      setSearchResults(data.results || []);
    } catch (err: any) {
      toast.error("Search failed: " + err.message);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          RAG Knowledge Management <Database className="h-5 w-5 text-emerald-500" />
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Ingest and manage pharmacist-approved clinical guides, FAQs, and medication protocols for RAG retrieval.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Ingestion Form */}
        <div className="glass-panel rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Plus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Ingest Clinical Document
          </h2>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Document Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Ghana Standard Treatment Guidelines: Malaria"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Source / Attribution</label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Full Document Text</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste clinical text, dosage protocols, or FAQ content..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
              rows={6}
            />
          </div>

          <button
            onClick={handleIngest}
            disabled={ingesting}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
          >
            <Sparkles className="h-4 w-4" />
            {ingesting ? "Generating Embeddings & Ingesting..." : "Ingest into Vector Store"}
          </button>
        </div>

        {/* Semantic Vector Search Test */}
        <div className="glass-panel rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Search className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Vector Similarity Test
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Query the vector database to test Cosine Similarity document retrieval for Dr. Jumarald AI.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter search term or symptom..."
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
            >
              {searching ? "Searching..." : "Search"}
            </button>
          </div>

          <div className="space-y-3">
            {searchResults.map((res, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 space-y-1 text-xs shadow-sm">
                <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-bold">
                  <span>{res.documentTitle}</span>
                  <span className="text-[11px] bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                    Score: {(res.score * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 line-clamp-3 font-mono text-[11px]">{res.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
