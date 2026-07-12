"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../lib/apiClient";
import { formatRadicado } from "../../utils/formatters";
import { Plus, Search, Filter } from "lucide-react";

interface Expediente {
  id: string;
  description: string;
  state: string;
  createdAt: string;
  metadata?: any;
}

export default function ExpedientesPage() {
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpedientes();
  }, []);

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

  return (
    <div className="h-full flex flex-col bg-transparent relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-0 left-0 right-0 h-64 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-500 rounded-full blur-3xl opacity-10"></div>
      </div>

      <header className="relative z-10 bg-transparent px-8 py-8 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white drop-shadow-md tracking-tight">Expedientes</h1>
          <p className="text-slate-400 mt-1 font-medium">Gestiona todos los procesos del juzgado</p>
        </div>
        <button onClick={createNuevo} className="bg-slate-900 text-indigo-400 font-bold px-5 py-2.5 rounded-xl border border-slate-700/50 hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2">
          <Plus size={18} />
          Nuevo Expediente
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-8 pb-8 relative z-10 custom-scrollbar mt-2">
        <div className="max-w-6xl mx-auto space-y-6">
          
          <div className="flex gap-4 mb-8 bg-slate-900/60 backdrop-blur-md p-2 rounded-2xl shadow-sm border border-slate-700/50">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input type="text" placeholder="Buscar por radicado, parte o palabra clave..." className="w-full pl-12 pr-4 py-2.5 bg-transparent border-none focus:ring-0 outline-none text-slate-200 font-medium placeholder:text-slate-500" />
            </div>
            <div className="w-px bg-slate-800 my-2 mx-1"></div>
            <button className="px-6 py-2 rounded-xl text-slate-400 font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors">
              <Filter size={18} /> Filtros
            </button>
          </div>

          <div className="min-h-[400px] flex flex-col">
            
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-sm rounded-3xl border border-white/5 shadow-xl shadow-black/20">
                <div className="animate-spin w-10 h-10 border-4 border-slate-700 border-t-indigo-500 rounded-full mb-4"></div>
                <p className="text-slate-400 font-medium">Cargando expedientes...</p>
              </div>
            ) : expedientes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/5 shadow-xl shadow-black/20">
                <div className="w-24 h-24 bg-slate-950 border border-slate-800 text-slate-600 rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner">📁</div>
                <h3 className="text-xl font-black text-slate-300">No hay expedientes</h3>
                <p className="text-slate-500 mt-2 mb-8 max-w-sm font-medium">No tienes expedientes registrados en el sistema. Crea uno nuevo para comenzar.</p>
                <button onClick={createNuevo} className="bg-slate-900 text-indigo-400 font-black px-8 py-3 rounded-xl border border-slate-700/50 hover:bg-slate-800 hover:shadow-md transition-all uppercase tracking-wider text-sm">
                  + Crear el primer expediente
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {expedientes.map(exp => (
                  <Link href={`/expediente/${exp.id}`} key={exp.id}>
                    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 shadow-xl shadow-black/20 rounded-3xl p-6 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-slate-700 transition-all duration-300 group flex flex-col h-full">
                      
                      <div className="flex justify-between items-start mb-4">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest shadow-sm ${exp.state === 'Proyectado' ? 'bg-amber-950/50 text-amber-500 border border-amber-900/50' : exp.state === 'Firmado' ? 'bg-emerald-950/50 text-emerald-500 border border-emerald-900/50' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>
                          {exp.state}
                        </span>
                        <div className="text-xs font-bold text-slate-500 bg-slate-950 px-2 py-1 rounded-md border border-slate-800">
                          {new Date(exp.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                        </div>
                      </div>

                      <div className="font-mono text-sm font-bold text-indigo-400 mb-2">
                        {exp.metadata?.radicado ? formatRadicado(exp.metadata.radicado) : `EXP-${exp.id.substring(0,8)}`}
                      </div>

                      <div className="font-bold text-slate-200 text-lg leading-tight mb-4 flex-1 group-hover:text-white transition-colors">
                        {exp.metadata 
                          ? (exp.metadata.procesados && exp.metadata.procesados.length > 0 
                              ? `${exp.metadata.procesados[0].nombre}${exp.metadata.procesados.length > 1 ? ' y otros' : ''}${exp.metadata.demandante ? ` / ${exp.metadata.demandante}` : ''}` 
                              : exp.metadata.procesado ? `${exp.metadata.procesado}${exp.metadata.demandante ? ` / ${exp.metadata.demandante}` : ''}` : exp.description) 
                          : exp.description}
                      </div>

                      {exp.metadata?.fiscal && (
                        <div className="mt-auto pt-4 border-t border-slate-800/50 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-900/50 text-indigo-400 flex items-center justify-center text-[10px] font-black">F</div>
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
                            {typeof exp.metadata.fiscal === 'string' ? exp.metadata.fiscal : exp.metadata.fiscal.nombre}
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
