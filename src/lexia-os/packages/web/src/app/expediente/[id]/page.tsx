"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import LexiaEditor from "../../../components/Editor/LexiaEditor";
import { apiFetch } from "../../../lib/apiClient";

import DocumentListSidebar from "../../../components/Editor/DocumentListSidebar";
import NewDocumentModal from "../../../components/Editor/NewDocumentModal";
import ExpedienteCover from "../../../components/Editor/ExpedienteCover";
import { formatRadicado } from "../../../utils/formatters";

interface DomainEvent {
  eventId: string;
  type: string;
  occurredAt: string;
  payload: any;
}

interface DocDetail {
  id: string;
  title: string;
  state: string;
  content: any;
  createdAt: string;
}

interface ExpedienteDetail {
  work: {
    id: string;
    description: string;
    state: string;
    createdAt: string;
    metadata?: any;
  };
  documents: DocDetail[];
  events: DomainEvent[];
}

export default function ExpedienteView() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id as string;
  const newDocTemplate = searchParams.get("newDoc");

  const [data, setData] = useState<ExpedienteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [draftContent, setDraftContent] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<"clean" | "dirty" | "saving" | "saved">("clean");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchExpediente();
    if (newDocTemplate) {
      setIsModalOpen(true);
      router.replace(`/expediente/${id}`);
    }
  }, [id, newDocTemplate]);

  const fetchExpediente = async (newDocId?: string) => {
    try {
      const res = await apiFetch(`/api/tutelas/${id}`);
      if (!res.ok) throw new Error("Not found");
      const json = await res.json();
      setData(json);
      
      if (json.documents && json.documents.length > 0) {
        let targetDoc = json.documents.find((d: any) => d.id === newDocId);
        if (!targetDoc) {
           targetDoc = activeDocId && activeDocId !== 'cover' ? json.documents.find((d: any) => d.id === activeDocId) : null;
        }
        if (!targetDoc && activeDocId !== 'cover') targetDoc = json.documents[0];
        
        if (targetDoc) {
          setActiveDocId(targetDoc.id);
          setDraftContent(targetDoc.content);
          setSaveStatus("clean");
        } else if (activeDocId === 'cover') {
          setDraftContent(null);
        }
      } else {
        setActiveDocId('cover');
        setDraftContent(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEditorChange = (content: any) => {
    setDraftContent(content);
    setSaveStatus("dirty");
  };

  const handleSave = async () => {
    if (!draftContent || !activeDocId) return;
    setSaveStatus("saving");
    try {
      const res = await apiFetch(`/api/tutelas/${id}/documentos/${activeDocId}/guardar`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: draftContent })
      });
      if (res.ok) {
        setSaveStatus("saved");
        setLastSaved(new Date());
        fetchExpediente(activeDocId);
      } else {
        setSaveStatus("dirty");
      }
    } catch (e) {
      console.error(e);
      setSaveStatus("dirty");
    }
  };

  const handleNewDocument = async (title: string, content: any) => {
    // Si el contenido está vacío, significa que el modal ya exportó directamente el DOCX y no queremos guardarlo en la web.
    if (!content) return;
    
    try {
      const res = await apiFetch(`/api/tutelas/${id}/documentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
      });
      if (res.ok) {
        const result = await res.json();
        fetchExpediente(result.docId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectDocument = (docId: string) => {
    if (saveStatus === "dirty") {
      if (!confirm("Tienes cambios sin guardar. ¿Quieres cambiar de documento de todos modos?")) return;
    }
    if (docId === 'cover') {
      setActiveDocId('cover');
      setDraftContent(null);
      setSaveStatus("clean");
      return;
    }
    const doc = data?.documents.find(d => d.id === docId);
    if (doc) {
      setActiveDocId(doc.id);
      setDraftContent(doc.content);
      setSaveStatus("clean");
    }
  };

  const handleDuplicate = async (docId: string) => {
    const docToDuplicate = data?.documents.find(d => d.id === docId);
    if (!docToDuplicate) return;

    try {
      const res = await apiFetch(`/api/tutelas/${id}/documentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: `${docToDuplicate.title} (Copia)`, 
          content: docToDuplicate.content 
        })
      });
      if (res.ok) {
        const result = await res.json();
        fetchExpediente(result.docId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteDocument = async () => {
    if (!activeDocId) return;
    if (!confirm("¿Estás seguro de que quieres eliminar este borrador? Esta acción no se puede deshacer.")) return;
    
    try {
      const res = await apiFetch(`http://127.0.0.1:3001/api/tutelas/${id}/documentos/${activeDocId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchExpediente(); // fetchExpediente se encargará de seleccionar el primer doc disponible
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportDocx = () => {
    if (!activeDocId) return;
    const doc = data?.documents.find(d => d.id === activeDocId);
    if (!doc) return;
    
    const preHtml = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title></head><body>";
    const postHtml = "</body></html>";
    const html = preHtml + doc.content + postHtml;

    const blob = new Blob(['\ufeff', html], {
        type: 'application/msword'
    });
    
    const url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(html);
    const downloadLink = document.createElement("a");
    document.body.appendChild(downloadLink);
    
    downloadLink.href = url;
    downloadLink.download = `${doc.title.replace(/\s+/g, '_')}.doc`;
    downloadLink.click();
    
    document.body.removeChild(downloadLink);
  };

  if (loading) return (
    <div className="h-full flex flex-col bg-slate-50 relative p-8">
      <div className="animate-pulse space-y-8 max-w-5xl mx-auto w-full">
        <div className="h-20 bg-slate-200 rounded-xl w-full"></div>
        <div className="h-32 bg-slate-200 rounded-xl w-full"></div>
      </div>
    </div>
  );
  if (!data) return (
    <div className="h-full flex flex-col items-center justify-center bg-slate-50 relative p-8 text-center">
      <div className="text-6xl mb-4">🗂️</div>
      <h2 className="text-xl font-bold text-slate-900">Expediente no encontrado</h2>
      <p className="text-slate-500 mt-2 mb-6">El expediente que intentas buscar no existe o fue eliminado.</p>
      <Link href="/" className="bg-blue-600 text-white font-bold px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
        Volver al Dashboard
      </Link>
    </div>
  );

  const docsList = data.documents.map(d => ({
    id: d.id,
    title: d.title,
    state: d.state,
    date: new Date(d.createdAt).toLocaleDateString(),
    active: d.id === activeDocId
  }));

  const activeDoc = data.documents.find(d => d.id === activeDocId);

  return (
    <div className="h-screen flex flex-col bg-slate-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-500 rounded-full blur-3xl opacity-20"></div>
      </div>
      
      <NewDocumentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        initialTemplateId={newDocTemplate}
        onGenerate={handleNewDocument} 
        expedienteData={data}
      />

      {/* Header Sticky */}
      <header className="relative z-10 bg-transparent px-8 py-5 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/expedientes" className="text-blue-200 hover:text-white transition-colors bg-white/10 p-2 rounded-xl backdrop-blur-sm border border-white/10 hover:bg-white/20">
            ← Volver
          </Link>
          <div>
            <div className="text-[10px] font-black text-blue-200 uppercase tracking-widest flex items-center gap-2 mb-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${data.work.state === 'Proyectado' ? 'bg-amber-400' : data.work.state === 'Firmado' ? 'bg-emerald-400' : 'bg-blue-300'}`}></span> {data.work.state}
            </div>
            <h1 className="text-xl font-black tracking-tight text-white drop-shadow-md leading-tight">
              {data.work.metadata?.radicado ? `Rad. ${formatRadicado(data.work.metadata.radicado)}` : `EXP-${new Date(data.work.createdAt).getFullYear()}-${data.work.id.substring(0,5).toUpperCase()}`}
            </h1>
          </div>
        </div>

        {activeDoc && activeDocId !== 'cover' && (
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-1.5 pr-2 rounded-2xl border border-white/20 shadow-lg">
            <div className="flex items-center gap-2 mr-2 px-3">
              {saveStatus === "dirty" && <span className="text-xs text-amber-300 font-bold flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span>Sin guardar</span>}
              {saveStatus === "saving" && <span className="text-xs text-slate-300 flex items-center gap-1">Guardando...</span>}
              {saveStatus === "saved" && lastSaved && <span className="text-xs text-emerald-300 font-bold flex items-center gap-1">✓ Guardado</span>}
              {saveStatus === "clean" && <span className="text-xs text-slate-300 font-medium">Actualizado</span>}
            </div>

            <div className="text-[10px] font-black uppercase tracking-widest text-blue-200 flex items-center gap-2 mr-2 border-l border-white/20 pl-4 py-1">
              <button onClick={handleExportPDF} className="hover:text-white transition-colors flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2 py-1 rounded">PDF</button>
              <button onClick={handleExportDocx} className="hover:text-white transition-colors flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2 py-1 rounded">DOCX</button>
              <button onClick={handleDeleteDocument} className="text-red-300 hover:text-red-100 transition-colors bg-white/5 hover:bg-red-500/20 px-2 py-1 rounded">Eliminar</button>
            </div>

            <button 
              onClick={handleSave}
              disabled={saveStatus === "clean" || saveStatus === "saving" || saveStatus === "saved"}
              className="bg-white text-indigo-700 font-black px-5 py-1.5 rounded-xl text-sm hover:bg-blue-50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
            >
              Guardar
            </button>
          </div>
        )}
      </header>

      {/* Main Workspace (3 columns) */}
      <div className="flex-1 flex overflow-hidden relative z-10 px-2 pb-2 gap-2">
        
        <DocumentListSidebar 
          documents={docsList} 
          isCoverActive={activeDocId === 'cover'}
          onNewDocument={() => setIsModalOpen(true)}
          onSelectDocument={handleSelectDocument}
          onDuplicate={handleDuplicate}
        />

        <div className="flex-1 overflow-y-auto bg-slate-50/50 backdrop-blur-sm rounded-2xl border border-white shadow-xl shadow-slate-200/50 flex flex-col relative">
          {activeDocId === 'cover' || !activeDoc ? (
            <ExpedienteCover data={data} onNewDocument={() => setIsModalOpen(true)} onUpdate={() => fetchExpediente('cover')} />
          ) : (
            <div className="w-full max-w-4xl relative mt-6 mx-auto pb-12">
              <LexiaEditor 
                // key forces re-render if we switch document IDs so tiptap reinitializes content correctly
                key={activeDocId}
                initialContent={draftContent || ""} 
                onChange={handleEditorChange} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
