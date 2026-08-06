import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

export function Spinner({ size = "md", className, ...props }: SpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-10 w-10",
  };

  return (
    <div role="status" className={cn("inline-flex items-center justify-center", className)} {...props}>
      <Loader2 className={cn("animate-spin text-emerald-600 dark:text-emerald-400", sizeClasses[size])} />
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <Spinner size="lg" />
      <p className="text-sm font-semibold text-slate-500 animate-pulse">Loading Jumarald Healthcare...</p>
    </div>
  );
}
