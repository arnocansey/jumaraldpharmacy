"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { API_URL } from "@/lib/api";
import { Calendar, User, ArrowRight, Search } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  author: string;
  imageUrl: string | null;
  tags: string[];
  createdAt: string;
  _count: { comments: number };
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });

  useEffect(() => {
    fetchPosts();
  }, [page, selectedTag]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "9" });
      if (selectedTag) params.set("tag", selectedTag);
      if (search) params.set("search", search);

      const res = await fetch(`${API_URL}/blog?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts);
        setPagination(data.pagination);
      }
    } catch {
      // Use fallback static posts
      setPosts([
        {
          id: "post-1",
          title: "Understanding Antibiotic Resistance & Proper Dosage Adherence",
          slug: "understanding-antibiotic-resistance",
          summary: "Why completing your prescribed course of antibiotics is essential to prevent bacterial mutation and treatment failure.",
          author: "Dr. Chioma Nwachukwu, PharmD",
          imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80",
          tags: ["Antibiotics", "Health Tips"],
          createdAt: "2026-08-02T00:00:00Z",
          _count: { comments: 0 },
        },
        {
          id: "post-2",
          title: "The Role of Cold-Chain Storage in Biological & Insulin Quality",
          slug: "cold-chain-storage-insulin",
          summary: "How thermal degradation affects sensitive pharmaceuticals and how Jumarald ensures 2°C–8°C storage during transport.",
          author: "Dr. Adebayo Ogunlesi, MD",
          imageUrl: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&q=80",
          tags: ["Diabetes", "Storage"],
          createdAt: "2026-07-28T00:00:00Z",
          _count: { comments: 0 },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPosts();
  };

  const allTags = ["Health Tips", "Malaria", "Diabetes", "Hypertension", "Antibiotics", "Maternal Health", "Child Health"];

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-12 space-y-8">
      <div className="text-left space-y-3">
        <Badge variant="emerald">Jumarald Medical Insights</Badge>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Health & Clinical Articles</h1>
        <p className="text-slate-500 text-sm max-w-2xl">
          Evidence-based health information from our team of licensed pharmacists and healthcare professionals.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            />
          </div>
          <Button type="submit" variant="primary" size="sm">
            Search
          </Button>
        </form>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setSelectedTag(null); setPage(1); }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              !selectedTag ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => { setSelectedTag(tag); setPage(1); }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedTag === tag ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 space-y-4 animate-pulse">
              <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
            </Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-slate-500">No articles found. Check back soon for new health insights!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
              <Card hoverEffect className="p-6 space-y-4 h-full cursor-pointer">
                {post.imageUrl && (
                  <img src={post.imageUrl} alt={post.title} className="h-48 w-full object-cover rounded-2xl" />
                )}
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-medium rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2">{post.title}</h2>
                  {post.summary && (
                    <p className="text-sm text-slate-500 line-clamp-2">{post.summary}</p>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <User className="h-3 w-3" />
                    <span className="truncate max-w-[120px]">{post.author}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(post.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="glass"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400">
            Page {page} of {pagination.pages}
          </span>
          <Button
            variant="glass"
            size="sm"
            disabled={page === pagination.pages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
