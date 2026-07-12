"use client";
import { useState } from "react";
import { Minimize2, Maximize2 } from "lucide-react";
import MergePdfModal from "../Tools/MergePdfModal";

export default function LexiaSidebar() {
  // Inicialmente minimizado por defecto para que sea la "bolita" global
  const [isMinimized, setIsMinimized] = useState(true);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button 
          onClick={() => setIsMinimized(false)}
          className="bg-gradient-to-b from-blue-900 to-indigo-950 text-white rounded-full p-4 shadow-2xl hover:scale-110 transition-transform"
          title="Abrir LexIA"
        >
          <span className="text-2xl animate-pulse">✨</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 fixed bottom-6 right-6 z-50 bg-gradient-to-b from-blue-900 to-indigo-950 text-white rounded-xl shadow-2xl p-5 flex flex-col gap-6 max-h-[calc(100vh-40px)] overflow-y-auto animate-in slide-in-from-bottom-8 fade-in duration-300">
      <div className="flex items-center justify-between border-b border-blue-800/50 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl animate-pulse">✨</span>
          <div>
            <h2 className="font-bold text-lg tracking-wide">LexIA</h2>
            <p className="text-blue-300 text-xs uppercase tracking-widest font-bold">Asistente Jurídico</p>
          </div>
        </div>
        <button 
          onClick={() => setIsMinimized(true)}
          className="p-1.5 hover:bg-blue-800/50 rounded-lg text-blue-300 hover:text-white transition-colors"
          title="Minimizar LexIA"
        >
          <Minimize2 size={16} />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <button type="button" className="bg-blue-800/40 hover:bg-blue-700/60 border border-blue-700/50 text-left p-3 rounded-lg flex items-center justify-between group transition-all">
          <span className="text-sm font-bold text-blue-100 group-hover:text-white flex items-center gap-2">
            ✨ Analizar documento
          </span>
          <span className="text-[9px] bg-blue-900 text-blue-300 px-1.5 py-0.5 rounded uppercase font-bold">Próximamente</span>
        </button>

        <button type="button" className="bg-blue-800/40 hover:bg-blue-700/60 border border-blue-700/50 text-left p-3 rounded-lg flex items-center justify-between group transition-all">
          <span className="text-sm font-bold text-blue-100 group-hover:text-white flex items-center gap-2">
            ✨ Buscar jurisprudencia
          </span>
          <span className="text-[9px] bg-blue-900 text-blue-300 px-1.5 py-0.5 rounded uppercase font-bold">Próximamente</span>
        </button>

        <button type="button" className="bg-blue-800/40 hover:bg-blue-700/60 border border-blue-700/50 text-left p-3 rounded-lg flex items-center justify-between group transition-all">
          <span className="text-sm font-bold text-blue-100 group-hover:text-white flex items-center gap-2">
            ✨ Detectar errores
          </span>
          <span className="text-[9px] bg-blue-900 text-blue-300 px-1.5 py-0.5 rounded uppercase font-bold">Próximamente</span>
        </button>

        <button type="button" className="bg-blue-800/40 hover:bg-blue-700/60 border border-blue-700/50 text-left p-3 rounded-lg flex items-center justify-between group transition-all">
          <span className="text-sm font-bold text-blue-100 group-hover:text-white flex items-center gap-2">
            ✨ Resumir expediente
          </span>
          <span className="text-[9px] bg-blue-900 text-blue-300 px-1.5 py-0.5 rounded uppercase font-bold">Próximamente</span>
        </button>

        <button 
          type="button" 
          onClick={() => setIsMergeModalOpen(true)}
          className="bg-blue-800/40 hover:bg-blue-700/60 border border-blue-700/50 text-left p-3 rounded-lg flex items-center justify-between group transition-all"
        >
          <span className="text-sm font-bold text-blue-100 group-hover:text-white flex items-center gap-2">
            ✨ Unir PDFs
          </span>
        </button>
      </div>

      <div className="mt-auto pt-6 border-t border-blue-800/50">
        <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">Actividad reciente</h3>
        <div className="space-y-4 opacity-70">
          <div className="flex gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5"></div>
             <div>
                <p className="text-xs text-blue-200">No hay actividad reciente en este documento.</p>
             </div>
          </div>
        </div>
      </div>

      {isMergeModalOpen && (
        <MergePdfModal onClose={() => setIsMergeModalOpen(false)} />
      )}
    </div>
  )
}
