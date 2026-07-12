"use client";

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        login(data.user);
      } else {
        setError(data.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>
      
      <div className="relative z-10 w-full max-w-md p-8 bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[150%] h-40 bg-blue-500/20 blur-[100px] pointer-events-none"></div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">LexIA</h1>
          <p className="text-slate-400 mt-2 text-sm">Identificación Requerida para Acceder</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium text-center">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Usuario</label>
            <input 
              type="text" 
              required
              autoFocus
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              placeholder="Ej. admin"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Contraseña</label>
            <input 
              type="password" 
              required
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full mt-2 bg-white text-slate-900 font-bold text-sm px-4 py-3 rounded-xl hover:bg-slate-100 focus:ring-4 focus:ring-white/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Accediendo...
              </>
            ) : (
              'Ingresar al Despacho'
            )}
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500">Sistema Operativo Judicial - LexIA OS v1.0</p>
        </div>
      </div>
    </div>
  );
}
