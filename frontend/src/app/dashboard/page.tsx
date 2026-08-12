"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Package, FileText, Calendar, User, Clock, CheckCircle, Mail, Phone, ShieldCheck, LogOut,
  UploadCloud, ShoppingBag, Heart, Bell, MapPin, Home, Pencil, Trash2, Plus, ChevronDown,
  ChevronRight, Star, Repeat, Info, AlertCircle, CheckCircle2, XCircle, Loader2, Eye,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { API_URL, apiFetch } from "@/lib/api";
import { useCartStore, CartProduct } from "@/store/useCartStore";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";

type Tab = "overview" | "orders" | "prescriptions" | "profile" | "addresses" | "wishlist" | "notifications";

interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  region: string;
  postalCode?: string;
  isDefault: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  product?: { id: string; name: string; slug: string; price: number; images: string[]; stockQuantity: number; requiresPrescription: boolean; category: string; };
}

export default function PatientDashboardPage() {
  const router = useRouter();
  const { addToCart } = useCartStore();
  const [tab, setTab] = useState<Tab>("overview");
  const [user, setUser] = useState<{ id?: string; name: string; email: string; phone?: string; role?: string } | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);

  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", email: "", phone: "" });
  const [profileSaving, setProfileSaving] = useState(false);

  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState({ label: "", street: "", city: "", region: "", postalCode: "", isDefault: false });
  const [addressSaving, setAddressSaving] = useState(false);

  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("jumarald_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setProfileForm({ name: parsed.name, email: parsed.email, phone: parsed.phone || "" });
      } else {
        router.push("/login");
      }
    } catch {
      router.push("/login");
    }
  }, [router]);

  const loadAllData = useCallback(async () => {
    const token = localStorage.getItem("jumarald_token");
    if (!token) return;
    setDataLoading(true);
    try {
      const [ordersRes, rxsRes, addrRes, notifRes, loyaltyRes] = await Promise.allSettled([
        apiFetch<any[]>("/orders/my"),
        apiFetch<any[]>("/prescriptions/my"),
        apiFetch<any[]>("/users/addresses"),
        apiFetch<any[]>("/users/notifications"),
        apiFetch<{ points: number }>("/users/loyalty"),
      ]);
      if (ordersRes.status === "fulfilled") setOrders(Array.isArray(ordersRes.value) ? ordersRes.value : []);
      if (rxsRes.status === "fulfilled") setPrescriptions(Array.isArray(rxsRes.value) ? rxsRes.value : []);
      if (addrRes.status === "fulfilled") setAddresses(Array.isArray(addrRes.value) ? addrRes.value : []);
      if (notifRes.status === "fulfilled") setNotifications(Array.isArray(notifRes.value) ? notifRes.value : []);
      if (loyaltyRes.status === "fulfilled" && loyaltyRes.value) setLoyaltyPoints(loyaltyRes.value.points ?? 0);
    } catch { /* silent */ } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => { loadAllData(); }, [loadAllData]);

  const getInitials = (name: string) => {
    if (!name) return "PT";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleSignOut = () => {
    localStorage.removeItem("jumarald_token");
    localStorage.removeItem("jumarald_user");
    window.dispatchEvent(new Event("jumarald_auth_change"));
    router.push("/login");
  };

  const handleReorder = (order: any) => {
    let added = 0;
    (order.orderItems || []).forEach((item: OrderItem) => {
      if (item.product || item.productId) {
        const product: CartProduct = item.product
          ? {
              id: item.product.id,
              name: item.product.name,
              slug: item.product.slug,
              price: item.price,
              stockQuantity: item.product.stockQuantity,
              requiresPrescription: item.product.requiresPrescription,
              images: item.product.images,
              category: item.product.category,
            }
          : {
              id: item.productId,
              name: item.productName,
              slug: item.productName.toLowerCase().replace(/\s+/g, "-"),
              price: item.price,
              stockQuantity: 100,
              requiresPrescription: false,
              images: [],
              category: "general",
            };
        addToCart(product, item.quantity);
        added++;
      }
    });
    toast.success(`${added} item(s) added to cart`);
  };

  const handleSaveProfile = async () => {
    if (!profileForm.name.trim()) { toast.error("Name is required"); return; }
    setProfileSaving(true);
    try {
      await apiFetch("/users/profile", { method: "PUT", body: JSON.stringify(profileForm) });
      const updated = { ...user!, name: profileForm.name, email: profileForm.email, phone: profileForm.phone };
      setUser(updated);
      localStorage.setItem("jumarald_user", JSON.stringify(updated));
      setEditProfileOpen(false);
      toast.success("Profile updated successfully");
    } catch (e: any) { toast.error(e.message || "Failed to update profile"); }
    finally { setProfileSaving(false); }
  };

  const handleDeleteRx = async (rxId: string) => {
    if (!confirm("Are you sure you want to delete this prescription?")) return;
    try {
      await apiFetch(`/prescriptions/${rxId}`, { method: "DELETE" });
      toast.success("Prescription deleted successfully");
      loadAllData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete prescription");
    }
  };

  const openAddAddress = () => {
    setEditingAddress(null);
    setAddressForm({ label: "Home", street: "", city: "", region: "", postalCode: "", isDefault: addresses.length === 0 });
    setAddressDialogOpen(true);
  };

  const openEditAddress = (addr: Address) => {
    setEditingAddress(addr);
    setAddressForm({ label: addr.label, street: addr.street, city: addr.city, region: addr.region, postalCode: addr.postalCode || "", isDefault: addr.isDefault });
    setAddressDialogOpen(true);
  };

  const handleSaveAddress = async () => {
    if (!addressForm.street.trim() || !addressForm.city.trim() || !addressForm.region.trim()) {
      toast.error("Please fill in street, city, and region");
      return;
    }
    setAddressSaving(true);
    try {
      if (editingAddress) {
        const res = await apiFetch<Address>(`/users/addresses/${editingAddress.id}`, { method: "PUT", body: JSON.stringify(addressForm) });
        setAddresses((prev) => prev.map((a) => a.id === editingAddress.id ? { ...a, ...res, ...addressForm } : a));
        toast.success("Address updated");
      } else {
        const res = await apiFetch<Address>("/users/addresses", { method: "POST", body: JSON.stringify(addressForm) });
        setAddresses((prev) => [...prev, { ...addressForm, id: res.id || Date.now().toString() }]);
        toast.success("Address added");
      }
      setAddressDialogOpen(false);
    } catch (e: any) { toast.error(e.message || "Failed to save address"); }
    finally { setAddressSaving(false); }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await apiFetch(`/users/addresses/${id}`, { method: "DELETE" });
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success("Address deleted");
    } catch (e: any) { toast.error(e.message || "Failed to delete address"); }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await apiFetch(`/users/notifications/${id}/read`, { method: "PUT" });
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    } catch { /* silent */ }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    PENDING: { color: "amber", icon: <Clock className="h-3.5 w-3.5" /> },
    PROCESSING: { color: "blue", icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> },
    SHIPPED: { color: "blue", icon: <Package className="h-3.5 w-3.5" /> },
    DELIVERED: { color: "emerald", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    CANCELLED: { color: "red", icon: <XCircle className="h-3.5 w-3.5" /> },
    REFUNDED: { color: "slate", icon: <AlertCircle className="h-3.5 w-3.5" /> },
  };

  const recentOrders = orders.slice(0, 3);
  const totalSpent = orders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "overview", label: "Overview", icon: <Home className="h-4 w-4" /> },
    { id: "orders", label: "Orders", icon: <ShoppingBag className="h-4 w-4" />, badge: orders.length || undefined },
    { id: "prescriptions", label: "Prescriptions", icon: <FileText className="h-4 w-4" />, badge: prescriptions.length || undefined },
    { id: "wishlist", label: "Wishlist", icon: <Heart className="h-4 w-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" />, badge: unreadCount || undefined },
    { id: "profile", label: "Profile", icon: <User className="h-4 w-4" /> },
    { id: "addresses", label: "Addresses", icon: <MapPin className="h-4 w-4" /> },
  ];

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading Patient Account...</p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-10 space-y-8">
      {/* Hero Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8 rounded-3xl bg-slate-950 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-10 -mt-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="flex items-center gap-5 relative z-10">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-2xl font-black shadow-lg shadow-emerald-600/30 text-white">
            {getInitials(user.name)}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white">{user.name}</h1>
              <Badge variant="emerald" className="bg-emerald-500 text-white font-bold text-[10px]">Verified Patient</Badge>
            </div>
            <p className="text-xs text-slate-400 font-medium flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-emerald-400" /> {user.email}</span>
              {user.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-emerald-400" /> {user.phone}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 relative z-10 w-full md:w-auto">
          <Link href="/prescriptions/upload" className="w-full md:w-auto">
            <Button variant="primary" size="md" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md">
              <UploadCloud className="h-4 w-4" /> Upload Rx
            </Button>
          </Link>
          <Button variant="outline" size="md" onClick={handleSignOut} className="border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white">
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto gap-1 border-b border-slate-200 dark:border-slate-800 pb-0 scrollbar-hide">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-bold whitespace-nowrap transition-colors rounded-t-xl ${
              tab === t.id
                ? "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-b-white dark:border-b-slate-900 text-emerald-600 -mb-px"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"
            }`}
          >
            {t.icon}
            {t.label}
            {t.badge !== undefined && (
              <span className={`ml-1 h-5 min-w-[20px] flex items-center justify-center rounded-full text-[10px] font-bold px-1.5 ${
                tab === t.id
                  ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {dataLoading && (
        <div className="flex items-center justify-center py-12 gap-3 text-slate-400">
          <div className="animate-spin h-5 w-5 border-2 border-emerald-600 border-t-transparent rounded-full" />
          <span className="text-sm">Loading your data...</span>
        </div>
      )}

      {/* ═══════════════════════ OVERVIEW TAB ═══════════════════════ */}
      {!dataLoading && tab === "overview" && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Welcome back, {user.name.split(" ")[0]}!
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Here&apos;s a summary of your account activity.
            </p>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Orders</span>
                <ShoppingBag className="h-5 w-5 text-emerald-500" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{orders.length}</p>
              <p className="text-xs text-slate-400">{formatCurrency(totalSpent)} spent</p>
            </Card>
            <Card className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Loyalty Points</span>
                <Star className="h-5 w-5 text-amber-500" />
              </div>
              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{loyaltyPoints.toLocaleString()}</p>
              <p className="text-xs text-slate-400">Earn points on every order</p>
            </Card>
            <Card className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Prescriptions</span>
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{prescriptions.length}</p>
              <p className="text-xs text-slate-400">{prescriptions.filter((p) => p.status === "APPROVED").length} approved</p>
            </Card>
            <Card className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Wishlist</span>
                <Heart className="h-5 w-5 text-red-500" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{wishlist.length}</p>
              <p className="text-xs text-slate-400">Items saved for later</p>
            </Card>
          </div>

          {/* Recent Orders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Recent Orders</h3>
              {orders.length > 3 && (
                <button onClick={() => setTab("orders")} className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
                  View all <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
            {recentOrders.length === 0 ? (
              <Card className="p-8 text-center space-y-3">
                <ShoppingBag className="h-10 w-10 text-slate-200 dark:text-slate-700 mx-auto" />
                <p className="text-sm text-slate-400 font-medium">No orders yet</p>
                <Link href="/shop"><Button variant="primary" size="sm">Browse Medicines</Button></Link>
              </Card>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order: any) => {
                  const sc = statusConfig[order.status] || statusConfig.PENDING;
                  return (
                    <Card key={order.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 dark:text-white">{order.orderNumber}</span>
                          <Badge variant={sc.color as any} className="flex items-center gap-1">
                            {sc.icon} {order.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(order.createdAt).toLocaleDateString("en-GH", { day: "2-digit", month: "short", year: "numeric" })}
                          {" "} • {order.orderItems?.length ?? 0} item(s)
                        </p>
                      </div>
                      <span className="font-extrabold text-slate-900 dark:text-white text-base">{formatCurrency(order.totalAmount)}</span>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════ ORDERS TAB ═══════════════════════ */}
      {!dataLoading && tab === "orders" && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <ShoppingBag className="h-10 w-10 text-slate-200 dark:text-slate-700 mx-auto" />
              <p className="text-sm text-slate-400 font-medium">No orders yet. Start shopping!</p>
              <Link href="/shop"><Button variant="primary" size="sm">Browse Medicines</Button></Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{orders.length} order(s) total</p>
              </div>
              {orders.map((order: any) => {
                const sc = statusConfig[order.status] || statusConfig.PENDING;
                const isExpanded = expandedOrder === order.id;
                return (
                  <Card key={order.id} className="overflow-hidden">
                    {/* Order Header */}
                    <div
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none p-5"
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-slate-900 dark:text-white">{order.orderNumber}</span>
                          <Badge variant={sc.color as any} className="flex items-center gap-1">
                            {sc.icon} {order.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(order.createdAt).toLocaleDateString("en-GH", { day: "2-digit", month: "short", year: "numeric" })}
                          {" "} • {order.orderItems?.length ?? 0} item(s)
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-extrabold text-slate-900 dark:text-white">{formatCurrency(order.totalAmount)}</span>
                        <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </div>
                    </div>

                    {/* Order Items (expanded) */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 dark:border-slate-800 px-5 pb-5 space-y-3">
                        <div className="space-y-2 pt-3">
                          {(order.orderItems || []).map((item: OrderItem) => (
                            <div key={item.id} className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                                  <Package className="h-5 w-5 text-slate-400" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{item.productName}</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">Qty: {item.quantity}</p>
                                </div>
                              </div>
                              <span className="text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleReorder(order); }} className="text-emerald-600 dark:text-emerald-400">
                            <Repeat className="h-4 w-4" /> Reorder
                          </Button>
                          <span className="text-xs text-slate-400">
                            Paid: {formatCurrency(order.totalAmount)}
                          </span>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════ PRESCRIPTIONS TAB ═══════════════════════ */}
      {!dataLoading && tab === "prescriptions" && (
        <div className="space-y-4">
          {prescriptions.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <FileText className="h-10 w-10 text-slate-200 dark:text-slate-700 mx-auto" />
              <p className="text-sm text-slate-400 font-medium">No prescriptions uploaded yet.</p>
              <Link href="/prescriptions/upload"><Button variant="primary" size="sm">Upload Prescription</Button></Link>
            </div>
          ) : (
            <div className="space-y-3">
              {prescriptions.map((rx: any) => {
                const rxStatus = rx.status || "PENDING";
                const rxBadge = rxStatus === "APPROVED" ? "emerald" : rxStatus === "REJECTED" ? "red" : "amber";
                return (
                  <Card key={rx.id} className="p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">RX-{rx.id.slice(0, 8).toUpperCase()}</span>
                          <Badge variant={rxBadge as any}>{rxStatus.replace("_", " ")}</Badge>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(rx.createdAt).toLocaleDateString("en-GH", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {(rx.documentUrl || rx.fileUrl) && (
                          <a href={rx.documentUrl || rx.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /> View File</Button>
                          </a>
                        )}
                        {(rxStatus === "SUBMITTED" || rxStatus === "REJECTED" || rxStatus === "PENDING") && (
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteRx(rx.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30">
                            <Trash2 className="h-4 w-4" /> Delete
                          </Button>
                        )}
                      </div>
                    </div>

                    {rx.patientNotes && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Your Notes</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{rx.patientNotes}</p>
                      </div>
                    )}

                    {rx.pharmacistNote && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl">
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
                          <Info className="h-3.5 w-3.5" /> Pharmacist Notes
                        </p>
                        <p className="text-sm text-emerald-800 dark:text-emerald-300">{rx.pharmacistNote}</p>
                      </div>
                    )}

                    {!rx.pharmacistNote && rxStatus === "PENDING" && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl">
                        <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> Awaiting pharmacist review
                        </p>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════ WISHLIST TAB ═══════════════════════ */}
      {!dataLoading && tab === "wishlist" && (
        <div className="space-y-4">
          {wishlist.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Heart className="h-10 w-10 text-slate-200 dark:text-slate-700 mx-auto" />
              <p className="text-sm text-slate-400 font-medium">Your wishlist is empty.</p>
              <p className="text-xs text-slate-400">Save items from the shop to revisit later.</p>
              <Link href="/shop"><Button variant="primary" size="sm">Browse Medicines</Button></Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {wishlist.map((item: any) => (
                <Card key={item.id} className="p-4 space-y-3">
                  <div className="h-28 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    {item.images?.[0] ? (
                      <Image src={item.images[0]} alt={item.name} width={300} height={112} quality={80} placeholder="blur" blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+" className="h-full w-full object-contain rounded-xl" />
                    ) : (
                      <Package className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.name}</p>
                    <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(item.price)}</p>
                  </div>
                  <Button variant="primary" size="sm" className="w-full" onClick={() => {
                    addToCart(item, 1);
                    toast.success(`${item.name} added to cart!`);
                  }}>
                    <ShoppingBag className="h-4 w-4" /> Add to Cart
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════ NOTIFICATIONS TAB ═══════════════════════ */}
      {!dataLoading && tab === "notifications" && (
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Bell className="h-10 w-10 text-slate-200 dark:text-slate-700 mx-auto" />
              <p className="text-sm text-slate-400 font-medium">No notifications yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <Card
                  key={n.id}
                  className={`p-4 flex items-start gap-3 cursor-pointer transition-all ${
                    !n.read
                      ? "border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/30 dark:bg-emerald-950/10"
                      : "opacity-60"
                  }`}
                  onClick={() => markNotificationRead(n.id)}
                >
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    n.type === "ORDER" ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                    : n.type === "PRESCRIPTION" ? "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}>
                    {n.type === "ORDER" ? <Package className="h-4 w-4" /> : n.type === "PRESCRIPTION" ? <FileText className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${!n.read ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}>{n.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                      {new Date(n.createdAt).toLocaleDateString("en-GH", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {!n.read && <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════ PROFILE TAB ═══════════════════════ */}
      {!dataLoading && tab === "profile" && (
        <Card className="p-8 space-y-6 max-w-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Personal Information</h2>
            <Button variant="ghost" size="sm" onClick={() => { setProfileForm({ name: user.name, email: user.email, phone: user.phone || "" }); setEditProfileOpen(true); }}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Full Name</label>
              <p className="font-bold text-slate-900 dark:text-white mt-1">{user.name}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Email Address</label>
              <p className="font-bold text-slate-900 dark:text-white mt-1">{user.email}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Phone Number</label>
              <p className="font-bold text-slate-900 dark:text-white mt-1">{user.phone || "Not specified"}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Account Security</label>
              <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <ShieldCheck className="h-4 w-4" /> 256-bit Encrypted
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ═══════════════════════ ADDRESSES TAB ═══════════════════════ */}
      {!dataLoading && tab === "addresses" && (
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Saved Addresses</h2>
            <Button variant="primary" size="sm" onClick={openAddAddress}>
              <Plus className="h-4 w-4" /> Add Address
            </Button>
          </div>
          {addresses.length === 0 ? (
            <Card className="p-8 text-center space-y-3">
              <MapPin className="h-10 w-10 text-slate-200 dark:text-slate-700 mx-auto" />
              <p className="text-sm text-slate-400 font-medium">No saved addresses.</p>
              <p className="text-xs text-slate-400">Add an address for faster checkout.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <Card key={addr.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{addr.label}</span>
                      {addr.isDefault && <Badge variant="emerald">Default</Badge>}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{addr.street}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{addr.city}, {addr.region}{addr.postalCode ? ` ${addr.postalCode}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditAddress(addr)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteAddress(addr.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ EDIT PROFILE DIALOG ═══════════════ */}
      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent className="w-full max-w-md p-6 space-y-5">
          <DialogClose onClose={() => setEditProfileOpen(false)} />
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">Edit Profile</DialogTitle>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Full Name</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Email Address</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Phone Number</label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setEditProfileOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSaveProfile} isLoading={profileSaving}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════ ADD/EDIT ADDRESS DIALOG ═══════════════ */}
      <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
        <DialogContent className="w-full max-w-md p-6 space-y-5">
          <DialogClose onClose={() => setAddressDialogOpen(false)} />
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">{editingAddress ? "Edit Address" : "Add Address"}</DialogTitle>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Label</label>
              <select
                value={addressForm.label}
                onChange={(e) => setAddressForm((a) => ({ ...a, label: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="Home">Home</option>
                <option value="Work">Work</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Street Address</label>
              <input
                type="text"
                value={addressForm.street}
                onChange={(e) => setAddressForm((a) => ({ ...a, street: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                placeholder="e.g. 123 Main St, Apt 4B"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">City</label>
                <input
                  type="text"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm((a) => ({ ...a, city: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Region</label>
                <input
                  type="text"
                  value={addressForm.region}
                  onChange={(e) => setAddressForm((a) => ({ ...a, region: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Postal Code (optional)</label>
              <input
                type="text"
                value={addressForm.postalCode}
                onChange={(e) => setAddressForm((a) => ({ ...a, postalCode: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={addressForm.isDefault}
                onChange={(e) => setAddressForm((a) => ({ ...a, isDefault: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Set as default address</span>
            </label>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setAddressDialogOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSaveAddress} isLoading={addressSaving}>
              {editingAddress ? "Update" : "Save"} Address
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
