import { FileText, FileDown, CheckCircle, Clock, Plus, Copy } from "lucide-react";

interface DocumentListSidebarProps {
  documents: {
    id: string;
    title: string;
    state: string;
    date: string;
    active?: boolean;
  }[];
  onNewDocument: () => void;
  onSelectDocument: (id: string) => void;
  onDuplicate: (id: string) => void;
  isCoverActive?: boolean;
}

export default function DocumentListSidebar({ documents, onNewDocument, onSelectDocument, onDuplicate, isCoverActive }: DocumentListSidebarProps) {
  return (
    <div className="w-72 shrink-0 bg-slate-900/60 backdrop-blur-md border border-slate-700/50 h-[calc(100vh-100px)] sticky top-6 flex flex-col rounded-3xl shadow-xl shadow-black/20 overflow-hidden relative z-20 ml-2">
      <div className="p-5 border-b border-slate-700/50 bg-slate-950/50 backdrop-blur-md flex items-center justify-between">
        <h2 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
          <FileText size={14} className="text-indigo-500" /> Documentos
        </h2>
        <button 
          onClick={onNewDocument}
          className="text-indigo-400 hover:text-indigo-300 p-1 hover:bg-indigo-950/50 rounded transition-colors"
          title="Nuevo Documento"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <button 
          onClick={() => onSelectDocument('cover')}
          className={`w-full text-left p-4 rounded-2xl border flex flex-col gap-1 transition-all duration-300 group ${isCoverActive ? 'bg-slate-800/80 backdrop-blur-xl border-slate-600 shadow-lg shadow-black/30 scale-[1.02]' : 'border-transparent hover:bg-slate-800/60 hover:border-slate-700/50'}`}
        >
          <div className="flex items-start justify-between gap-2">
            <span className={`font-black text-sm tracking-tight line-clamp-2 ${isCoverActive ? 'text-indigo-300' : 'text-slate-400 group-hover:text-indigo-400'}`}>
              Portada del Expediente
            </span>
          </div>
          <div className="flex items-center mt-2">
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${isCoverActive ? 'bg-indigo-950/50 text-indigo-400 border border-indigo-900/50' : 'bg-slate-900/50 text-slate-500 border border-slate-800'}`}>
              Información
            </span>
          </div>
        </button>
        
        {documents.length > 0 && <div className="h-px bg-slate-700/50 my-3 mx-4" />}

        {documents.map(doc => (
          <div key={doc.id} className="relative group/item">
            <button 
              onClick={() => onSelectDocument(doc.id)}
              className={`w-full text-left p-4 rounded-2xl border flex flex-col gap-1 transition-all duration-300 group ${doc.active ? 'bg-slate-800/80 backdrop-blur-xl border-slate-600 shadow-lg shadow-black/30 scale-[1.02]' : 'border-transparent hover:bg-slate-800/60 hover:border-slate-700/50'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`font-bold text-sm tracking-tight line-clamp-2 pr-4 ${doc.active ? 'text-indigo-300 font-black' : 'text-slate-400 group-hover:text-indigo-400'}`}>
                  {doc.title || "Documento"}
                </span>
                {doc.state === 'Firmado' && <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5 drop-shadow-sm" />}
                {doc.state === 'Borrador' && <Clock size={16} className="text-slate-500 shrink-0 mt-0.5" />}
                {doc.state === 'Proyectado' && <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0 mt-1 shadow-sm shadow-blue-400/50" />}
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border ${doc.state === 'Proyectado' ? 'bg-blue-950/50 text-blue-400 border-blue-900/50' : doc.state === 'Firmado' ? 'bg-emerald-950/50 text-emerald-400 border-emerald-900/50' : 'bg-slate-900/50 text-slate-500 border-slate-800'}`}>
                  {doc.state}
                </span>
                <span className="text-[10px] text-slate-500 font-bold bg-slate-900/50 px-1.5 py-0.5 rounded border border-slate-800">{doc.date}</span>
              </div>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDuplicate(doc.id); }}
              className="absolute right-3 top-3 p-1.5 bg-slate-800 text-slate-400 hover:text-indigo-400 border border-slate-700 rounded-lg shadow-md opacity-0 group-hover/item:opacity-100 transition-all hover:-translate-y-0.5"
              title="Duplicar Documento"
            >
              <Copy size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
