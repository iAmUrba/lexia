"use client";

import React, { useState, useRef } from "react";
import { X, UploadCloud, File, GripVertical, Trash2 } from "lucide-react";
import { PDFDocument } from "pdf-lib";

interface MergePdfModalProps {
  onClose: () => void;
}

export default function MergePdfModal({ onClose }: MergePdfModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [outputName, setOutputName] = useState("LexIA_Documentos_Unidos");
  const [isProcessing, setIsProcessing] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter((file) => file.type === "application/pdf");
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files).filter((file) => file.type === "application/pdf");
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const removeFile = (indexToRemove: number) => {
    setFiles(files.filter((_, idx) => idx !== indexToRemove));
  };

  // Lógica de Drag & Drop para reordenar la lista
  const handleDragStartItem = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOverItem = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newFiles = [...files];
    const draggedItem = newFiles[draggedIndex];
    newFiles.splice(draggedIndex, 1);
    newFiles.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    setFiles(newFiles);
  };

  const handleDragEndItem = () => {
    setDraggedIndex(null);
  };

  const mergePdfs = async () => {
    if (files.length < 2) {
      alert("Por favor, selecciona al menos 2 PDFs para unir.");
      return;
    }

    setIsProcessing(true);
    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.download = `${outputName.trim() || "Documentos_Unidos"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      onClose(); // Cerrar el modal tras descargar
    } catch (error) {
      console.error("Error uniendo PDFs:", error);
      alert("Ocurrió un error al unir los documentos. Revisa si alguno está protegido con contraseña.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="text-blue-500">✨</span> Unir PDFs
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Selecciona o arrastra los PDFs que deseas combinar. Puedes arrastrarlos para cambiar el orden.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Dropzone */}
          <div 
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100 hover:border-blue-400 transition-colors cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="bg-white p-4 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
              <UploadCloud className="text-blue-500" size={32} />
            </div>
            <p className="text-slate-700 font-semibold">Haz clic o arrastra PDFs aquí</p>
            <p className="text-xs text-slate-400 mt-1">El procesamiento es 100% local y seguro.</p>
            <input 
              type="file" 
              multiple 
              accept="application/pdf" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-700 mb-3">Orden de los documentos ({files.length})</h3>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div 
                    key={`${file.name}-${index}`}
                    draggable
                    onDragStart={() => handleDragStartItem(index)}
                    onDragOver={(e) => handleDragOverItem(e, index)}
                    onDragEnd={handleDragEndItem}
                    className={`flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm cursor-grab active:cursor-grabbing transition-transform ${draggedIndex === index ? 'opacity-50 scale-95' : 'hover:border-blue-300 hover:shadow-md'}`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="text-slate-400 cursor-grab active:cursor-grabbing hover:text-slate-600">
                        <GripVertical size={16} />
                      </div>
                      <div className="p-2 bg-red-50 text-red-500 rounded flex-shrink-0">
                        <File size={16} />
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-semibold text-slate-700 truncate">{file.name}</p>
                        <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFile(index)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors ml-2 flex-shrink-0"
                      title="Quitar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Configuración Final */}
          {files.length > 0 && (
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl space-y-2">
              <label className="block text-sm font-bold text-slate-700">Nombre del archivo resultante:</label>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={outputName}
                  onChange={(e) => setOutputName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-medium text-slate-700"
                  placeholder="Ej. Anexos_Demanda"
                />
                <span className="text-slate-500 text-sm font-medium bg-white px-3 py-2 border border-slate-200 rounded-lg shadow-sm">.pdf</span>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={mergePdfs}
            disabled={files.length < 2 || isProcessing}
            className={`px-6 py-2 font-bold text-white rounded-lg transition-all shadow-md flex items-center gap-2
              ${files.length < 2 || isProcessing ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:scale-95'}`}
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Procesando...
              </>
            ) : (
              'Unir y Descargar'
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
