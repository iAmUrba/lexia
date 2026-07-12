"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { formatRadicado } from "../utils/formatters";
import { apiFetch } from "../lib/apiClient";

interface Expediente {
  id: string;
  description: string;
  state: string;
  createdAt: string;
  metadata?: any;
}

export default function HomeDashboard() {
  const [showPalette, setShowPalette] = useState(false);
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Estados para la Agenda
  const [agenda, setAgenda] = useState<any[]>([]);
  const [agendaCount, setAgendaCount] = useState(0);
  const [loadingAgenda, setLoadingAgenda] = useState(true);

  useEffect(() => {
    fetchExpedientes();
    fetchAgenda();
  }, []);

  const fetchAgenda = async () => {
    try {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const res = await apiFetch(`/api/agenda/hoy?fecha=${todayStr}`);
      if (res.ok) {
        const data = await res.json();
        setAgenda(data.data);
        setAgendaCount(data.count);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAgenda(false);
    }
  };

  const fetchExpedientes = async () => {
    try {
      const res = await apiFetch("/api/tutelas");
      const data = await res.json();
      setExpedientes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const createNuevo = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
  };

  // Command Palette Simulation
  const handleKeydown = (e: React.KeyboardEvent) => {
    // just for simulation
  };

  return (
    <div className="h-full flex flex-col bg-transparent relative overflow-hidden">
      
      {/* Premium Background Effects (No animations) */}
      <div className="absolute top-0 left-0 right-0 h-96 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-10"></div>
        <div className="absolute top-0 -right-32 w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-10"></div>
      </div>

      {/* Header Sticky */}
      <header className="relative z-10 px-8 py-8 border-b border-white/10 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-md">Buenos días, Santiago.</h1>
          <p className="text-lg text-slate-300 mt-2 font-medium">
            Resumen de tu despacho para el día de hoy.
          </p>
        </div>
        
        <div className="w-[400px] relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors" size={18} />
          <input
            type="search"
            placeholder="Buscar por radicado, procesado o descripción..."
            className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/20 transition-all font-medium shadow-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {/* Workspace Area */}
      <div className="flex-1 overflow-y-auto p-8 relative z-10 custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-8 mt-4">
          
          {/* Quick Stats / Status Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/40 backdrop-blur-xl p-5 rounded-3xl border border-white/5 shadow-xl shadow-black/20 flex items-center justify-between group transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-2xl shadow-lg shadow-blue-500/30">📅</div>
                <div>
                  <div className="text-3xl font-black text-slate-100 tracking-tight">{agendaCount}</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">audiencias hoy</div>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-900/40 backdrop-blur-xl p-5 rounded-3xl border border-white/5 shadow-xl shadow-black/20 flex items-center justify-between group transition-all duration-300 relative overflow-hidden">
              <div className="flex items-center gap-4 opacity-70">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-500 text-white flex items-center justify-center text-2xl shadow-lg shadow-orange-500/20 grayscale group-hover:grayscale-0 transition-all">✍️</div>
                <div>
                  <div className="text-3xl font-black text-slate-400 tracking-tight">0</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">firmas pendientes</div>
                </div>
              </div>
              <span className="absolute top-4 right-4 text-[9px] font-black text-orange-400 uppercase bg-orange-950/50 px-2 py-1 rounded-md border border-orange-900/50">Próximamente</span>
            </div>
            
            <div className="bg-slate-900/40 backdrop-blur-xl p-5 rounded-3xl border border-white/5 shadow-xl shadow-black/20 flex items-center justify-between group transition-all duration-300 relative overflow-hidden">
              <div className="flex items-center gap-4 opacity-70">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-400 to-red-500 text-white flex items-center justify-center text-2xl shadow-lg shadow-red-500/20 grayscale group-hover:grayscale-0 transition-all">⚠</div>
                <div>
                  <div className="text-3xl font-black text-slate-400 tracking-tight">0</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">términos vencen hoy</div>
                </div>
              </div>
              <span className="absolute top-4 right-4 text-[9px] font-black text-red-400 uppercase bg-red-950/50 px-2 py-1 rounded-md border border-red-900/50">Próximamente</span>
            </div>
          </div>

          {/* ✨ LexIA Layer */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-blue-100/50 rounded-3xl p-6 shadow-xl shadow-blue-900/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group transition-all duration-300 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-400 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="flex gap-4 items-start sm:items-center relative z-10">
              <div className="text-4xl filter drop-shadow-md transform group-hover:scale-110 transition-transform">✨</div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-xl font-black text-indigo-950 tracking-tight">LexIA no tiene sugerencias nuevas</h3>
                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md uppercase tracking-wider border border-indigo-200">En desarrollo</span>
                </div>
                <p className="text-indigo-900/60 font-medium">Conecta tu buzón de correo para recibir borradores automáticos.</p>
              </div>
            </div>
            <button disabled className="relative z-10 shrink-0 bg-white/50 backdrop-blur-sm border border-indigo-100 cursor-not-allowed text-indigo-300 font-bold py-3 px-8 rounded-xl shadow-sm transition-colors">
              Revisar bandeja
            </button>
          </div>

          {/* Main Grid: Agenda & Firmas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* AGENDA */}
            <div>
              <div className="flex justify-between items-center mb-4 px-1">
                <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span> Agenda de Hoy
                </h2>
              </div>
              
              <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/10 shadow-xl shadow-black/20 overflow-hidden flex flex-col min-h-[200px] max-h-[400px]">
                {loadingAgenda ? (
                  <div className="p-8 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
                  </div>
                ) : agenda.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-900/30">
                    <div className="text-4xl mb-4 opacity-30 grayscale">🗓</div>
                    <h3 className="text-base font-bold text-slate-300">Tu agenda está libre hoy</h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">No hay audiencias programadas para esta fecha.</p>
                  </div>
                ) : (
                  <div className="overflow-y-auto divide-y divide-slate-100/50 p-2 custom-scrollbar">
                    {agenda.map((evt) => {
                      const time = new Date(evt.datetime).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
                      return (
                        <Link href={`/agenda?date=${evt.datetime}`} key={evt.id}>
                          <div className="p-3 hover:bg-slate-800/50 rounded-2xl transition-colors flex gap-4 cursor-pointer group border border-transparent hover:border-slate-700/50">
                            <div className="shrink-0 flex flex-col items-center justify-center w-14 h-14 bg-slate-950/50 rounded-xl border border-slate-800 shadow-sm transition-all">
                              <span className="text-sm font-black text-slate-300 group-hover:text-blue-400 transition-colors">{time}</span>
                            </div>
                            <div className="flex-1 min-w-0 py-1">
                              <p className="text-sm font-bold text-slate-200 line-clamp-2 leading-tight group-hover:text-blue-300 transition-colors">
                                {evt.description}
                              </p>
                              <span className={`inline-block mt-2 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider
                                ${evt.status === 'completado' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                                {evt.status}
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* EXPEDIENTES */}
            <div>
              <div className="flex justify-between items-center mb-4 px-1">
                <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span> Expedientes Recientes
                </h2>
                <button onClick={createNuevo} className="text-[10px] bg-slate-900 border border-slate-700 shadow-sm text-slate-300 font-black px-3 py-1.5 rounded-lg hover:bg-slate-800 hover:text-indigo-400 transition-colors uppercase tracking-wider">
                  + Nuevo
                </button>
              </div>
              
              <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/10 shadow-xl shadow-black/20 overflow-hidden min-h-[200px] flex flex-col relative">
                {loading && (
                  <div className="p-6 space-y-4 w-full">
                    {[1,2,3].map(i => (
                      <div key={i} className="flex justify-between items-center p-2 opacity-50">
                        <div className="space-y-3">
                          <div className="h-4 bg-slate-700 rounded-md w-48"></div>
                          <div className="h-3 bg-slate-800 rounded-md w-24"></div>
                        </div>
                        <div className="h-8 bg-slate-700 rounded-lg w-20"></div>
                      </div>
                    ))}
                  </div>
                )}

                {!loading && expedientes.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-900/30">
                    <div className="w-16 h-16 bg-slate-950/50 shadow-sm border border-slate-800 text-slate-500 rounded-2xl flex items-center justify-center text-3xl mb-4">📂</div>
                    <h3 className="text-base font-bold text-slate-300">Bandeja vacía</h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">No tienes expedientes activos en este momento.</p>
                  </div>
                )}
                
                {!loading && expedientes
                  .filter(exp => {
                    if (!searchTerm) return true;
                    const term = searchTerm.toLowerCase();
                    const desc = exp.description?.toLowerCase() || "";
                    const rad = exp.metadata?.radicado?.toLowerCase() || "";
                    let procesadosStr = "";
                    if (exp.metadata?.procesados) {
                      procesadosStr = exp.metadata.procesados.map((p: any) => p.nombre).join(" ").toLowerCase();
                    } else if (exp.metadata?.procesado) {
                      procesadosStr = exp.metadata.procesado.toLowerCase();
                    }
                    return desc.includes(term) || rad.includes(term) || procesadosStr.includes(term);
                  })
                  .map(exp => (
                  <Link href={`/expediente/${exp.id}`} key={exp.id}>
                    <div className="p-4 hover:bg-slate-800/50 cursor-pointer flex items-center justify-between transition-all group border-b border-slate-800/50 last:border-0 m-2 rounded-2xl">
                      <div>
                        <div className="font-bold text-slate-200 group-hover:text-indigo-400 transition-colors text-base tracking-tight mb-1">
                          {exp.metadata 
                            ? (exp.metadata.procesados && exp.metadata.procesados.length > 0 
                                ? `${exp.metadata.procesados[0].nombre}${exp.metadata.procesados.length > 1 ? ' y otros' : ''}${exp.metadata.demandante ? ` / ${exp.metadata.demandante}` : ''}` 
                                : exp.metadata.procesado ? `${exp.metadata.procesado}${exp.metadata.demandante ? ` / ${exp.metadata.demandante}` : ''}` : exp.description) 
                            : exp.description}
                        </div>
                        <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
                          <span className="font-mono bg-slate-900 px-1.5 py-0.5 rounded text-slate-400 border border-slate-800 shadow-sm">{exp.metadata?.radicado ? `Rad: ${formatRadicado(exp.metadata.radicado)}` : `ID: ${exp.id.substring(0,8)}`}</span>
                          {exp.metadata?.fiscal && <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950/50 text-indigo-400 border border-indigo-900/50 font-bold uppercase tracking-wider">{typeof exp.metadata.fiscal === 'string' ? exp.metadata.fiscal : exp.metadata.fiscal.nombre}</span>}
                        </div>
                      </div>
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest transition-all shadow-sm ${exp.state === 'Proyectado' ? 'bg-amber-950/50 text-amber-500 border border-amber-900/50' : exp.state === 'Firmado' ? 'bg-emerald-950/50 text-emerald-500 border border-emerald-900/50' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>
                        {exp.state}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
