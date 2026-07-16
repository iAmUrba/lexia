import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "glass" | "plain";
}

export function Card({ children, variant = "glass", className, ...props }: CardProps) {
  const variants = {
    glass: "bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/10 shadow-xl shadow-black/20 overflow-hidden",
    plain: "bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden",
  };

  return (
    <div 
      className={cn(variants[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}
