import React from "react";
import { cn } from "@/lib/utils";

interface WidgetProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function MetricCard({ children, className, ...props }: WidgetProps) {
  return (
    <div 
      className={cn(
        "bg-slate-900/40 backdrop-blur-xl p-5 rounded-3xl border border-white/5 shadow-xl shadow-black/20 group transition-all duration-300 relative overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function LexiaCoreCard({ children, className, ...props }: WidgetProps) {
  return (
    <div 
      className={cn(
        "bg-gradient-to-r from-indigo-50 to-blue-50 border border-blue-100/50 rounded-3xl p-6 shadow-xl shadow-blue-900/5 group transition-all duration-300 relative overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
