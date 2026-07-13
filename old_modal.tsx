import { useState, useEffect, useRef } from "react";
import { DocumentTemplate, templatesCatalog, generateProseMirrorContent } from "../../lib/templateEngine";
import { useAuth } from '../../contexts/AuthContext';
import { apiFetch } from "../../lib/apiClient";
interface NewDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (title: string, content: any) => void;
  initialTemplateId?: string | null;
  expedienteData?: any;
}

export default function NewDocumentModal({ isOpen, onClose, onGenerate, initialTemplateId, expedienteData }: NewDocumentModalProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(initialTemplateId || null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isExtracting, setIsExtracting] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingDocument, setIsGeneratingDocument] = useState(false);
  const { user } = useAuth();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    const fData = new FormData();
    fData.append("file", file);

    try {
      const res = await apiFetch("/api/ocr/extract-reason", {
        method: "POST",
        body: fData
      });
      const data = await res.json();
      
      setFormData(prev => {
        const newData = { ...prev };
        if (data.motivo) newData.motivo = data.motivo;
        if (data.fecha_solicitud) newData.fecha_solicitud = data.fecha_solicitud;
        if (data.quien_solicito) newData.quien_solicito = [data.quien_solicito];
        return newData;
      });
    } catch (err) {
      console.error(err);
      alert("Error analizando evidencia con IA");
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // When opened with an initial template
  useEffect(() => {
    if (isOpen && initialTemplateId) {
      setSelectedTemplateId(initialTemplateId);
    } else if (!isOpen) {
      setSelectedTemplateId(null);
    }
  }, [isOpen, initialTemplateId]);

  if (!isOpen) return null;

  const categories = ["Resoluciones", "Secretaría", "Notificaciones"] as const;
  
  const selectedTemplate = templatesCatalog.find(t => t.id === selectedTemplateId);

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const parseHtmlToAst = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const paragraphs: any[] = [];
    
    doc.body.childNodes.forEach(node => {
      if (node.nodeName === 'P' || node.nodeName === 'DIV') {
        const pElement = node as HTMLElement;
        const align = pElement.style.textAlign || 'left';
        
        const runs: any[] = [];
        pElement.childNodes.forEach(child => {
          if (child.nodeType === Node.TEXT_NODE) {
            if (child.textContent?.trim() || child.textContent === ' ') {
              runs.push({ text: child.textContent, bold: false });
            }
          } else if (child.nodeName === 'STRONG' || child.nodeName === 'B') {
            runs.push({ text: child.textContent, bold: true });
          } else if (child.nodeName === 'BR') {
            runs.push({ text: '\n', bold: false });
          } else if (child.nodeName === 'IMG') {
            // Ignoramos la imagen por ahora para que no rompa el DOCX
          }
        });
        
        paragraphs.push({ type: 'paragraph', align, runs });
      }
    });
    
    return paragraphs;
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) return;
    setIsGeneratingDocument(true);
    
    // 1. Raw draft
    const rawContent = generateProseMirrorContent(selectedTemplate, formData, expedienteData, user);
    
    try {
      // 2. AI Supervisor
      const res = await apiFetch("/api/ai/verify-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ htmlContent: rawContent })
      });
      const data = await res.json();
      const finalContent = data.verifiedHtml || rawContent;
      
      // 3. Convertir a AST
      const ast = parseHtmlToAst(finalContent);
      
      // 4. Generar DOCX en Backend
      const docxRes = await apiFetch("/api/ai/export-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paragraphs: ast })
      });
      
      if (!docxRes.ok) throw new Error("Error exportando DOCX");
      
      const blob = await docxRes.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTemplate.name.replace(/\s+/g, '_')}_${Date.now()}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      // No llamamos a onGenerate con contenido porque no queremos abrir el editor
      onGenerate(selectedTemplate.name, ""); 
    } catch (err) {
      console.error(err);
      alert("Hubo un error al generar el documento.");
    } finally {
      setIsGeneratingDocument(false);
      onClose();
      setSelectedTemplateId(null);
      setFormData({});
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-900/90 backdrop-blur-2xl rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-700/50 shadow-black/50">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50 shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-200 tracking-tight">Crear Nuevo Documento</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              {expedienteData ? `Expediente: ${expedienteData.work.metadata?.radicado || 'Sin Radicado'}` : 'Seleccione una plantilla para comenzar'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-300 bg-slate-800 hover:bg-slate-700 shadow-sm border border-slate-700 rounded-full transition-all">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
            })}
          </div>

          {/* Main Area - Formulario */}
          <div className="w-2/3 p-8 overflow-y-auto bg-transparent custom-scrollbar">
            {!selectedTemplate ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <div className="w-16 h-16 bg-slate-800/60 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-slate-700/50">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                </div>
                <p className="font-bold tracking-wide">Selecciona una plantilla para comenzar</p>
              </div>
            ) : (
              <div>
                <h3 className="text-2xl font-black text-slate-200 mb-2 tracking-tight">{selectedTemplate.name}</h3>
                <p className="text-sm font-medium text-slate-400 mb-6">{selectedTemplate.description}</p>

                <div className="mb-8 bg-indigo-950/30 backdrop-blur-sm border border-indigo-900/50 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2 mb-1">
                        <span className="text-base">✨</span> Autocompletar con LexIA
                      </h4>
                      <p className="text-xs font-bold text-indigo-300/60 mt-1">Sube la excusa o correo y LexIA llenará la fecha, el solicitante y el motivo por ti.</p>
                    </div>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isAnalyzing}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-black uppercase tracking-widest px-4 py-2.5 rounded-xl text-[10px] transition-all flex items-center gap-2 shadow-md hover:shadow-lg border border-indigo-500"
                    >
                      {isAnalyzing ? (
                        <><span className="animate-pulse">Analizando...</span></>
                      ) : (
                        <>Subir Evidencia</>
                      )}
                    </button>
                  </div>
                </div>

                {selectedTemplate.fields.length > 0 ? (
                  <div className="space-y-6">
                    {selectedTemplate.fields.map(field => (
                      <div key={field.name} className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{field.label}</label>
                        
                        {field.type === "text" && (
                          <input type="text" 
                            className="bg-slate-950/50 backdrop-blur-sm border border-slate-700/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-200 font-medium shadow-inner transition-all" 
                            placeholder={field.placeholder}
                            value={formData[field.name] || ""}
                            onChange={e => handleFieldChange(field.name, e.target.value)}
                          />
                        )}
                        
                        {field.type === "date" && (
                          <input type="date" 
                            className="bg-slate-950/50 backdrop-blur-sm border border-slate-700/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-200 font-medium shadow-inner transition-all" 
                            value={formData[field.name] || ""}
                            onChange={e => handleFieldChange(field.name, e.target.value)}
                          />
                        )}

                        {field.type === "time" && (
                          <div className="flex items-center gap-2">
                            <select 
                              className="bg-slate-950/50 backdrop-blur-sm border border-slate-700/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-200 font-medium shadow-inner transition-all"
                              value={(formData[field.name] || "08:00").split(':')[0]}
                              onChange={e => {
                                const h = e.target.value;
                                const currentM = (formData[field.name] || "08:00").split(':')[1] || "00";
                                handleFieldChange(field.name, `${h}:${currentM}`);
                              }}
                            >
                              {Array.from({length: 24}).map((_, i) => {
                                const val = i.toString().padStart(2, '0');
                                let display = i % 12;
                                if (display === 0) display = 12;
                                const ampm = i < 12 ? 'AM' : 'PM';
                                return <option key={val} value={val}>{display} {ampm}</option>;
                              })}
                            </select>
                            <span className="font-black text-slate-500">:</span>
                            <select
                              className="bg-slate-950/50 backdrop-blur-sm border border-slate-700/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-200 font-medium shadow-inner transition-all"
                              value={(formData[field.name] || "08:00").split(':')[1]}
                              onChange={e => {
                                const m = e.target.value;
                                const currentH = (formData[field.name] || "08:00").split(':')[0] || "08";
                                handleFieldChange(field.name, `${currentH}:${m}`);
                              }}
                            >
                              {Array.from({length: 12}).map((_, i) => {
                                const m = (i * 5).toString().padStart(2, '0');
                                return <option key={m} value={m}>{m}</option>;
                              })}
                            </select>
                          </div>
                        )}

                        {field.type === "select" && (
                          <select 
                            className="bg-slate-950/50 backdrop-blur-sm border border-slate-700/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-200 font-medium shadow-inner transition-all"
                            value={formData[field.name] || ""}
                            onChange={e => handleFieldChange(field.name, e.target.value)}
                          >
                            <option value="">Seleccione...</option>
                            {field.options?.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        )}

                        {field.type === "textarea" && (
                          <textarea 
                            className="bg-slate-950/50 backdrop-blur-sm border border-slate-700/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none text-slate-200 font-medium shadow-inner transition-all" 
                            placeholder={field.placeholder}
                            value={formData[field.name] || ""}
                            onChange={e => handleFieldChange(field.name, e.target.value)}
                          />
                        )}

                        {field.type === "multiselect" && (
                          <div className="flex flex-col gap-2 mt-1">
                            {field.options?.map(opt => {
                              const checked = (formData[field.name] || []).includes(opt.value);
                              return (
                                <label key={opt.value} className="flex items-center gap-3 cursor-pointer text-slate-300 group">
                                  <input 
                                    type="checkbox" 
                                    className="w-5 h-5 text-indigo-500 rounded border-slate-600 bg-slate-900 focus:ring-indigo-500 shadow-sm transition-colors"
                                    checked={checked}
                                    onChange={(e) => {
                                      const current = formData[field.name] || [];
                                      if (e.target.checked) {
                                        handleFieldChange(field.name, [...current, opt.value]);
                                      } else {
                                        handleFieldChange(field.name, current.filter((v: string) => v !== opt.value));
                                      }
                                    }}
                                  />
                                  <span className="font-bold group-hover:text-indigo-400 transition-colors">{opt.label}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}

                        {field.type === "textarea-ai" && (
                          <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <button 
                                type="button"
                                onClick={() => {
                                  setCurrentAiField(field.name);
                                  fileInputRef.current?.click();
                                }}
                                disabled={isExtracting[field.name]}
                                className="bg-indigo-950/30 hover:bg-indigo-900/50 text-indigo-400 font-bold px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-colors border border-indigo-900/50"
                              >
                                {isExtracting[field.name] ? (
                                  <span className="animate-pulse">Extrayendo...</span>
                                ) : (
                                  <>
                                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                    Extraer de Evidencia
                                  </>
                                )}
                              </button>

                              <button 
                                type="button"
                                onClick={async () => {
                                  const rawText = formData[field.name];
                                  if (!rawText || rawText.trim() === "") return;
                                  setIsExtracting(prev => ({ ...prev, [`${field.name}-formalize`]: true }));
                                  try {
                                    const res = await apiFetch("/api/ai/formalize-text", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ text: rawText })
                                    });
                                    const data = await res.json();
                                    if (data.formalized) {
                                      handleFieldChange(field.name, data.formalized);
                                    } else if (data.error) {
                                      alert("Error de IA: " + data.error);
                                    }
                                  } catch (err) {
                                    alert("Error conectando con la IA");
                                  } finally {
                                    setIsExtracting(prev => ({ ...prev, [`${field.name}-formalize`]: false }));
                                  }
                                }}
                                disabled={isExtracting[`${field.name}-formalize`] || !formData[field.name]}
                                className={`font-black uppercase tracking-widest px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-2 transition-all ${!formData[field.name] ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50' : 'bg-indigo-950/50 hover:bg-indigo-900/50 text-indigo-400 border border-indigo-900/50'}`}
                              >
                                {isExtracting[`${field.name}-formalize`] ? (
                                  <span className="animate-pulse">Pensando...</span>
                                ) : (
                                  <>✨ Redactar jurídicamente</>
                                )}
                              </button>
                            </div>
                            <textarea 
                              className="bg-slate-950/50 backdrop-blur-sm border border-slate-700/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none text-slate-200 font-medium shadow-inner transition-all" 
                              placeholder={field.placeholder}
                              value={formData[field.name] || ""}
                              onChange={e => handleFieldChange(field.name, e.target.value)}
                            />
                          </div>
                        )}

                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 text-center text-slate-500 font-bold shadow-sm">
                    Esta plantilla no requiere configuración inicial.
                  </div>
                )}

                <div className="mt-10 flex justify-end gap-3 pt-6 border-t border-slate-800">
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} />
                  <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 shadow-sm transition-all">
                    Cancelar
                  </button>
                  <button onClick={handleGenerate} disabled={isGeneratingDocument} className="px-8 py-2.5 rounded-xl font-black text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:shadow-none border border-indigo-500 uppercase tracking-widest text-[10px] flex items-center gap-2">
                    {isGeneratingDocument ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Redactando con IA...
                      </>
                    ) : (
                      "Generar Documento"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
