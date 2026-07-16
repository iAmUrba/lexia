import React from "react";
import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, className }: { title: string; subtitle?: string; className?: string }) {
  return (
    <div className={cn("", className)}>
      <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-md">{title}</h1>
      {subtitle && (
        <p className="text-lg text-slate-300 mt-2 font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function SectionTitle({ children, color = "blue", className }: { children: React.ReactNode; color?: "blue" | "indigo" | "emerald"; className?: string }) {
  const colorMap = {
    blue: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]",
    indigo: "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]",
    emerald: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]",
  };

  return (
    <h2 className={cn("text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2", className)}>
      <span className={cn("w-2 h-2 rounded-full", colorMap[color])}></span> {children}
    </h2>
  );
}
