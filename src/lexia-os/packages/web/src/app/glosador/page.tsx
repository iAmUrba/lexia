'use client';

import React, { useState, useEffect } from 'react';
import { Cloud, Server, ShieldCheck, AlertCircle, CheckCircle2, ChevronRight, Folder, RefreshCw, Layers, Database, FileText, Play, ChevronDown, Check } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { PageHeader, SectionTitle } from '@/components/UI/Typography';
import { Badge } from '@/components/UI/Badge';

interface DiagnosticResult {
  steps: {
    authenticated: boolean;
    tokenObtained: boolean;
    oneDriveFound: boolean;
    readPermissions: boolean;
    writePermissions: boolean;
  };
  account: string;
  firstFolders: string[];
  status: string;
}

export default function GlosadorPage() {
  const [loading, setLoading] = useState(false);
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inboxFiles, setInboxFiles] = useState<any[]>([]);
  const [inboxFolderName, setInboxFolderName] = useState<string | null>(null);
  const [processingFileId, setProcessingFileId] = useState<string | null>(null);
  const [processResults, setProcessResults] = useState<Record<string, any>>({});
  const [approvingFileId, setApprovingFileId] = useState<string | null>(null);
  const [approvalResults, setApprovalResults] = useState<Record<string, any>>({});

  const runDiagnostic = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3001/api/m365/diagnostic');
      if (res.ok) {
        const data = await res.json();
        setDiagnostic(data);
        await loadInbox();
      } else if (res.status === 401) {
        const loginRes = await fetch('http://localhost:3001/api/m365/login');
        const loginData = await loginRes.json();
        if (loginData.loginUrl) {
          window.location.href = loginData.loginUrl;
        }
      } else {
        const errData = await res.json();
        setError(errData.error || 'Error de red con Microsoft 365');
      }
    } catch (e: any) {
      setError(e.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const loadInbox = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/m365/inbox');
      if (res.ok) {
        const data = await res.json();
        setInboxFiles(data.files || []);
        setInboxFolderName(data.folderName);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const processFile = async (file: any) => {
    setProcessingFileId(file.id);
    try {
      const res = await fetch('http://localhost:3001/api/m365/process-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: file.id, fileName: file.name })
      });
      const data = await res.json();
      setProcessResults(prev => ({ ...prev, [file.id]: data }));
    } catch (e) {
      console.error(e);
      setProcessResults(prev => ({ ...prev, [file.id]: { error: 'Falló el procesamiento' } }));
    } finally {
      setProcessingFileId(null);
    }
  };

  const approveDecision = async (fileId: string) => {
    setApprovingFileId(fileId);
    const decisionEvent = processResults[fileId]?.proposedDecision;
    try {
      const res = await fetch('http://localhost:3001/api/m365/approve-decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(decisionEvent)
      });
      const data = await res.json();
      setApprovalResults(prev => ({ ...prev, [fileId]: data }));
    } catch (e) {
      console.error(e);
      setApprovalResults(prev => ({ ...prev, [fileId]: { error: 'Falló la aprobación' } }));
    } finally {
      setApprovingFileId(null);
    }
  };

  const StepItem = ({ label, passed }: { label: string, passed?: boolean }) => (
    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-800/50 hover:bg-slate-800/50 transition-colors">
      <div className="flex items-center gap-3">
        {passed === true && <div className="w-8 h-8 rounded-full bg-emerald-950/50 flex items-center justify-center border border-emerald-900/50"><CheckCircle2 className="text-emerald-500" size={16} /></div>}
        {passed === false && <div className="w-8 h-8 rounded-full bg-red-950/50 flex items-center justify-center border border-red-900/50"><AlertCircle className="text-red-500" size={16} /></div>}
        {passed === undefined && <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700" />}
        <span className={`font-medium ${passed ? 'text-slate-200' : passed === false ? 'text-red-400' : 'text-slate-500'}`}>
          {label}
        </span>
      </div>
      {passed !== undefined && (
        <Badge variant={passed ? "success" : "danger"}>{passed ? 'OK' : 'FALLÓ'}</Badge>
      )}
    </div>
  );

  const [folders, setFolders] = useState<any[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<any | null>(null);
  const [savingFolder, setSavingFolder] = useState(false);

  const loadFolders = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/m365/folders');
      if (res.ok) {
        const data = await res.json();
        setFolders(data.folders);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (diagnostic && diagnostic.steps.oneDriveFound) {
      loadFolders();
    }
  }, [diagnostic]);

  const saveInputFolder = async (folder: any) => {
    setSavingFolder(true);
    setSelectedFolder(folder);
    try {
      await fetch('http://localhost:3001/api/m365/set-input-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: folder.id, folderName: folder.name })
      });
      await loadInbox();
    } catch (e) {
      console.error('Error guardando carpeta', e);
    } finally {
      setSavingFolder(false);
    }
  };

  if (!diagnostic) {
    return (
      <div className="h-full w-full flex items-center justify-center p-6 relative overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
        
        <Card className="max-w-xl w-full relative z-10 p-1">
          <div className="bg-slate-900 rounded-[22px] p-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
              <Cloud className="w-10 h-10 text-indigo-400" />
            </div>
            
            <PageHeader 
              title="Conexión Institucional" 
              subtitle="Validaremos que LexIA tenga permisos en tu entorno corporativo." 
              className="mb-10 text-center"
            />
            
            {error && (
              <div className="w-full bg-red-950/50 border border-red-900/50 text-red-400 p-4 rounded-xl text-sm font-medium flex items-center gap-3 mb-8 text-left">
                <AlertCircle size={20} className="shrink-0" />
                <p>{error}</p>
              </div>
            )}
            
            <Button 
              onClick={runDiagnostic}
              disabled={loading}
              className="w-full py-4 text-lg flex items-center justify-center gap-3 group"
            >
              {loading ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <ShieldCheck className="w-6 h-6 group-hover:scale-110 transition-transform" />
              )}
              {loading ? 'Consultando Motor Graph...' : 'Conectar con Microsoft 365'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-8 custom-scrollbar relative">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-indigo-900/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-900/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-5xl mx-auto space-y-10 pb-20 relative z-10">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Server className="text-white" size={20} />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white">Centro de Comando</h1>
            </div>
            <p className="text-slate-400 font-medium">Panel de Diagnóstico y Configuración del Motor LexIA</p>
          </div>
          
          <div className={`px-6 py-3 rounded-2xl border backdrop-blur-md flex items-center gap-3 shadow-xl ${diagnostic.steps.oneDriveFound ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400' : 'bg-red-950/30 border-red-500/30 text-red-400'}`}>
            <div className={`w-3 h-3 rounded-full animate-pulse ${diagnostic.steps.oneDriveFound ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className="font-black tracking-widest text-sm uppercase">{diagnostic.status}</span>
          </div>
        </div>

        {inboxFolderName ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
               <h2 className="text-2xl font-black text-white flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                    <Layers className="text-indigo-400" size={20} />
                 </div>
                 Bandeja de Trabajo: {inboxFolderName}
               </h2>
               <Button onClick={loadInbox} variant="secondary" className="flex items-center gap-2">
                 <RefreshCw size={16} /> Refrescar
               </Button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {inboxFiles.map(file => {
                const result = processResults[file.id];
                const approval = approvalResults[file.id];
                const isProcessing = processingFileId === file.id;
                const isApproving = approvingFileId === file.id;

                return (
                  <Card key={file.id} className="p-6 bg-slate-900 border border-white/5 shadow-xl transition-all hover:border-indigo-500/30 group">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 shrink-0">
                          <FileText className="text-red-400" size={24} />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-slate-200 group-hover:text-white transition-colors">
                            {file.folderPath ? (
                              <span className="text-indigo-400/70 font-medium mr-1">{file.folderPath}/</span>
                            ) : null}
                            {file.name}
                          </h4>
                          <p className="text-sm text-slate-500 font-medium">PDF • {(file.size / 1024).toFixed(1)} KB • Última mod: {new Date(file.lastModifiedDateTime).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      {!result && (
                        <Button 
                          onClick={() => processFile(file)}
                          disabled={isProcessing}
                          className="w-full md:w-auto flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                          {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : <Play size={18} />}
                          {isProcessing ? 'Glosando...' : 'Procesar PDF'}
                        </Button>
                      )}
                      
                      {result && result.report && (
                         <Badge variant={result.report.estado === 'ENCONTRADO' ? 'success' : result.report.estado === 'MULTIPLE' ? 'warning' : 'danger'} className="text-sm px-4 py-2">
                            {result.report.estado}
                         </Badge>
                      )}
                    </div>
                    
                    {/* Cadena de Evidencias View */}
                    {result && !result.error && (
                      <div className="mt-6 pt-6 border-t border-white/5 animate-in slide-in-from-top-4 fade-in duration-500">
                        <SectionTitle color="indigo" className="mb-4">Cadena de Evidencias Extraída</SectionTitle>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                           <div className="lg:col-span-1 space-y-4">
                             <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Pistas Detectadas</div>
                                {result.evidence.radicados.length === 0 && result.evidence.procesados.length === 0 && result.evidence.spoa.length === 0 ? (
                                  <span className="text-slate-400 italic text-sm">Ninguna evidencia sólida detectada</span>
                                ) : (
                                  <ul className="space-y-2">
                                    {result.evidence.radicados.map((r: string, i: number) => <li key={`r${i}`} className="text-sm font-mono text-emerald-400 flex items-center gap-2"><Check size={14} /> RAD: {r}</li>)}
                                    {result.evidence.spoa.map((s: string, i: number) => <li key={`s${i}`} className="text-sm font-mono text-blue-400 flex items-center gap-2"><Check size={14} /> SPOA: {s}</li>)}
                                    {result.evidence.procesados.map((p: string, i: number) => <li key={`p${i}`} className="text-sm font-mono text-purple-400 flex items-center gap-2"><Check size={14} /> PERS: {p}</li>)}
                                  </ul>
                                )}
                             </div>
                             
                             <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Veredicto (Graph Search)</div>
                                <div className="text-sm font-medium text-slate-300">
                                   {result.report.estado === 'ENCONTRADO' ? (
                                    <span className="text-emerald-400 font-bold">🎯 Destino: {result.report.rutaExpediente}</span>
                                  ) : result.report.estado === 'MULTIPLE' ? (
                                    <span className="text-yellow-400 font-bold">⚠️ Múltiples opciones encontradas</span>
                                  ) : (
                                    <span className="text-red-400 font-bold">❌ Expediente no hallado en la nube</span>
                                  )}
                                </div>
                             </div>

                             {result.report.estado === 'ENCONTRADO' && !approval && (
                                <div className="pt-4">
                                  <Button 
                                    onClick={() => approveDecision(file.id)}
                                    disabled={isApproving}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 font-bold py-3"
                                  >
                                    {isApproving ? <RefreshCw size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                                    {isApproving ? 'Guardando...' : 'Aprobar y Archivar'}
                                  </Button>
                                </div>
                             )}

                             {approval && !approval.error && (
                               <div className="bg-emerald-950/40 p-4 rounded-xl border border-emerald-900/50 mt-4">
                                  <div className="text-emerald-400 font-bold flex items-center gap-2 mb-2">
                                    <CheckCircle2 size={18} /> ¡Aprobado Exitosamente!
                                  </div>
                                  <div className="text-xs text-slate-300">
                                    <strong>Plan:</strong> {approval.planHash?.substring(0, 8)}...<br/>
                                    <strong>DryRun Status:</strong> {approval.dryRunReport?.ready ? 'LISTO' : 'BLOQUEADO'}<br/>
                                    <strong>Operaciones:</strong> {approval.dryRunReport?.operations?.length || 0}
                                  </div>
                               </div>
                             )}
                             {approval?.error && (
                                <div className="mt-4 p-3 bg-red-950/30 text-red-400 text-sm font-medium rounded-lg border border-red-900/30">
                                  {approval.error}
                                </div>
                             )}
                           </div>
                           
                           <div className="lg:col-span-2">
                             <div className="h-full bg-slate-950 rounded-xl border border-white/5 p-4 relative group">
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-between">
                                  <span>Texto Crudo (OCR Digital)</span>
                                  <Badge variant="info">{result.textExtractedLength} chars</Badge>
                                </div>
                                <p className="text-xs font-mono text-slate-400 leading-relaxed whitespace-pre-wrap line-clamp-6 group-hover:line-clamp-none transition-all">
                                  {result.textPreview}...
                                </p>
                             </div>
                           </div>
                        </div>
                      </div>
                    )}
                    {result?.error && (
                      <div className="mt-4 p-3 bg-red-950/30 text-red-400 text-sm font-medium rounded-lg border border-red-900/30">
                        {result.error}
                      </div>
                    )}
                  </Card>
                );
              })}
              
              {inboxFiles.length === 0 && (
                <div className="bg-slate-900/50 border border-dashed border-slate-700 rounded-[32px] p-16 text-center">
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} className="text-emerald-500" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">Bandeja al día</h3>
                  <p className="text-slate-400 font-medium">No hay PDFs pendientes por glosar en {inboxFolderName}.</p>
                </div>
              )}
            </div>
          </div>
        ) : (

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Columna Izquierda: Identidad y Permisos (Estilo Compacto) */}
          <div className="xl:col-span-1 space-y-8">
            
            {/* Tarjeta de Identidad (Profile Card) */}
            <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-[32px] p-8 border border-white/5 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all" />
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-slate-950 border-4 border-slate-800 flex items-center justify-center mb-6 shadow-inner relative">
                  <div className="absolute inset-0 rounded-full border border-white/10" />
                  <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-indigo-400">
                    {diagnostic.account?.charAt(0) || '?'}
                  </span>
                </div>
                <Badge variant="info" className="mb-3 bg-blue-500/10 text-blue-400 border-blue-500/20 px-3 py-1">USUARIO CONECTADO</Badge>
                <h3 className="text-xl font-bold text-white mb-1 truncate w-full px-4">{diagnostic.account || 'Desconocida'}</h3>
                <p className="text-sm text-slate-500 font-medium">Microsoft 365 Tenant</p>
              </div>
            </div>

            {/* Checklist de Permisos (Estilo Terminal/Log) */}
            <div className="bg-black/40 backdrop-blur-xl rounded-[32px] border border-white/5 p-8 shadow-2xl">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <ShieldCheck size={16} className="text-indigo-500" />
                Matriz de Permisos
              </h3>
              
              <div className="space-y-4">
                <StepItem label="Autenticación base" passed={diagnostic.steps.authenticated} />
                <StepItem label="Token criptográfico" passed={diagnostic.steps.tokenObtained} />
                <StepItem label="Conexión OneDrive" passed={diagnostic.steps.oneDriveFound} />
                <StepItem label="Acceso de Lectura" passed={diagnostic.steps.readPermissions} />
                <StepItem label="Acceso de Escritura" passed={diagnostic.steps.writePermissions} />
              </div>
            </div>

          </div>

          {/* Columna Derecha: Contenido y Configuración */}
          <div className="xl:col-span-2 space-y-8">
            
            {/* Tarjeta de Carpetas Raíz (Estilo Data Grid) */}
            <div className="bg-slate-900/50 backdrop-blur-md rounded-[32px] border border-white/5 p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-black text-white mb-1">Estructura del Repositorio</h3>
                  <p className="text-sm text-slate-400">Primeras carpetas detectadas en la raíz del OneDrive</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/5">
                  <Database size={18} className="text-slate-400" />
                </div>
              </div>

              {diagnostic.firstFolders && diagnostic.firstFolders.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {diagnostic.firstFolders.slice(0, 6).map((f, i) => (
                    <div key={i} className="bg-slate-950/50 hover:bg-slate-800 transition-colors rounded-2xl p-4 border border-white/5 flex flex-col gap-3 group">
                      <Folder size={24} className="text-yellow-500/80 group-hover:text-yellow-400 transition-colors" />
                      <span className="text-sm font-bold text-slate-300 truncate" title={f}>{f}</span>
                    </div>
                  ))}
                  {diagnostic.firstFolders.length > 6 && (
                    <div className="bg-indigo-950/20 rounded-2xl p-4 border border-indigo-500/20 flex flex-col items-center justify-center gap-2">
                      <span className="text-2xl font-black text-indigo-400">+{diagnostic.firstFolders.length - 6}</span>
                      <span className="text-xs font-bold text-indigo-300 uppercase">Más</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-950/50 rounded-2xl p-12 border border-dashed border-slate-800 flex flex-col items-center justify-center text-center">
                  <Folder size={48} className="text-slate-700 mb-4" />
                  <p className="text-slate-500 font-medium">El OneDrive parece estar vacío.</p>
                </div>
              )}
            </div>

            {/* Configuración de Bandeja (Estilo Selector Interactivo) */}
            {diagnostic.steps.oneDriveFound && (
              <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 backdrop-blur-xl rounded-[32px] border border-indigo-500/20 p-8 shadow-[0_0_50px_rgba(79,70,229,0.1)] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
                  <Layers size={120} className="text-indigo-300" />
                </div>
                
                <div className="relative z-10">
                  <h3 className="text-2xl font-black text-white mb-2">Bandeja de Entrada LexIA</h3>
                  <p className="text-indigo-200/70 text-sm font-medium mb-8 max-w-lg">
                    Esta es la carpeta crítica. LexIA monitoreará los PDFs que sueltes aquí para extraer el radicado y enviarlos automáticamente a su expediente correspondiente.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {folders.map((folder: any) => (
                      <button
                        key={folder.id}
                        onClick={() => saveInputFolder(folder)}
                        disabled={savingFolder}
                        className={`flex items-center gap-4 p-5 rounded-2xl text-left transition-all duration-300 ${
                          selectedFolder?.id === folder.id 
                            ? 'bg-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.4)] border border-indigo-400 text-white transform -translate-y-1' 
                            : 'bg-slate-950/50 hover:bg-slate-900/80 border border-white/5 hover:border-indigo-500/30 text-slate-300'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${selectedFolder?.id === folder.id ? 'bg-white/20' : 'bg-slate-800'}`}>
                          <Folder size={18} className={selectedFolder?.id === folder.id ? 'text-white' : 'text-slate-400'} />
                        </div>
                        <span className="truncate font-bold text-sm flex-1">{folder.name}</span>
                        {selectedFolder?.id === folder.id && (
                          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0">
                            <CheckCircle2 size={14} className="text-indigo-600" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
        )}
      </div>
    </div>
  );
}
