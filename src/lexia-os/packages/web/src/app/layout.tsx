import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import ClientAppWrapper from "../components/Layout/ClientAppWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LexIA - Sistema Operativo",
  description: "El OS del Despacho Judicial",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="h-full flex bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-200 overflow-hidden font-sans" suppressHydrationWarning>
        <ClientAppWrapper>
          {children}
        </ClientAppWrapper>
      </body>
    </html>
  );
}
