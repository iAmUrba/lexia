import React, { useState } from 'react';
import { formatRadicado, extractYearFromRadicado } from '../../utils/formatters';
import EditExpedienteModal from './EditExpedienteModal';

interface ExpedienteCoverProps {
  data: any;
  onNewDocument: () => void;
  onUpdate?: () => void;
}

export default function ExpedienteCover({ data, onNewDocument, onUpdate }: ExpedienteCoverProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (!data || !data.work) return null;
  
  const md = data.work.metadata || {};
  const radicadoFormatado = formatRadicado(md.radicado || "");
  const year = extractYearFromRadicado(md.radicado || "");
  const isSPOA = md.radicado && md.radicado.length === 23;

  return (
    <div className="p-8 w-full flex justify-center mt-6">
      <div className="max-w-4xl w-full bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/30 border border-slate-700/50 overflow-hidden animate-in fade-in zoom-in-95 duration-500 flex flex-col">
        
        {/* Header Cover */}
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 px-10 py-12 text-white relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 p-8 opacity-10 blur-sm mix-blend-overlay">
            <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-30"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-sm ${data.work.state === 'Proyectado' ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : data.work.state === 'Firmado' ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30' : 'bg-blue-400/20 text-blue-300 border border-blue-400/30'}`}>
                {data.work.state}
              </span>
              {year && <span className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-white/10 text-white border border-white/20 shadow-sm uppercase tracking-widest">AÑO {year}</span>}
            </div>
            <h1 className="text-4xl font-black tracking-tight mb-4 flex flex-col gap-2">
              <span className="text-indigo-300 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><span className="w-4 h-px bg-indigo-300"></span> Radicado SPOA</span>
              <span className="font-mono text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200">{radicadoFormatado || `EXP-${new Date(data.work.createdAt).getFullYear()}-${data.work.id.substring(0,5).toUpperCase()}`}</span>
            </h1>
            <p className="text-indigo-200 mt-6 text-base font-medium max-w-2xl leading-relaxed">
              {data.work.description}
            </p>
          </div>
        </div>

        {/* Body Cover */}
        <div className="p-10 bg-slate-900/40 flex-1 relative">
          <div className="grid grid-cols-2 gap-8">
            
            {/* Procesados y Delitos */}
            <div className="col-span-2 md:col-span-1 space-y-10">
              <div>
                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-6 h-1 bg-indigo-500 rounded-full"></span> Procesados
                </h3>
                {md.procesados && md.procesados.length > 0 ? (
                  <div className="space-y-4">
                    {md.procesados.map((p: any, i: number) => (
                      <div key={i} className="bg-slate-800/80 backdrop-blur-sm p-5 rounded-2xl border border-slate-700/50 shadow-lg shadow-black/20 hover:-translate-y-1 transition-transform group">
                        <div className="font-black text-slate-200 text-lg tracking-tight group-hover:text-indigo-400 transition-colors">{p.nombre}</div>
                        <div className="text-xs font-bold text-slate-400 mt-2 font-mono bg-slate-900 px-2 py-1 rounded-md inline-block">CC: {p.cedula}</div>
                        {p.detenido && <span className="text-[10px] text-red-400 font-black uppercase tracking-widest bg-red-950/50 border border-red-900/50 px-2 py-1 rounded-md ml-3 relative -top-0.5">Detenido</span>}
                        {p.defensor && (
                          <div className="mt-4 pt-4 border-t border-slate-700/50 flex flex-col gap-1.5">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Defensor {p.defensor.tipo}</span>
                            <span className="text-sm font-bold text-slate-300">{p.defensor.nombre}</span>
                            <span className="text-[10px] font-bold text-slate-500 font-mono">TP: {p.defensor.tp}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm font-medium text-slate-500 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 border-dashed text-center">No hay procesados registrados.</div>
                )}
              </div>

              <div>
                <h3 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-6 h-1 bg-red-500 rounded-full"></span> Delitos Imputados
                </h3>
                {md.delitos && md.delitos.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {md.delitos.map((d: string, i: number) => (
                      <span key={i} className="bg-red-950/50 text-red-400 border border-red-900/50 text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl shadow-sm">
                        {d}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm font-medium text-slate-500 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 border-dashed text-center">No hay delitos registrados.</div>
                )}
              </div>
            </div>

            {/* Partes Oficiales */}
            <div className="col-span-2 md:col-span-1 space-y-10">
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-6 h-1 bg-slate-600 rounded-full"></span> Fiscalía General
                </h3>
                {md.fiscal ? (
                  <div className="bg-slate-800/80 backdrop-blur-sm p-5 rounded-2xl border border-slate-700/50 shadow-lg shadow-black/20 border-l-4 border-l-blue-500">
                    <div className="font-black text-slate-200 text-lg tracking-tight">{typeof md.fiscal === 'string' ? md.fiscal : md.fiscal.nombre}</div>
                    {typeof md.fiscal === 'object' && <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{md.fiscal.despacho}</div>}
                  </div>
                ) : (
                  <div className="text-sm font-medium text-slate-500 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 border-dashed text-center">Sin datos de fiscalía.</div>
                )}
              </div>

              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-6 h-1 bg-slate-600 rounded-full"></span> Ministerio Público
                </h3>
                {md.ministerio_publico ? (
                  <div className="bg-slate-800/80 backdrop-blur-sm p-5 rounded-2xl border border-slate-700/50 shadow-lg shadow-black/20 border-l-4 border-l-purple-500">
                    <div className="font-black text-slate-200 text-lg tracking-tight">{typeof md.ministerio_publico === 'string' ? md.ministerio_publico : md.ministerio_publico.nombre}</div>
                    {typeof md.ministerio_publico === 'object' && <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{md.ministerio_publico.despacho}</div>}
                  </div>
                ) : (
                  <div className="text-sm font-medium text-slate-500 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 border-dashed text-center">Sin datos de ministerio público.</div>
                )}
              </div>

              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-6 h-1 bg-slate-600 rounded-full"></span> Otras Partes
                </h3>
                <div className="space-y-3 bg-slate-900/60 p-5 rounded-2xl border border-slate-700/50 shadow-sm">
                  {md.demandante && (
                    <div className="text-sm border-b border-slate-700/50 pb-3">
                      <span className="font-black text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Denunciante/Victima</span> <span className="font-bold text-slate-200">{md.demandante}</span>
                    </div>
                  )}
                  {md.representante_victimas && (
                    <div className="text-sm pt-1">
                      <span className="font-black text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Rep. de Víctimas</span> <span className="font-bold text-slate-200">{md.representante_victimas}</span>
                    </div>
                  )}
                  {!md.demandante && !md.representante_victimas && (
                    <div className="text-sm font-medium text-slate-500 text-center italic">Ninguna</div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Action */}
        <div className="bg-slate-900/80 backdrop-blur-md p-8 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-sm font-medium text-slate-500">
            Este expediente tiene <span className="font-black text-indigo-400 text-base">{data.documents?.length || 0}</span> documentos redactados.
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="bg-slate-800 border border-slate-700 hover:border-indigo-500/50 hover:bg-indigo-950/30 text-indigo-400 font-black uppercase tracking-wider py-2.5 px-8 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 text-[11px]"
            >
              <span>Editar Información</span>
            </button>
          </div>
        </div>

      </div>

      {isEditModalOpen && (
        <EditExpedienteModal 
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          expedienteData={data}
          onUpdated={() => {
            setIsEditModalOpen(false);
            if (onUpdate) onUpdate();
          }}
        />
      )}
    </div>
  );
}
