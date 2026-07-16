import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "success";
}

export function Button({ children, variant = "primary", className, ...props }: ButtonProps) {
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-700 border border-indigo-500 text-white font-bold py-3 px-8 rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.3)]",
    secondary: "bg-slate-900 border border-slate-700 shadow-sm text-slate-300 font-black px-3 py-1.5 rounded-lg hover:bg-slate-800 hover:text-indigo-400 uppercase tracking-wider",
    danger: "bg-red-600 hover:bg-red-700 border border-red-500 text-white font-bold py-3 px-8 rounded-xl shadow-[0_0_15px_rgba(220,38,38,0.3)]",
    ghost: "bg-transparent hover:bg-slate-800 text-slate-300 font-bold py-2 px-4 rounded-xl",
    success: "bg-emerald-600 hover:bg-emerald-700 border border-emerald-500 text-white font-bold py-3 px-8 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)]",
  };

  return (
    <button
      className={cn("transition-all", variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}
