"use client";

import { useState, useEffect } from "react";
import { Bell, Check, CheckCheck, Trash2, Filter } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => { loadNotifications(); }, []);

  async function loadNotifications() {
    try {
      const data = await apiFetch<Notification[]>("/notifications");
      setNotifications(data);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = filter === "unread" ? notifications.filter((n) => !n.isRead) : notifications;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Notification Center</h1>
          <p className="text-slate-500 text-sm">{unreadCount} unread notifications</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFilter(filter === "all" ? "unread" : "all")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center gap-1">
            <Filter className="h-3 w-3" /> {filter === "all" ? "Show Unread" : "Show All"}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {loading ? (
          [1, 2, 3].map((i) => <div key={i} className="bg-white rounded-xl p-4 animate-pulse"><div className="h-4 bg-slate-200 rounded w-3/4" /></div>)
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <Bell className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No notifications</p>
          </div>
        ) : (
          filtered.map((n) => (
            <div key={n.id} className={`bg-white rounded-xl border p-4 flex items-start gap-4 ${!n.isRead ? "border-emerald-200 bg-emerald-50/30" : "border-slate-100"}`}>
              <div className={`p-2 rounded-lg shrink-0 ${!n.isRead ? "bg-emerald-100" : "bg-slate-100"}`}>
                <Bell className={`h-4 w-4 ${!n.isRead ? "text-emerald-600" : "text-slate-400"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${!n.isRead ? "text-slate-800" : "text-slate-600"}`}>{n.title}</p>
                <p className="text-sm text-slate-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                {!n.isRead && (
                  <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-emerald-600">
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
