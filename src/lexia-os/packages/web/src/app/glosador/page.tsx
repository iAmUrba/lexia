'use client';

import React, { useState, useEffect } from 'react';
import { Cloud, Server, ShieldCheck, AlertCircle, CheckCircle2, ChevronRight, Folder } from 'lucide-react';

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

  const runDiagnostic = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3001/api/m365/diagnostic');
      if (res.ok) {
        const data = await res.json();
        setDiagnostic(data);
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

  const StepItem = ({ label, passed }: { label: string, passed?: boolean }) => (
    <div className="flex items-center gap-3 py-2">
      {passed === true && <CheckCircle2 className="text-green-500" size={20} />}
      {passed === false && <AlertCircle className="text-red-500" size={20} />}
      {passed === undefined && <div className="w-5 h-5 rounded-full border-2 border-slate-200" />}
      <span className={`font-medium ${passed ? 'text-slate-800' : passed === false ? 'text-red-600' : 'text-slate-400'}`}>
        {label}
      </span>
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
      alert(`Carpeta '${folder.name}' guardada correctamente como bandeja de entrada.`);
    } catch (e) {
      alert('Error guardando carpeta');
    } finally {
      setSavingFolder(false);
    }
  };

  if (!diagnostic) {

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
          <div className="bg-slate-900 p-8 text-white text-center">
            <Cloud className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h1 className="text-3xl font-black">Conexión Institucional</h1>
          </div>
          <div className="p-8 text-center space-y-6">
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-bold flex flex-col items-center gap-2">
                <AlertCircle size={24} />
                {error}
              </div>
            )}
            <p className="text-slate-600 font-medium">
              Validaremos que LexIA tenga permisos en tu entorno corporativo.
            </p>
            <button 
              onClick={runDiagnostic}
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-lg disabled:opacity-50"
            >
              {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ShieldCheck size={24} />}
              {loading ? 'Consultando Graph API...' : 'Conectar con Microsoft 365'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
      <div className="max-w-3xl w-full space-y-6">
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-200">
          <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
            <Server className="text-blue-600" /> Diagnóstico de Viabilidad
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Checklist M365</h3>
              <StepItem label="Usuario autenticado" passed={diagnostic.steps.authenticated} />
              <StepItem label="Token obtenido" passed={diagnostic.steps.tokenObtained} />
              <StepItem label="OneDrive institucional detectado" passed={diagnostic.steps.oneDriveFound} />
              <StepItem label="Permisos de lectura verificados" passed={diagnostic.steps.readPermissions} />
              <StepItem label="Permisos de escritura verificados" passed={diagnostic.steps.writePermissions} />
            </div>

            <div className="space-y-6 border-l border-slate-100 pl-8">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cuenta Activa</div>
                <div className="font-mono text-sm bg-slate-100 px-3 py-1 rounded inline-block mt-1 font-bold text-slate-700">
                  {diagnostic.account || 'Desconocida'}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Primeras carpetas en la raíz</div>
                {diagnostic.firstFolders && diagnostic.firstFolders.length > 0 ? (
                  <div className="space-y-2">
                    {diagnostic.firstFolders.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm font-medium text-slate-600">
                        <Folder size={14} className="text-yellow-500" /> {f}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-400 italic">No se encontraron carpetas.</div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className={`p-4 rounded-xl font-black text-center ${diagnostic.steps.oneDriveFound ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              ESTADO FINAL: {diagnostic.status}
            </div>
          </div>

          {diagnostic.steps.oneDriveFound && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm mb-4">
                Configuración Inicial: Seleccione la Bandeja de Entrada Diaria
              </h3>
              <p className="text-slate-500 text-sm font-medium mb-4">LexIA descargará los PDFs nuevos de esta carpeta. Solo debes configurarlo una vez.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {folders.map((folder: any) => (
                  <button
                    key={folder.id}
                    onClick={() => saveInputFolder(folder)}
                    disabled={savingFolder}
                    className={`flex items-center gap-2 p-4 rounded-xl border text-left transition-all ${
                      selectedFolder?.id === folder.id 
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-md ring-2 ring-blue-500/20' 
                        : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-sm text-slate-700'
                    }`}
                  >
                    <Folder size={20} className={selectedFolder?.id === folder.id ? 'text-blue-500' : 'text-yellow-400 shrink-0'} />
                    <span className="truncate font-bold text-sm">{folder.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
