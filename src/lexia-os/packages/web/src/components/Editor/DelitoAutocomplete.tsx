import { useState, useEffect, useRef } from "react";
import { apiFetch } from "../../lib/apiClient";
import { Trash2 } from "lucide-react";

interface DelitoAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onRemove?: () => void;
  showRemove?: boolean;
}

export default function DelitoAutocomplete({ value, onChange, onRemove, showRemove }: DelitoAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sincronizar input local con prop externa
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue && document.activeElement === wrapperRef.current?.querySelector('input')) {
        fetchOptions(inputValue);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const fetchOptions = async (query: string) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/delitos?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setOptions(data);
      if (data.length > 0) setIsOpen(true);
    } catch (e) {
      console.error("Error fetching delitos", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (delito: any) => {
    const newValue = `${delito.nombre} (${delito.articulo})`;
    setInputValue(newValue);
    onChange(newValue);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    onChange(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  return (
    <div className="flex items-center gap-2 relative group w-full" ref={wrapperRef}>
      <div className="relative flex-1">
        <input
          required
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (inputValue) fetchOptions(inputValue);
            else fetchOptions(""); // Traer top 10 si está vacío
          }}
          className="w-full px-3 py-2 bg-slate-950/50 border border-slate-700/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-200"
          placeholder="Ej. SECUESTRO EXTORSIVO"
        />
        
        {isOpen && options.length > 0 && (
          <div className="absolute z-[101] w-full mt-1 bg-slate-900 border border-slate-700/50 rounded-lg shadow-xl max-h-60 overflow-y-auto">
            {options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelect(opt)}
                className="w-full text-left px-4 py-2 hover:bg-slate-800 border-b border-slate-800 last:border-0 transition-colors flex flex-col group/item"
              >
                <span className="font-bold text-slate-300 group-hover/item:text-blue-400">{opt.nombre}</span>
                <span className="text-xs text-slate-500 font-mono">{opt.articulo}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {showRemove && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-950/50 rounded-lg transition-colors shrink-0"
          title="Eliminar delito"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}
