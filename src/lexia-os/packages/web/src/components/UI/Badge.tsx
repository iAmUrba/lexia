import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: "success" | "warning" | "danger" | "info" | "default";
}

export function Badge({ children, variant = "default", className, ...props }: BadgeProps) {
  const variants = {
    success: "bg-emerald-950/50 text-emerald-500 border-emerald-900/50",
    warning: "bg-amber-950/50 text-amber-500 border-amber-900/50",
    danger: "bg-red-950/50 text-red-500 border-red-900/50",
    info: "bg-indigo-950/50 text-indigo-400 border-indigo-900/50",
    default: "bg-slate-900 text-slate-400 border-slate-800",
  };

  return (
    <span
      className={cn(
        "text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest transition-all shadow-sm border",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
