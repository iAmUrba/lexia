"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { formatRadicado } from "../utils/formatters";
import { apiFetch } from "../lib/apiClient";
import { SectionTitle } from "@/components/UI/Typography";
import { Card } from "@/components/UI/Card";
import { MetricCard, LexiaCoreCard } from "@/components/Widgets";
import { Button } from "@/components/UI/Button";
import { Badge } from "@/components/UI/Badge";
import { PageLayout } from "@/components/Layout/PageLayout";

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

  const searchHeader = (
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
  );

  return (
    <PageLayout 
      title="Buenos días, Santiago." 
      subtitle="Resumen de tu despacho para el día de hoy."
      headerContent={searchHeader}
    >
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-2xl shadow-lg shadow-blue-500/30">📅</div>
            <div>
              <div className="text-3xl font-black text-slate-100 tracking-tight">{agendaCount}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">audiencias hoy</div>
            </div>
          </div>
        </MetricCard>
        
        <MetricCard className="flex items-center justify-between">
          <div className="flex items-center gap-4 opacity-70">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-500 text-white flex items-center justify-center text-2xl shadow-lg shadow-orange-500/20 grayscale group-hover:grayscale-0 transition-all">✍️</div>
            <div>
              <div className="text-3xl font-black text-slate-400 tracking-tight">0</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">firmas pendientes</div>
            </div>
          </div>
          <Badge variant="warning" className="absolute top-4 right-4 text-[9px]">Próximamente</Badge>
        </MetricCard>
        
        <MetricCard className="flex items-center justify-between">
          <div className="flex items-center gap-4 opacity-70">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-400 to-red-500 text-white flex items-center justify-center text-2xl shadow-lg shadow-red-500/20 grayscale group-hover:grayscale-0 transition-all">⚠</div>
            <div>
              <div className="text-3xl font-black text-slate-400 tracking-tight">0</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">términos vencen hoy</div>
            </div>
          </div>
          <Badge variant="danger" className="absolute top-4 right-4 text-[9px]">Próximamente</Badge>
        </MetricCard>
      </div>

      {/* LexIA Layer */}
      <LexiaCoreCard className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-400 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
        <div className="flex gap-4 items-start sm:items-center relative z-10">
          <div className="text-4xl filter drop-shadow-md transform group-hover:scale-110 transition-transform">✨</div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-xl font-black text-indigo-950 tracking-tight">LexIA Core (Nuevo)</h3>
              <span className="text-[10px] font-black text-white bg-indigo-500 px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm">BETA</span>
            </div>
            <p className="text-indigo-900/60 font-medium">Inspecciona la salud de tus expedientes o simula cruces de la bandeja.</p>
          </div>
        </div>
        <Link href="/glosador" className="relative z-10 shrink-0">
          <Button variant="primary">Abrir LexIA Core</Button>
        </Link>
      </LexiaCoreCard>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* AGENDA */}
        <div>
          <div className="flex justify-between items-center mb-4 px-1">
            <SectionTitle color="blue">Agenda de Hoy</SectionTitle>
          </div>
          
          <Card variant="glass" className="flex flex-col min-h-[200px] max-h-[400px]">
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
                          <Badge 
                            variant={evt.status === 'completado' ? 'success' : 'info'} 
                            className="inline-block mt-2"
                          >
                            {evt.status}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* EXPEDIENTES */}
        <div>
          <div className="flex justify-between items-center mb-4 px-1">
            <SectionTitle color="indigo">Expedientes Recientes</SectionTitle>
            <Button variant="secondary" onClick={createNuevo}>+ Nuevo</Button>
          </div>
          
          <Card variant="glass" className="min-h-[200px] flex flex-col relative">
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
                      {exp.metadata?.fiscal && <Badge variant="info" className="text-[10px] rounded-full">{typeof exp.metadata.fiscal === 'string' ? exp.metadata.fiscal : exp.metadata.fiscal.nombre}</Badge>}
                    </div>
                  </div>
                  <Badge 
                    variant={exp.state === 'Proyectado' ? 'warning' : exp.state === 'Firmado' ? 'success' : 'default'}
                  >
                    {exp.state}
                  </Badge>
                </div>
              </Link>
            ))}
          </Card>
        </div>

      </div>
    </PageLayout>
  );
}
