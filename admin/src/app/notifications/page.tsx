"use client";

import { useState, useEffect } from "react";
import { Bell, Check } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Notification { id: string; type: string; title: string; message: string; isRead: boolean; createdAt: string; }

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => { apiFetch<Notification[]>("/notifications").then(setNotifications).catch(() => setNotifications([])).finally(() => setLoading(false)); }, []);

  const filtered = filter === "unread" ? notifications.filter((n) => !n.isRead) : notifications;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Notification Center</h1><p className="text-slate-500 dark:text-slate-400 text-sm">{unreadCount} unread</p></div>
        <button onClick={() => setFilter(filter === "all" ? "unread" : "all")} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">{filter === "all" ? "Show Unread" : "Show All"}</button>
      </div>
      <div className="space-y-2">
        {loading ? [1, 2, 3].map((i) => <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-4 animate-pulse"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" /></div>)
        : filtered.length === 0 ? <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center"><Bell className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" /><p className="text-slate-500 dark:text-slate-400">No notifications</p></div>
        : filtered.map((n) => (
          <div key={n.id} className={`bg-white dark:bg-slate-800 rounded-xl border p-4 flex items-start gap-4 ${!n.isRead ? "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-900/10" : "border-slate-100 dark:border-slate-700"}`}>
            <div className={`p-2 rounded-lg shrink-0 ${!n.isRead ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-slate-100 dark:bg-slate-700"}`}><Bell className={`h-4 w-4 ${!n.isRead ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`} /></div>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm ${!n.isRead ? "text-slate-800 dark:text-slate-200" : "text-slate-600 dark:text-slate-400"}`}>{n.title}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
