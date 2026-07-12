import { useState, useEffect } from "react";
import { apiFetch } from "../../lib/apiClient";
import { X, Plus, Trash2 } from "lucide-react";
import DelitoAutocomplete from "./DelitoAutocomplete";

interface EditExpedienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  expedienteData: any;
  onUpdated: () => void;
}

export interface ProcesadoData {
  nombre: string;
  cedula: string;
  detenido: boolean;
  defensor: {
    nombre: string;
    tipo: "confianza" | "publico";
    tp?: string;
    cedula?: string;
    telefono?: string;
  };
}

export interface ExpedienteFormData {
  radicado: string;
  delitos: string[];
  procesados: ProcesadoData[];
  demandante: string;
  fiscal: { nombre: string; despacho: string; seccional: string; };
  ministerio_publico: { nombre: string; despacho: string; };
  victimas?: string;
  representante_victimas?: string;
}

const initialProcesado: ProcesadoData = {
  nombre: "",
  cedula: "",
  detenido: false,
  defensor: {
    nombre: "",
    tipo: "confianza",
    tp: "",
    cedula: "",
    telefono: ""
  }
};

export default function EditExpedienteModal({ isOpen, onClose, expedienteData, onUpdated }: EditExpedienteModalProps) {
  const [loading, setLoading] = useState(false);
  const md = expedienteData?.work?.metadata || {};

  const [formData, setFormData] = useState<ExpedienteFormData>({
    radicado: md.radicado || "",
    delitos: md.delitos?.length ? md.delitos : [""],
    procesados: md.procesados?.length ? md.procesados : [{ ...initialProcesado, defensor: { ...initialProcesado.defensor } }],
    demandante: md.demandante || "",
    fiscal: md.fiscal || { nombre: "", despacho: "", seccional: "" },
    ministerio_publico: md.ministerio_publico || { nombre: "", despacho: "" },
    victimas: md.victimas || "",
    representante_victimas: md.representante_victimas || ""
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleNestedChange = (parent: 'fiscal' | 'ministerio_publico', field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const handleProcesadoChange = (index: number, field: keyof ProcesadoData, value: any) => {
    setFormData(prev => {
      const newProcesados = [...prev.procesados];
      newProcesados[index] = { ...newProcesados[index], [field]: value };
      return { ...prev, procesados: newProcesados };
    });
  };

  const handleDefensorChange = (procesadoIndex: number, field: keyof ProcesadoData['defensor'], value: any) => {
    setFormData(prev => {
      const newProcesados = [...prev.procesados];
      newProcesados[procesadoIndex] = {
        ...newProcesados[procesadoIndex],
        defensor: { ...newProcesados[procesadoIndex].defensor, [field]: value }
      };
      return { ...prev, procesados: newProcesados };
    });
  };

  const copyDefensorFromFirst = (procesadoIndex: number) => {
    setFormData(prev => {
      if (prev.procesados.length <= 1) return prev;
      const newProcesados = [...prev.procesados];
      const firstDefensor = prev.procesados[0].defensor;
      newProcesados[procesadoIndex] = {
        ...newProcesados[procesadoIndex],
        defensor: { ...firstDefensor }
      };
      return { ...prev, procesados: newProcesados };
    });
  };

  const addDelito = () => {
    setFormData(prev => ({
      ...prev,
      delitos: [...prev.delitos, ""]
    }));
  };

  const removeDelito = (index: number) => {
    setFormData(prev => {
      if (prev.delitos.length <= 1) return prev;
      const newDelitos = [...prev.delitos];
      newDelitos.splice(index, 1);
      return { ...prev, delitos: newDelitos };
    });
  };

  const handleDelitoChange = (index: number, value: string) => {
    setFormData(prev => {
      const newDelitos = [...prev.delitos];
      newDelitos[index] = value;
      return { ...prev, delitos: newDelitos };
    });
  };

  const addProcesado = () => {
    setFormData(prev => ({
      ...prev,
      procesados: [...prev.procesados, { ...initialProcesado, defensor: { ...initialProcesado.defensor } }]
    }));
  };

  const removeProcesado = (index: number) => {
    setFormData(prev => {
      if (prev.procesados.length === 1) return prev; // Siempre debe haber al menos uno
      const newProcesados = [...prev.procesados];
      newProcesados.splice(index, 1);
      return { ...prev, procesados: newProcesados };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch(`/api/tutelas/${expedienteData.work.id}/metadata`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onUpdated();
      } else {
        alert("Error actualizando expediente");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-900/90 backdrop-blur-2xl rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-700/50 shadow-black/50">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50 shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-200 tracking-tight">Editar Expediente</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Juzgado 3 Penal Especializado</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-300 bg-slate-800 hover:bg-slate-700 shadow-sm border border-slate-700 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
          <form id="new-expediente-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Información General */}
            <div>
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="w-6 h-1 bg-indigo-500 rounded-full"></span> Información General
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Radicado del Proceso *</label>
                  <input required type="text" name="radicado" value={formData.radicado} onChange={handleChange} className="w-full px-4 py-3 bg-slate-950/50 backdrop-blur-sm border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-200 font-medium shadow-inner" placeholder="Ej. 11001310900320230000100" />
                </div>
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Delitos *</label>
                    <button 
                      type="button" 
                      onClick={addDelito}
                      className="flex items-center gap-1.5 text-[10px] font-black text-indigo-400 hover:text-indigo-300 bg-indigo-950/50 px-3 py-1.5 rounded-lg border border-indigo-900/50 transition-colors uppercase tracking-wider"
                    >
                      <Plus size={12} /> Añadir Delito
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.delitos.map((delito, index) => (
                      <DelitoAutocomplete
                        key={`delito-${index}`}
                        value={delito}
                        onChange={(val) => handleDelitoChange(index, val)}
                        onRemove={() => removeDelito(index)}
                        showRemove={formData.delitos.length > 1}
                      />
                    ))}
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Demandante / Denunciante</label>
                  <input type="text" name="demandante" value={formData.demandante} onChange={handleChange} className="w-full px-4 py-3 bg-slate-950/50 backdrop-blur-sm border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-200 font-medium shadow-inner" placeholder="Nombre completo" />
                </div>
                {/* Fiscal */}
                <div className="col-span-2 bg-slate-800/30 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50 shadow-sm shadow-black/20">
                  <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Datos de Fiscalía</h4>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nombre del Fiscal *</label>
                      <input required type="text" value={formData.fiscal.nombre} onChange={(e) => handleNestedChange('fiscal', 'nombre', e.target.value)} className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-200 font-medium text-sm shadow-inner" placeholder="Nombre completo" />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Fiscalía (Despacho) *</label>
                      <input required type="text" value={formData.fiscal.despacho} onChange={(e) => handleNestedChange('fiscal', 'despacho', e.target.value)} className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-200 font-medium text-sm shadow-inner" placeholder="Ej. Fiscalía 15 Especializada" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Seccional *</label>
                      <input required type="text" value={formData.fiscal.seccional} onChange={(e) => handleNestedChange('fiscal', 'seccional', e.target.value)} className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-200 font-medium text-sm shadow-inner" placeholder="Ej. Bogotá" />
                    </div>
                  </div>
                </div>

                {/* Ministerio Público */}
                <div className="col-span-2 bg-slate-800/30 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50 shadow-sm shadow-black/20">
                  <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-4">Datos de Ministerio Público</h4>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nombre del Procurador *</label>
                      <input required type="text" value={formData.ministerio_publico.nombre} onChange={(e) => handleNestedChange('ministerio_publico', 'nombre', e.target.value)} className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-slate-200 font-medium text-sm shadow-inner" placeholder="Nombre completo" />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Procuraduría (Despacho) *</label>
                      <input required type="text" value={formData.ministerio_publico.despacho} onChange={(e) => handleNestedChange('ministerio_publico', 'despacho', e.target.value)} className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-slate-200 font-medium text-sm shadow-inner" placeholder="Ej. Procuraduría 12" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Procesados y Defensores */}
            <div className="pt-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-6 h-1 bg-emerald-500 rounded-full"></span> Procesados e Información de Defensa
                </h3>
                <button 
                  type="button" 
                  onClick={addProcesado}
                  className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 hover:text-emerald-300 bg-emerald-950/50 px-3 py-1.5 rounded-lg border border-emerald-900/50 transition-colors uppercase tracking-wider"
                >
                  <Plus size={14} /> Añadir procesado
                </button>
              </div>

              <div className="space-y-6">
                {formData.procesados.map((proc, index) => (
                  <div key={index} className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 p-6 rounded-3xl relative group shadow-sm">
                    
                    {formData.procesados.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeProcesado(index)}
                        className="absolute top-6 right-6 text-slate-500 hover:text-red-400 p-2 rounded-xl hover:bg-red-950/50 hover:shadow-sm border border-transparent hover:border-red-900/50 transition-all opacity-0 group-hover:opacity-100 bg-slate-900"
                        title="Eliminar procesado"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-5">Procesado #{index + 1}</h4>
                    
                    <div className="grid grid-cols-2 gap-5 mb-5">
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nombre Completo *</label>
                        <input required type="text" value={proc.nombre} onChange={(e) => handleProcesadoChange(index, "nombre", e.target.value)} className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-200 font-medium text-sm shadow-inner" placeholder="Nombre completo del procesado" />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Cédula *</label>
                        <input required type="text" value={proc.cedula} onChange={(e) => handleProcesadoChange(index, "cedula", e.target.value)} className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-200 font-medium text-sm shadow-inner" placeholder="No. de documento" />
                      </div>
                      <div className="col-span-2 flex items-center gap-3 mt-2">
                        <input type="checkbox" id={`detenido-${index}`} checked={proc.detenido} onChange={(e) => handleProcesadoChange(index, "detenido", e.target.checked)} className="w-5 h-5 text-emerald-500 rounded border-slate-600 bg-slate-900 focus:ring-emerald-500 shadow-sm" />
                        <label htmlFor={`detenido-${index}`} className="text-sm font-bold text-slate-300 cursor-pointer">¿El procesado se encuentra detenido / privado de la libertad?</label>
                      </div>
                    </div>

                    <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-700/50 shadow-sm shadow-black/20">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span>Abogado Defensor</span>
                        {index > 0 && (
                          <button 
                            type="button" 
                            onClick={() => copyDefensorFromFirst(index)}
                            className="text-[10px] bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors ml-2 font-black tracking-wider uppercase"
                          >
                            Copiar del Procesado #1
                          </button>
                        )}
                        <select 
                          value={proc.defensor.tipo}
                          onChange={(e) => handleDefensorChange(index, "tipo", e.target.value)}
                          className="ml-auto text-xs font-black uppercase tracking-wider border border-slate-700 rounded-xl px-3 py-1.5 outline-none focus:border-emerald-500 text-slate-300 bg-slate-800 shadow-sm"
                        >
                          <option value="confianza">De Confianza (Privado)</option>
                          <option value="publico">Defensor Público</option>
                        </select>
                      </h4>
                      <div className="grid grid-cols-2 gap-5">
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nombre Completo *</label>
                          <input required type="text" value={proc.defensor.nombre} onChange={(e) => handleDefensorChange(index, "nombre", e.target.value)} className="w-full px-4 py-2 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-200 font-medium text-sm shadow-inner" placeholder="Nombre del abogado" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tarjeta Profesional (T.P)</label>
                          <input type="text" value={proc.defensor.tp} onChange={(e) => handleDefensorChange(index, "tp", e.target.value)} className="w-full px-4 py-2 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-200 font-medium text-sm shadow-inner" placeholder="Opcional" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Cédula Abogado</label>
                          <input type="text" value={proc.defensor.cedula} onChange={(e) => handleDefensorChange(index, "cedula", e.target.value)} className="w-full px-4 py-2 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-200 font-medium text-sm shadow-inner" placeholder="Opcional" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Teléfono / Celular</label>
                          <input type="text" value={proc.defensor.telefono} onChange={(e) => handleDefensorChange(index, "telefono", e.target.value)} className="w-full px-4 py-2 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-200 font-medium text-sm shadow-inner" placeholder="Opcional" />
                        </div>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6">
              <h3 className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="w-6 h-1 bg-amber-500 rounded-full"></span> Otros Sujetos Procesales (Opcional)
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Víctima(s)</label>
                  <input type="text" name="victimas" value={formData.victimas} onChange={handleChange} className="w-full px-4 py-3 bg-slate-950/50 backdrop-blur-sm border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all text-slate-200 font-medium shadow-inner" placeholder="Nombres separados por coma" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Rep. de Víctimas</label>
                  <input type="text" name="representante_victimas" value={formData.representante_victimas} onChange={handleChange} className="w-full px-4 py-3 bg-slate-950/50 backdrop-blur-sm border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all text-slate-200 font-medium shadow-inner" placeholder="Nombre completo" />
                </div>
              </div>
            </div>
            
          </form>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-800 bg-slate-950/50 flex justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} className="px-6 py-2.5 font-bold text-slate-400 hover:text-slate-200 bg-slate-800 shadow-sm border border-slate-700 hover:bg-slate-700 rounded-xl transition-all">
            Cancelar
          </button>
          <button type="submit" form="new-expediente-form" disabled={loading} className="px-8 py-2.5 font-black text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2 uppercase tracking-widest text-sm border border-indigo-500">
            {loading ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>

      </div>
    </div>
  );
}
