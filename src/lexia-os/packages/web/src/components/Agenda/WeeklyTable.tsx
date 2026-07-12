"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { apiFetch } from "../../lib/apiClient";

interface AgendaEvent {
  id: string;
  hour: string; // e.g. "08:00", "09:00", etc.
  dayOfWeek: number; // 1 (Lunes) to 5 (Viernes)
  title: string; // e.g. "Juicio Oral"
  radicado: string; // e.g. "11001..."
  description: string;
}

interface WeeklyTableProps {
  currentDate: Date;
}

export default function WeeklyTable({ currentDate }: WeeklyTableProps) {
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);

  // Generar los 5 días de la semana (Lunes a Viernes) basados en currentDate
  const startOfWeek = new Date(currentDate);
  const day = startOfWeek.getDay(); // 0 is Sunday, 1 is Monday
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
  startOfWeek.setDate(diff);

  const weekDays = [0, 1, 2, 3, 4].map(i => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return d;
  });

  const hours = ["08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"];

  useEffect(() => {
    setIsClient(true);
    fetchAgenda();
  }, [currentDate]); // Recargar al cambiar de semana o fecha

  const fetchAgenda = async () => {
    try {
      const res = await apiFetch("/api/agenda");
      if (res.ok) {
        const json = await res.json();
        const allEvents = json.data || [];
        
        // Mapear al formato que espera la tabla
        const mappedEvents: AgendaEvent[] = allEvents.map((evt: any) => {
          const d = new Date(evt.datetime);
          
          let hh = d.getHours();
          
          // Ajustes manuales para que encaje en la cuadrícula básica (12 PM -> 02 PM)
          if (hh === 12 || hh === 13) hh = 14; 
          
          const ampm = hh >= 12 ? 'PM' : 'AM';
          let displayHh = hh > 12 ? hh - 12 : hh;
          if (displayHh === 0) displayHh = 12;
          
          const hStr = String(displayHh).padStart(2, "0");
          let hourSlot = `${hStr}:00 ${ampm}`;
          
          // dayOfWeek en JS: 1 (Lunes) a 5 (Viernes)
          const evtDayOfWeek = d.getDay(); 
          
          // Map the status to a display title
          let displayTitle = "Pendiente";
          if (evt.status === "completado") displayTitle = "✔ Completado";
          else if (evt.status === "notificado") displayTitle = "Notificado";

          return {
            id: evt.id,
            hour: hourSlot,
            dayOfWeek: evtDayOfWeek,
            title: displayTitle,
            radicado: "",
            description: evt.description,
            rawDate: d // para filtrar por semana
          };
        });

        // Filtrar solo los eventos que caen en la semana actual
        const start = new Date(weekDays[0]);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(weekDays[4]);
        end.setHours(23, 59, 59, 999);

        const currentWeekEvents = mappedEvents.filter((e: any) => {
          return e.rawDate >= start && e.rawDate <= end;
        });

        setEvents(currentWeekEvents);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addEvent = (dayOfWeek: number, hour: string) => {
    const title = prompt("Tipo de audiencia:");
    if (!title) return;
    const radicado = prompt("Radicado:");
    const newEvent: AgendaEvent = {
      id: Math.random().toString(36).substring(7),
      hour,
      dayOfWeek,
      title,
      radicado: radicado || "",
      description: ""
    };
    setEvents([...events, newEvent]);
  };

  const removeEvent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("¿Eliminar esta audiencia?")) {
      setEvents(events.filter(ev => ev.id !== id));
    }
  };

  const getEventsForSlot = (dayOfWeek: number, hour: string) => {
    return events.filter(e => e.dayOfWeek === dayOfWeek && e.hour === hour);
  };

  const daysNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  if (!isClient) return <div className="p-8 text-center animate-pulse text-slate-500">Cargando agenda...</div>;

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl overflow-x-auto" id="agenda-export-area">
      <table className="w-full text-left border-collapse min-w-[800px] border-hidden">
        <thead>
          <tr>
            <th className="w-24 border-b border-r border-slate-700/50 bg-slate-950/50 backdrop-blur-md py-4 px-4 text-xs font-black text-slate-300 uppercase tracking-widest text-center shadow-sm">Hora</th>
            {weekDays.map((date, idx) => (
              <th key={idx} className="border-b border-r border-slate-700/50 bg-slate-950/50 backdrop-blur-md py-4 px-4 text-center shadow-sm">
                <div className="text-sm font-black text-slate-200 tracking-tight">{daysNames[idx]}</div>
                <div className="text-xs font-bold text-slate-500 mt-1">{date.getDate()}/{date.getMonth() + 1}/{date.getFullYear()}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hours.map(hour => (
            <tr key={hour}>
              <td className="border-b border-r border-slate-700/50 py-4 px-4 text-center align-top bg-slate-900/30 backdrop-blur-sm">
                <span className="text-xs font-black text-slate-400">{hour}</span>
              </td>
              {[1, 2, 3, 4, 5].map(dayOfWeek => {
                const slotEvents = getEventsForSlot(dayOfWeek, hour);
                return (
                  <td 
                    key={dayOfWeek} 
                    className="border-b border-r border-slate-700/50 p-2 align-top h-28 hover:bg-slate-800/50 transition-all duration-300 group cursor-pointer relative bg-slate-900/10"
                    onClick={() => addEvent(dayOfWeek, hour)}
                  >
                    <div className="flex flex-col gap-2 h-full">
                      {slotEvents.map(ev => (
                        <div 
                          key={ev.id} 
                          className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-xl p-2.5 relative group/event hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50 hover:border-slate-600 transition-all duration-300 cursor-pointer shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(ev);
                          }}
                        >
                          <button 
                            onClick={(e) => removeEvent(ev.id, e)}
                            className="absolute top-1 right-1 text-slate-500 hover:text-red-400 opacity-0 group-hover/event:opacity-100 transition-opacity bg-slate-900 shadow-sm border border-slate-700/50 rounded p-1"
                          >
                            <Trash2 size={12} />
                          </button>
                          <div className={`text-[9px] font-black uppercase mb-1.5 tracking-widest ${ev.title.includes('✔') ? 'text-emerald-500' : (ev.title === 'Notificado' ? 'text-purple-400' : 'text-blue-400')}`}>{ev.title}</div>
                          <div className="text-[11px] font-bold text-slate-200 leading-snug line-clamp-3" title={ev.description}>{ev.description || ev.title}</div>
                          {ev.radicado && <div className="text-[10px] text-indigo-400 font-black mt-2 font-mono bg-indigo-950/50 rounded px-1.5 py-0.5 inline-block">{ev.radicado}</div>}
                        </div>
                      ))}
                      {slotEvents.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <span className="text-xs text-indigo-400 font-black flex items-center gap-1 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-lg shadow-black/50 border border-slate-700"><Plus size={14}/> Agendar</span>
                        </div>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal Detalles de Audiencia */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-700/50 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <h3 className="text-xl font-black text-slate-200 tracking-tight">Detalles de Audiencia</h3>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-500 hover:text-slate-300 bg-slate-800 shadow-sm hover:shadow-md transition-all border border-slate-700 rounded-full w-8 h-8 flex items-center justify-center font-bold">✕</button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex gap-4 items-center">
                <div className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white p-4 rounded-2xl shadow-lg shadow-indigo-500/20">
                  <div className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Hora</div>
                  <div className="text-2xl font-black tracking-tighter">{selectedEvent.hour}</div>
                </div>
                <div>
                  <span className={`inline-block px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm
                    ${selectedEvent.title.includes('✔') ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/50' : (selectedEvent.title === 'Notificado' ? 'bg-purple-950/50 text-purple-400 border border-purple-900/50' : 'bg-amber-950/50 text-amber-400 border border-amber-900/50')}`}>
                    {selectedEvent.title}
                  </span>
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50 shadow-inner">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Descripción Completa</h4>
                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                  {selectedEvent.description}
                </p>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-950/50 border-t border-slate-800 flex justify-end">
              <button 
                onClick={() => setSelectedEvent(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
