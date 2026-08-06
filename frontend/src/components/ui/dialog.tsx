"use client";

import * as React from "react";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        {children}
      </div>
    </div>
  );
}

function DialogContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-xl relative ${className}`} onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  );
}

function DialogTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-lg font-bold ${className}`}>{children}</h2>;
}

function DialogClose({ onClose }: { onClose: () => void }) {
  return (
    <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
      <X className="h-5 w-5" />
    </button>
  );
}

export { Dialog, DialogContent, DialogTitle, DialogClose };
