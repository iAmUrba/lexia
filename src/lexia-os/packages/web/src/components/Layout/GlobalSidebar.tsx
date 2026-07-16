"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import CommandPalette from "./CommandPalette";
import { useAuth } from "../../contexts/AuthContext";
import { LogOut, Settings, User } from "lucide-react";

export default function GlobalSidebar() {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  
  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.user-menu-container')) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <aside className="w-[260px] bg-slate-900/60 backdrop-blur-xl text-slate-300 flex flex-col shrink-0 border-r border-slate-800/50 shadow-sm z-20">
        
        {/* Header del Juzgado */}
        <div className="px-4 py-4 flex items-center gap-3">
          <div className="w-6 h-6 bg-slate-900 rounded-md flex items-center justify-center font-bold text-white text-xs shadow-sm">
            {user?.despacho?.charAt(0).toUpperCase() || 'L'}
          </div>
          <span className="font-semibold tracking-tight text-slate-100 truncate" title={user?.despacho || 'Juzgado 3 Penal Especializado'}>
            {user?.despacho || 'Juzgado 3 Penal Especializado'}
          </span>
        </div>

        {/* Botón Universal */}
        <div className="px-4 mb-6">
          <button 
            onClick={() => setIsCommandPaletteOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 font-medium hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all group"
          >
            <span className="text-lg leading-none group-hover:scale-110 transition-transform">+</span> 
            <span>Crear Nuevo</span>
            <span className="ml-auto text-[10px] text-blue-100 bg-black/20 px-1.5 py-0.5 rounded border border-white/10">⌘K</span>
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-3 overflow-y-auto space-y-8 pb-6 custom-scrollbar">
          
          {/* TRABAJO */}
          <div>
            <h3 className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-2 h-0.5 bg-slate-700 rounded-full"></span> Trabajo
            </h3>
            <ul className="space-y-1">
              <li>
                <Link href="/" className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${pathname === '/' ? 'bg-indigo-900/50 text-indigo-300 font-semibold shadow-sm ring-1 ring-indigo-800/50' : 'hover:bg-slate-800/50 text-slate-300 font-medium'}`}>
                  <span className={pathname === '/' ? 'text-blue-500' : 'text-slate-400'}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                  </span> 
                  Hoy
                </Link>
              </li>
              <li>
                <Link href="/expedientes" className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${pathname.startsWith('/expediente') ? 'bg-indigo-900/50 text-indigo-300 font-semibold shadow-sm ring-1 ring-indigo-800/50' : 'hover:bg-slate-800/50 text-slate-300 font-medium'}`}>
                  <span className={pathname.startsWith('/expediente') ? 'text-blue-500' : 'text-slate-400'}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path></svg>
                  </span> 
                  Expedientes
                </Link>
              </li>
              <li>
                <Link href="/agenda" className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${pathname.startsWith('/agenda') ? 'bg-indigo-900/50 text-indigo-300 font-semibold shadow-sm ring-1 ring-indigo-800/50' : 'hover:bg-slate-800/50 text-slate-300 font-medium'}`}>
                  <span className={pathname.startsWith('/agenda') ? 'text-blue-500' : 'text-slate-400'}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line></svg>
                  </span> 
                  Agenda
                </Link>
              </li>
              <li>
                <Link href="/documentos" className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${pathname === '/documentos' ? 'bg-indigo-900/50 text-indigo-300 font-semibold shadow-sm ring-1 ring-indigo-800/50' : 'hover:bg-slate-800/50 text-slate-300 font-medium'}`}>
                  <span className={pathname === '/documentos' ? 'text-blue-500' : 'text-slate-400'}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" x2="8" y1="13" y2="13"></line><line x1="16" x2="8" y1="17" y2="17"></line><line x1="10" x2="8" y1="9" y2="9"></line></svg>
                  </span> 
                  Documentos
                </Link>
              </li>
            </ul>
          </div>

          {/* LEXIA */}
          <div>
            <h3 className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-2 h-0.5 bg-indigo-400 rounded-full"></span> LexIA Inteligencia
            </h3>
            <ul className="space-y-1">
              <li>
                <Link href="/resoluciones" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-indigo-50/80 text-indigo-700 font-medium transition-all group">
                  <span className="text-indigo-400 group-hover:scale-110 transition-transform">✨</span>
                  <span>Preparé esto</span>
                  <span className="ml-auto bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ring-indigo-200">6</span>
                </Link>
              </li>
              <li>
                <Link href="/revision" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-orange-50/80 transition-all text-orange-700 font-medium group">
                  <span className="text-orange-400 group-hover:scale-110 transition-transform">⚠</span>
                  <span>Por revisar</span>
                </Link>
              </li>
              <li>
                <Link href="/glosador" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 transition-all text-slate-600 font-medium group">
                  <span className="text-slate-400 group-hover:scale-110 transition-transform">✨</span>
                  <span>LexIA Core</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* DESPACHO */}
          <div>
            <h3 className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-2 h-0.5 bg-slate-700 rounded-full"></span> Gestión
            </h3>
            <ul className="space-y-1">
              <li>
                <Link href="/personas" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 transition-all text-slate-600 font-medium group">
                  <span className="text-slate-400 group-hover:text-blue-500 transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  </span> 
                  Personas
                </Link>
              </li>
              <li>
                <Link href="/estadisticas" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-800/50 transition-all text-slate-300 font-medium group">
                  <span className="text-slate-400 group-hover:text-blue-500 transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="18" y1="20" y2="10"></line><line x1="12" x2="12" y1="20" y2="4"></line><line x1="6" x2="6" y1="20" y2="14"></line></svg>
                  </span> 
                  Estadísticas
                </Link>
              </li>
              <li>
                <Link href="/configuracion" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-800/50 transition-all text-slate-300 font-medium group">
                  <span className="text-slate-400 group-hover:text-blue-500 transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                  </span> 
                  Configuración
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800 user-menu-container relative">
          <div 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-3 px-2 py-1.5 hover:bg-slate-800/50 rounded-md cursor-pointer transition-colors"
          >
            <div className="w-7 h-7 bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">
              {user?.nombre_completo?.substring(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="text-sm font-medium text-slate-300 truncate flex-1">
              {user?.nombre_completo || 'Usuario'}
            </div>
          </div>
          
          {isUserMenuOpen && (
            <div className="absolute bottom-full left-4 mb-3 w-[260px] bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-black/50 rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/5">
              <div className="px-4 py-3 bg-gradient-to-br from-slate-800 to-slate-900 border-b border-slate-700/50">
                <div className="font-bold text-sm text-slate-100 truncate tracking-tight">{user?.nombre_completo}</div>
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mt-0.5 truncate">{user?.cargo}</div>
              </div>
              <div className="p-1.5">
                <button 
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    router.push('/perfil');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-slate-100 rounded-xl transition-all group"
                >
                  <User size={16} className="text-slate-400 group-hover:text-blue-500 transition-colors" /> Mi Perfil
                </button>
                <button 
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    router.push('/configuracion');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-slate-100 rounded-xl transition-all group"
                >
                  <Settings size={16} className="text-slate-400 group-hover:text-blue-500 transition-colors" /> Preferencias
                </button>
                <button 
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    // Lógica futura para cambiar despacho
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-slate-100 rounded-xl transition-all group"
                >
                  <span className="text-slate-400 group-hover:text-blue-500 transition-colors text-center w-[16px]">🏢</span> Cambiar despacho
                </button>
              </div>
              {(!user || user?.rol === 'admin' || true) && ( // Temporalmente visible para desarrollo
                <div className="p-1.5 border-t border-slate-800/50">
                  <button 
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      router.push('/admin');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-bold text-indigo-400 hover:bg-indigo-950/50 hover:text-indigo-300 rounded-xl transition-all group"
                  >
                    <span className="text-indigo-500 group-hover:text-indigo-400 transition-colors text-center w-[16px]">⚙</span> Administración
                  </button>
                </div>
              )}
              <div className="p-1.5 border-t border-slate-800/50 bg-slate-950/50">
                <button 
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-900/30 hover:text-red-400 rounded-xl transition-all group"
                >
                  <LogOut size={16} className="text-red-500/80 group-hover:text-red-400 transition-colors" /> Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
      />
    </>
  );
}
