"use client";

import React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "purple"
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "low-stock"
  | "in-stock"
  | "out-of-stock"
  | "expiring";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-600 border-slate-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  purple: "bg-purple-50 text-purple-700 border-purple-200",
  pending: "bg-slate-100 text-slate-600 border-slate-200",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  shipped: "bg-cyan-50 text-cyan-700 border-cyan-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  "low-stock": "bg-amber-50 text-amber-700 border-amber-200",
  "in-stock": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "out-of-stock": "bg-red-50 text-red-700 border-red-200",
  expiring: "bg-orange-50 text-orange-700 border-orange-200",
};

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

export function StatusBadge({ label, variant = "default", className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border",
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {label}
    </span>
  );
}

export function getStatusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    PENDING: "pending",
    SUBMITTED: "warning",
    PRESCRIPTION_CHECK: "purple",
    UNDER_REVIEW: "info",
    PROCESSING: "processing",
    DISPATCHED: "warning",
    SHIPPED: "shipped",
    DELIVERED: "delivered",
    CANCELLED: "cancelled",
    REFUNDED: "default",
    APPROVED: "success",
    REJECTED: "danger",
    CLARIFICATION_NEEDED: "purple",
    PAID: "success",
    UNPAID: "danger",
    PARTIALLY_PAID: "warning",
    LOW_STOCK: "low-stock",
    IN_STOCK: "in-stock",
    OUT_OF_STOCK: "out-of-stock",
    EXPIRING: "expiring",
  };
  return map[status?.toUpperCase()] || "default";
}
