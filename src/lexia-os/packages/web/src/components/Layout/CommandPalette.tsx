"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/apiClient";
import { Search, FileText, FolderPlus, ArrowRight } from "lucide-react";
import NewExpedienteModal from "../Editor/NewExpedienteModal";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [step, setStep] = useState<"action" | "select_expediente">("action");
  const [selectedAction, setSelectedAction] = useState<"expediente" | "constancia" | "auto" | null>(null);
  
  const [expedientes, setExpedientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setStep("action");
      setQuery("");
      setSelectedAction(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const fetchExpedientes = async () => {
    setLoading(true);
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

  const [isExpedienteModalOpen, setIsExpedienteModalOpen] = useState(false);

  const handleActionSelect = (action: "expediente" | "constancia" | "auto") => {
    if (action === "expediente") {
      setIsExpedienteModalOpen(true);
    } else {
      setSelectedAction(action);
      setStep("select_expediente");
      setQuery("");
      fetchExpedientes();
      inputRef.current?.focus();
    }
  };

  const createNewExpediente = async (data: any) => {
    setLoading(true);
    const eventId = crypto.randomUUID();
    
    try {
      const response = await apiFetch('/api/tutelas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          eventId, 
          radicado: data.radicado,
          delitos: data.delitos,
          procesados: data.procesados,
          demandante: data.demandante,
          fiscal: data.fiscal,
          seccional: data.seccional,
          ministerio_publico: data.ministerio_publico,
          victimas: data.victimas,
          representante_victimas: data.representante_victimas
        })
      });
      const result = await response.json();
      setIsExpedienteModalOpen(false);
      onClose();
      router.push(`/expediente/${result.workId}`);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExpedienteSelect = (expId: string) => {
    // Redirigir al expediente con el flag para abrir modal
    let template = "";
    if (selectedAction === "constancia") template = "constancia_aplazamiento";
    if (selectedAction === "auto") template = "auto_admisorio";
    
    router.push(`/expediente/${expId}?newDoc=${template}`);
    onClose();
  };

  if (!isOpen && !isExpedienteModalOpen) return null;

  return (
    <>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-slate-900/50 backdrop-blur-sm">
      
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-slate-900 w-full max-w-xl rounded-xl shadow-2xl overflow-hidden flex flex-col border border-slate-700/50 shadow-black/50">
        
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-slate-700/50">
          <Search className="text-slate-400 mr-3" size={20} />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-slate-100 placeholder:text-slate-500 text-lg"
            placeholder={step === "action" ? "¿Qué quieres crear?" : "Busca el expediente destino..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={onClose} className="text-xs bg-slate-800 text-slate-400 font-bold px-2 py-1 rounded">ESC</button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto py-2">
          
          {step === "action" && (
            <div className="px-2">
              <div className="px-3 py-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">Expedientes</div>
              <button 
                onClick={() => handleActionSelect("expediente")}
                className="w-full text-left flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-800/50 text-slate-300 hover:text-indigo-400 transition-colors group mb-4"
              >
                <div className="bg-slate-800 group-hover:bg-indigo-900/50 p-2 rounded-md"><FolderPlus size={18} className="text-slate-400 group-hover:text-indigo-400" /></div>
                <div>
                  <div className="font-bold text-slate-200 group-hover:text-indigo-300">Nuevo Expediente</div>
                  <div className="text-xs text-slate-500">Crea un expediente vacío</div>
                </div>
                <ArrowRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 text-indigo-400" />
              </button>

              <div className="px-3 py-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">Documentos Comunes</div>
              <button 
                onClick={() => handleActionSelect("constancia")}
                className="w-full text-left flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-800/50 text-slate-300 hover:text-indigo-400 transition-colors group"
              >
                <div className="bg-slate-800 group-hover:bg-indigo-900/50 p-2 rounded-md"><FileText size={18} className="text-slate-400 group-hover:text-indigo-400" /></div>
                <div>
                  <div className="font-bold text-slate-200 group-hover:text-indigo-300">Constancia de Aplazamiento</div>
                  <div className="text-xs text-slate-500">Genera una constancia secretarial</div>
                </div>
                <ArrowRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 text-indigo-400" />
              </button>

              <button 
                onClick={() => handleActionSelect("auto")}
                className="w-full text-left flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-800/50 text-slate-300 hover:text-indigo-400 transition-colors group"
              >
                <div className="bg-slate-800 group-hover:bg-indigo-900/50 p-2 rounded-md"><FileText size={18} className="text-slate-400 group-hover:text-indigo-400" /></div>
                <div>
                  <div className="font-bold text-slate-200 group-hover:text-indigo-300">Auto Admisorio</div>
                  <div className="text-xs text-slate-500">Plantilla de auto admisorio de tutela</div>
                </div>
                <ArrowRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 text-indigo-400" />
              </button>
            </div>
          )}

          {step === "select_expediente" && (
            <div className="px-2">
              <div className="px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <button onClick={() => setStep("action")} className="hover:text-blue-600">← Atrás</button>
                <span>/ Selecciona destino</span>
              </div>
              
              {loading ? (
                <div className="px-4 py-8 text-center text-slate-500 text-sm">Cargando expedientes...</div>
              ) : expedientes.length === 0 ? (
                <div className="px-4 py-8 text-center text-slate-500 text-sm">No hay expedientes. <button onClick={() => setStep("action")} className="text-indigo-400 font-bold underline">Vuelve y crea uno</button>.</div>
              ) : (
                <div className="space-y-1 mt-2">
                  {expedientes.filter(e => e.description.toLowerCase().includes(query.toLowerCase()) || e.id.includes(query)).map(exp => (
                    <button 
                      key={exp.id}
                      onClick={() => handleExpedienteSelect(exp.id)}
                      className="w-full text-left flex flex-col px-3 py-2.5 rounded-lg hover:bg-slate-800/50 text-slate-300 transition-colors"
                    >
                      <span className="font-bold text-sm text-slate-200">{exp.description}</span>
                      <span className="text-xs text-slate-500 font-mono mt-0.5">{exp.metadata?.radicado ? `Rad: ${exp.metadata.radicado}` : `EXP-${exp.id.substring(0,5).toUpperCase()}`}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
      </div>
    )}
      <NewExpedienteModal 
        isOpen={isExpedienteModalOpen} 
        onClose={() => setIsExpedienteModalOpen(false)}
        onSubmit={createNewExpediente}
        loading={loading}
      />
    </>
  );
}
