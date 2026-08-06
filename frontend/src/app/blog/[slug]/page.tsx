"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { API_URL } from "@/lib/api";
import { Calendar, User, ArrowLeft, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string; avatarUrl: string | null };
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string | null;
  author: string;
  imageUrl: string | null;
  tags: string[];
  createdAt: string;
  comments: Comment[];
}

export default function BlogPostPage() {
  const params = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [params.slug]);

  const fetchPost = async () => {
    try {
      const res = await fetch(`${API_URL}/blog/${params.slug}`);
      if (res.ok) {
        const data = await res.json();
        setPost(data);
      }
    } catch {
      // Fallback static content
      setPost({
        id: "post-1",
        title: "Understanding Antibiotic Resistance & Proper Dosage Adherence",
        slug: "understanding-antibiotic-resistance",
        content: `<p>Antibiotic resistance is one of the most pressing public health threats globally. When antibiotics are used incorrectly, bacteria can evolve and become resistant, making infections harder to treat.</p>
<h2>Why Complete Your Course?</h2>
<p>Even if you feel better after a few days, stopping antibiotics early can allow surviving bacteria to develop resistance. Always complete the full prescribed course.</p>
<h2>Common Mistakes</h2>
<ul>
<li>Stopping medication when symptoms improve</li>
<li>Sharing antibiotics with others</li>
<li>Using leftover antibiotics for new illnesses</li>
<li>Not following dosage instructions</li>
</ul>
<h2>What You Can Do</h2>
<p>Only take antibiotics prescribed by a qualified healthcare professional. Never demand antibiotics for viral infections like the common cold or flu.</p>`,
        summary: "Why completing your prescribed course of antibiotics is essential to prevent bacterial mutation and treatment failure.",
        author: "Dr. Chioma Nwachukwu, PharmD",
        imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80",
        tags: ["Antibiotics", "Health Tips"],
        createdAt: "2026-08-02T00:00:00Z",
        comments: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem("jumarald_token");
      if (!token) {
        toast.error("Please login to comment");
        return;
      }

      const res = await fetch(`${API_URL}/blog/${post!.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: comment }),
      });

      if (!res.ok) throw new Error("Failed to add comment");

      const newComment = await res.json();
      setPost((prev) => prev ? { ...prev, comments: [newComment, ...prev.comments] } : prev);
      setComment("");
      toast.success("Comment added successfully");
    } catch {
      toast.error("Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-8 lg:px-12 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
          <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
          <div className="space-y-3">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="w-full px-4 sm:px-8 lg:px-12 py-12 text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Article not found</h1>
        <Link href="/blog" className="text-emerald-600 hover:underline mt-4 inline-block">
          Back to articles
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-12 space-y-8">
      <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700">
        <ArrowLeft className="h-4 w-4" />
        Back to articles
      </Link>

      <article className="max-w-3xl space-y-6">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="emerald">{tag}</Badge>
            ))}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">{post.title}</h1>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{new Date(post.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
            </div>
          </div>
        </div>

        {post.imageUrl && (
          <img src={post.imageUrl} alt={post.title} className="w-full h-64 sm:h-80 object-cover rounded-2xl" />
        )}

        {post.summary && (
          <p className="text-lg text-slate-600 dark:text-slate-400 italic border-l-4 border-emerald-500 pl-4">
            {post.summary}
          </p>
        )}

        <div
          className="prose prose-slate dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      <Card className="p-6 max-w-3xl space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Comments ({post.comments.length})
        </h2>

        <form onSubmit={handleComment} className="flex gap-2">
          <input
            type="text"
            placeholder="Add a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
          />
          <Button type="submit" variant="primary" size="sm" disabled={submitting || !comment.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>

        <div className="space-y-3">
          {post.comments.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No comments yet. Be the first to share your thoughts!</p>
          ) : (
            post.comments.map((c) => (
              <div key={c.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{c.user.name}</span>
                  <span className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{c.content}</p>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
