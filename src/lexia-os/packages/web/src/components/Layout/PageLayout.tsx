import React from "react";
import { PageHeader } from "@/components/UI/Typography";

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  headerContent?: React.ReactNode;
  children: React.ReactNode;
}

export function PageLayout({ title, subtitle, headerContent, children }: PageLayoutProps) {
  return (
    <div className="h-full flex flex-col bg-transparent relative overflow-hidden">
      
      {/* Premium Background Effects */}
      <div className="absolute top-0 left-0 right-0 h-96 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-10"></div>
        <div className="absolute top-0 -right-32 w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-10"></div>
      </div>

      {/* Header Sticky */}
      <header className="relative z-10 px-8 py-8 border-b border-white/10 shrink-0 flex items-center justify-between">
        <PageHeader title={title} subtitle={subtitle} />
        {headerContent && <div>{headerContent}</div>}
      </header>

      {/* Workspace Area */}
      <div className="flex-1 overflow-y-auto p-8 relative z-10 custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-8 mt-4">
          {children}
        </div>
      </div>
    </div>
  );
}
