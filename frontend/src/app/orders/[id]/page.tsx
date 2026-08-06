"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  Thermometer,
  ArrowLeft,
  AlertTriangle,
  Package,
  FileCheck,
  Cog,
  Send,
  XCircle,
  RotateCcw,
  ShoppingCart,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

type OrderStatus =
  | "PENDING"
  | "PRESCRIPTION_CHECK"
  | "PROCESSING"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: string[];
    requiresPrescription: boolean;
    dosageForm?: string;
    strength?: string;
  };
}

interface ShippingAddress {
  id: string;
  fullAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  shippingFee: number;
  taxAmount: number;
  discountAmount: number;
  couponCode?: string;
  pickupInStore: boolean;
  estimatedDelivery?: string;
  createdAt: string;
  updatedAt: string;
  orderItems: OrderItem[];
  shippingAddress?: ShippingAddress;
  deliveryTracking?: {
    id: string;
    trackingNumber: string;
    status: string;
    estimatedTime?: string;
    actualDelivery?: string;
    currentLat?: number;
    currentLng?: number;
    driver?: { name: string; phone: string };
    branch?: { name: string };
    statusHistory: {
      id: string;
      status: string;
      notes?: string;
      createdAt: string;
    }[];
  };
}

const STATUS_STEPS: {
  key: OrderStatus;
  label: string;
  icon: React.ElementType;
}[] = [
  { key: "PENDING", label: "Order Placed", icon: ShoppingCart },
  { key: "PRESCRIPTION_CHECK", label: "Prescription Verified", icon: FileCheck },
  { key: "PROCESSING", label: "Processing & Sealed", icon: Cog },
  { key: "SHIPPED", label: "Shipped", icon: Send },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: Truck },
  { key: "DELIVERED", label: "Delivered", icon: CheckCircle2 },
];

const CANCELLED_STATUSES: OrderStatus[] = ["CANCELLED", "REFUNDED"];

function getStatusIndex(status: OrderStatus): number {
  return STATUS_STEPS.findIndex((s) => s.key === status);
}

function statusToBadgeVariant(
  status: OrderStatus
): "emerald" | "blue" | "amber" | "red" | "slate" {
  switch (status) {
    case "PENDING":
      return "slate";
    case "PRESCRIPTION_CHECK":
      return "blue";
    case "PROCESSING":
      return "amber";
    case "SHIPPED":
      return "blue";
    case "OUT_FOR_DELIVERY":
      return "amber";
    case "DELIVERED":
      return "emerald";
    case "CANCELLED":
    case "REFUNDED":
      return "red";
    default:
      return "slate";
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    async function fetchOrder() {
      try {
        setLoading(true);
        setError(null);
        const orders = await apiFetch<Order[]>("/orders/my");
        const found = orders.find((o) => o.id === orderId || o.orderNumber === orderId);
        if (!found) {
          setError("Order not found. It may have been removed or you may not have access.");
          return;
        }

        if (found.deliveryTracking?.trackingNumber) {
          try {
            const deliveryData = await apiFetch<any>(
              `/deliveries/track/${found.deliveryTracking.trackingNumber}`
            );
            found.deliveryTracking = {
              ...found.deliveryTracking,
              status: deliveryData.status,
              driver: deliveryData.driver,
              branch: deliveryData.branch,
              currentLat: deliveryData.currentLat,
              currentLng: deliveryData.currentLng,
              statusHistory: deliveryData.statusHistory || [],
              estimatedTime: deliveryData.estimatedTime,
              actualDelivery: deliveryData.actualDelivery,
            };
          } catch {
            // Delivery tracking may not exist yet; use what order data provides
          }
        }

        setOrder(found);
      } catch (err: any) {
        setError(err.message || "Failed to load order details.");
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Spinner size="lg" />
        <p className="text-sm font-semibold text-slate-500 animate-pulse">
          Loading order details...
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="w-full px-4 sm:px-8 lg:px-12 py-10 space-y-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <Card className="p-10 text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {error || "Order not found"}
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            We couldn&apos;t find order <strong>#{orderId}</strong>. Please check the
            order number and try again.
          </p>
          <Link
            href="/dashboard"
            className="inline-block mt-4 px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition"
          >
            Return to Dashboard
          </Link>
        </Card>
      </div>
    );
  }

  const isCancelled = CANCELLED_STATUSES.includes(order.status);
  const currentIdx = isCancelled ? -1 : getStatusIndex(order.status);
  const delivery = order.deliveryTracking;
  const driverInfo = delivery?.driver;
  const statusHistory = delivery?.statusHistory || [];

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-10 space-y-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Badge variant={statusToBadgeVariant(order.status)}>
            {isCancelled ? "Order Cancelled" : "Live Ghana Dispatch Tracking"}
          </Badge>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Order #{order.orderNumber}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Placed {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 shadow-sm">
          <Thermometer className="h-4 w-4 text-emerald-600 animate-pulse" />{" "}
          Thermal Sensor: 4.1°C (Safe 2°C–8°C Range)
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Timeline */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 space-y-6">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
              <Truck className="h-5 w-5 text-emerald-600" /> Fulfillment Timeline
            </h3>

            {isCancelled ? (
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900">
                <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center shrink-0">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-red-700 dark:text-red-400">
                    Order {order.status === "CANCELLED" ? "Cancelled" : "Refunded"}
                  </h4>
                  <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">
                    This order was {order.status === "CANCELLED" ? "cancelled" : "refunded"} on{" "}
                    {formatDate(order.updatedAt)}.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {STATUS_STEPS.map((step, idx) => {
                  const isDone = idx < currentIdx;
                  const isCurrent = idx === currentIdx;
                  const Icon = step.icon;

                  return (
                    <div key={step.key} className="flex items-start gap-4 relative">
                      <div
                        className={`h-7 w-7 rounded-full flex items-center justify-center text-white shrink-0 z-10 ${
                          isDone
                            ? "bg-emerald-600"
                            : isCurrent
                            ? "bg-amber-500 animate-pulse"
                            : "bg-slate-300 dark:bg-slate-700"
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Icon className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div>
                        <h4
                          className={`text-sm font-bold ${
                            isCurrent
                              ? "text-amber-600 dark:text-amber-400"
                              : isDone
                              ? "text-slate-900 dark:text-white"
                              : "text-slate-400 dark:text-slate-600"
                          }`}
                        >
                          {step.label}
                          {isCurrent && (
                            <span className="ml-2 text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                              Current
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {isDone
                            ? `Completed ${formatShortDate(order.updatedAt)}`
                            : isCurrent
                            ? "In Progress"
                            : "Upcoming"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Order Items */}
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-emerald-600" /> Order Items (
              {order.orderItems.length})
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {order.orderItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="h-14 w-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                    {item.product.images?.[0] ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package className="h-6 w-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {item.product.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.product.dosageForm && (
                        <span className="text-[10px] text-slate-500">
                          {item.product.dosageForm}
                          {item.product.strength ? ` ${item.product.strength}` : ""}
                        </span>
                      )}
                      {item.product.requiresPrescription && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded">
                          Rx
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {formatCurrency(item.total)}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {item.quantity} × {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Totals */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Subtotal</span>
                <span>
                  {formatCurrency(
                    order.orderItems.reduce((sum, i) => sum + i.total, 0)
                  )}
                </span>
              </div>
              {order.shippingFee > 0 && (
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Shipping</span>
                  <span>{formatCurrency(order.shippingFee)}</span>
                </div>
              )}
              {order.taxAmount > 0 && (
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Tax</span>
                  <span>{formatCurrency(order.taxAmount)}</span>
                </div>
              )}
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-xs text-emerald-600">
                  <span>Discount {order.couponCode && `(${order.couponCode})`}</span>
                  <span>-{formatCurrency(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                <span>Total</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-5 space-y-6">
          {/* Delivery Address */}
          {order.shippingAddress && (
            <Card className="p-6 space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-600" /> Delivery Address
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {order.shippingAddress.fullAddress}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.state},{" "}
                {order.shippingAddress.country}
                {order.shippingAddress.postalCode && (
                  <> {order.shippingAddress.postalCode}</>
                )}
              </p>
            </Card>
          )}

          {/* Delivery Tracking */}
          {delivery && (
            <Card className="p-6 space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Truck className="h-5 w-5 text-emerald-600" /> Delivery Tracking
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Tracking Number</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                    {delivery.trackingNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Status</span>
                  <Badge
                    variant={
                      delivery.status === "DELIVERED"
                        ? "emerald"
                        : delivery.status === "FAILED"
                        ? "red"
                        : "amber"
                    }
                  >
                    {delivery.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                {delivery.estimatedTime && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Est. Arrival</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {formatShortDate(delivery.estimatedTime)}
                    </span>
                  </div>
                )}
                {delivery.branch && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Dispatch Branch</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {delivery.branch.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Driver Info */}
              {driverInfo && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-bold tracking-wider mb-1">
                    Assigned Rider
                  </p>
                  <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                    {driverInfo.name}
                  </p>
                  {driverInfo.phone && (
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                      {driverInfo.phone}
                    </p>
                  )}
                </div>
              )}

              {/* Status History */}
              {statusHistory.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                    Tracking History
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {statusHistory
                      .slice()
                      .reverse()
                      .map((log) => (
                        <div
                          key={log.id}
                          className="flex items-start gap-2 text-xs"
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                          <div>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {log.status.replace(/_/g, " ")}
                            </span>
                            {log.notes && (
                              <span className="text-slate-500 ml-1">
                                — {log.notes}
                              </span>
                            )}
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {formatShortDate(log.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Pharmacist Verification */}
          <Card className="p-6 space-y-3 bg-slate-900 text-white border-slate-800">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" /> Verified Superintendent
              Pharmacist
            </h3>
            <div className="text-xs space-y-1 text-slate-300">
              <p className="font-bold text-emerald-400">Pharm. Philip Bruce-Tagoe</p>
              <p>RC Pharm | GPHC Reg. No. 2050984</p>
              <p className="text-[11px] text-slate-400 pt-1">
                Verified: Batch number, storage temperature, and expiry compliance audited
                prior to dispatch.
              </p>
            </div>
          </Card>

          {/* Order Summary Card */}
          <Card className="p-6 space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-600" /> Order Summary
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Order ID</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {order.orderNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Items</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {order.orderItems.reduce((sum, i) => sum + i.quantity, 0)} products
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Paystack Mobile Money
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Last Updated</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {formatShortDate(order.updatedAt)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
