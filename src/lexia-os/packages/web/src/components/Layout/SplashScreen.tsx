"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
  // Por defecto es true para que el servidor (y el primer render del cliente) renderice la pantalla negra.
  // Así evitamos que se vea el dashboard primero y luego salte el splash.
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Verificar si ya se mostró en esta sesión
    const hasSeenSplash = sessionStorage.getItem("lexia_splash_seen");
    
    if (hasSeenSplash) {
      // Si ya lo vio, lo ocultamos inmediatamente sin animaciones.
      setIsVisible(false);
    } else {
      
      // Marcar como visto para futuras recargas
      sessionStorage.setItem("lexia_splash_seen", "true");

      // Iniciar el fade out a los 2.5 segundos
      const fadeOutTimer = setTimeout(() => {
        setIsFadingOut(true);
      }, 2500);

      // Desmontar el componente completamente a los 3 segundos
      const removeTimer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);

      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(removeTimer);
      };
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950 transition-opacity duration-500 ease-in-out ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}
      style={{ pointerEvents: 'none' }} // Evitar que bloquee clicks si algo falla
    >
      <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in-75 duration-1000 fill-mode-forwards delay-150">
        <div className="relative">
          {/* Brillo detrás del logo */}
          <div className="absolute inset-0 bg-blue-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
          
          <div className="relative flex items-center gap-4">
            <span className="text-6xl md:text-8xl animate-bounce" style={{ animationDuration: '3s' }}>✨</span>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white drop-shadow-2xl">
              Lex<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">IA</span>
            </h1>
          </div>
        </div>
        
        <p className="text-blue-300/80 font-bold tracking-[0.3em] uppercase text-sm md:text-lg animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
          Asistente Jurídico Inteligente
        </p>
      </div>

      {/* Línea de "carga" en la parte inferior */}
      <div className="absolute bottom-16 w-48 h-1 bg-slate-800 rounded-full overflow-hidden opacity-50">
        <div className="h-full bg-blue-500 w-full animate-[progress_2.5s_ease-in-out_forwards]" style={{ transformOrigin: 'left' }}></div>
      </div>
      
      {/* Animación custom para la barra de progreso */}
      <style jsx>{`
        @keyframes progress {
          0% { transform: scaleX(0); }
          50% { transform: scaleX(0.7); }
          100% { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}
