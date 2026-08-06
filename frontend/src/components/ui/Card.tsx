import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  hoverEffect?: boolean;
}

export function Card({ className, glass = false, hoverEffect = false, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-all duration-300",
        glass && "glass-card",
        hoverEffect && "hover:shadow-xl hover:-translate-y-1 hover:border-brand-500/30",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
