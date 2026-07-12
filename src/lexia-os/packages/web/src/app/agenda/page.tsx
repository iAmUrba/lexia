"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import WeeklyTable from "@/components/Agenda/WeeklyTable";
import { ChevronLeft, ChevronRight, FileDown } from "lucide-react";
import { apiFetch } from "@/lib/apiClient";

function AgendaPageContent() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');
  
  // Si nos pasan una fecha por la URL, abrimos esa semana. Si no, usamos la fecha y hora actual real.
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    if (dateParam) return new Date(dateParam);
    return new Date(); // Fecha actual real
  });

  // Si el parametro date cambia, actualizamos el estado
  useEffect(() => {
    if (dateParam) {
      setCurrentDate(new Date(dateParam));
    }
  }, [dateParam]);

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const handleExportDocx = async () => {
    // 1. We determine the start of the current week (Monday)
    const startDate = new Date(currentDate);
    const day = startDate.getDay(); // 0 is Sunday, 1 is Monday
    const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
    startDate.setDate(diff);
    const startStr = startDate.toISOString().split('T')[0];
    const monthStr = `${monthNames[startDate.getMonth()].toUpperCase()} ${startDate.getFullYear()}`;
    
    // We get the actual events fetched by WeeklyTable?
    // Wait, WeeklyTable fetches the events inside itself. We can't access them here easily unless we move the state up.
    // Wait! WeeklyTable has `const [events, setEvents] = useState<AgendaEvent[]>([]);`
    // Alternatively, AgendaPage can just fetch the whole agenda again and pass it to the backend. It's tiny anyway.
    try {
      const res = await apiFetch("/api/agenda");
      const json = await res.json();
      const allEvents = json.data || [];
      
      const exportRes = await apiFetch("/api/agenda/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_date: startStr,
          month_str: monthStr,
          events: allEvents
        })
      });

      if (!exportRes.ok) throw new Error("Error al exportar");

      const blob = await exportRes.blob();
      const url = window.URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = `Agenda_${startStr}.docx`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Error exportando a DOCX");
    }
  };

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent relative">
      
      {/* Background Effects */}
      <div className="absolute top-0 left-0 right-0 h-64 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-500 rounded-full blur-3xl opacity-10"></div>
      </div>

      {/* Header Sticky */}
      <header className="relative z-10 bg-transparent px-8 py-8 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl border border-slate-700/50 hover:bg-slate-700">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-md flex items-center gap-3">
              <span className="text-blue-300">🗓</span> Agenda Semanal
            </h1>
            <p className="text-slate-400 font-medium mt-1">Programación de audiencias y eventos</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={handleExportDocx}
            className="flex items-center gap-2 bg-slate-900 text-indigo-400 font-black px-5 py-2.5 rounded-xl text-sm border border-slate-700/50 hover:bg-slate-800 hover:-translate-y-0.5 transition-all shadow-lg hover:shadow-xl hover:shadow-black/50"
          >
            <FileDown size={18} /> Exportar DOCX
          </button>
          
          <div className="flex items-center bg-slate-900/60 backdrop-blur-md rounded-xl p-1.5 border border-slate-700/50 shadow-lg">
            <button onClick={handlePrevWeek} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-300"><ChevronLeft size={18} /></button>
            <span className="px-6 text-sm font-black text-slate-200 min-w-[140px] text-center tracking-wider uppercase">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button onClick={handleNextWeek} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-300"><ChevronRight size={18} /></button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-8 pb-8 relative z-10 custom-scrollbar mt-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 bg-slate-900/60 backdrop-blur-md border border-slate-800 shadow-xl shadow-black/20 rounded-2xl p-5 flex gap-4 text-slate-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none"></div>
            <div className="text-2xl filter drop-shadow-sm mt-0.5">💡</div>
            <div className="text-sm">
              <strong className="text-slate-200 font-black block mb-1">¿Cómo usar la agenda?</strong> 
              <span className="font-medium text-slate-400">Haz clic en cualquier recuadro de la tabla para programar una nueva audiencia. Puedes borrarla pasando el mouse por encima y haciendo clic en la papelera.</span>
            </div>
          </div>
          
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-xl shadow-black/50 p-2 overflow-hidden">
            <WeeklyTable currentDate={currentDate} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AgendaPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-slate-500">Cargando agenda...</div>}>
      <AgendaPageContent />
    </Suspense>
  );
}
