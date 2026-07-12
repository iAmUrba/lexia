"use client";

import { AuthProvider, useAuth } from "../../contexts/AuthContext";
import LoginPage from "../Auth/LoginPage";
import GlobalSidebar from "./GlobalSidebar";
import LexiaSidebar from "../Editor/LexiaSidebar";
import SplashScreen from "./SplashScreen";

function AppContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="h-full w-full bg-slate-900 flex items-center justify-center"></div>;
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <>
      <SplashScreen />
      <GlobalSidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {children}
      </main>
      
      {/* Herramienta Flotante Global de LexIA */}
      <LexiaSidebar />
    </>
  );
}

export default function ClientAppWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppContent>
        {children}
      </AppContent>
    </AuthProvider>
  );
}
