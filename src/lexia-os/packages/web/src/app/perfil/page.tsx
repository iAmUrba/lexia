"use client";

import { useAuth } from "../../contexts/AuthContext";
import { User, Shield, Briefcase, MapPin } from "lucide-react";

export default function PerfilPage() {
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen bg-slate-50 w-full overflow-y-auto">
      {/* Premium Header Background */}
      <div className="absolute top-0 left-0 right-0 h-72 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500 rounded-full blur-3xl opacity-10 animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 px-8 py-12 max-w-5xl mx-auto w-full mt-16">
        
        {/* Profile Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl p-8 sm:p-12 shadow-2xl shadow-slate-200/50 flex flex-col md:flex-row items-center md:items-start gap-10">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative w-36 h-36 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border-4 border-white shadow-xl shadow-slate-200 flex items-center justify-center text-5xl font-black text-slate-400 shrink-0 transform transition-transform hover:scale-105 duration-300">
              {user?.nombre_completo?.substring(0, 2).toUpperCase() || 'U'}
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-400 border-4 border-white rounded-full"></div>
            </div>
            <span className="mt-4 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-widest border border-slate-200">En línea</span>
          </div>
          
          {/* Info Section */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">{user?.nombre_completo}</h1>
            <div className="flex items-center justify-center md:justify-start gap-2 text-blue-600 font-semibold mb-8">
              <Shield size={18} className="text-blue-500" />
              <span>{(user as any)?.rol === 'admin' ? 'Administrador del Sistema' : 'Usuario Estándar'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50/50 hover:bg-slate-50 transition-colors p-5 rounded-2xl border border-slate-100 flex items-start gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-blue-500">
                  <User size={20} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Usuario</div>
                  <div className="font-semibold text-slate-800">{user?.username}</div>
                </div>
              </div>
              
              <div className="bg-slate-50/50 hover:bg-slate-50 transition-colors p-5 rounded-2xl border border-slate-100 flex items-start gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-emerald-500">
                  <Briefcase size={20} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Cargo Oficial</div>
                  <div className="font-semibold text-slate-800">{user?.cargo}</div>
                </div>
              </div>

              <div className="bg-slate-50/50 hover:bg-slate-50 transition-colors p-5 rounded-2xl border border-slate-100 flex items-start gap-4 sm:col-span-2">
                <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-purple-500">
                  <MapPin size={20} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Despacho Asignado</div>
                  <div className="font-semibold text-slate-800">{user?.despacho} <span className="text-slate-400 font-normal">({user?.ciudad})</span></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
