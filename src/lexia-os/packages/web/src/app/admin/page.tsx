"use client";

import { useState } from "react";
import { PageLayout } from "@/components/Layout/PageLayout";
import { Card } from "@/components/UI/Card";
import { Button } from "@/components/UI/Button";
import { Badge } from "@/components/UI/Badge";

type Tab = 'usuarios' | 'despachos' | 'seguridad' | 'sistema';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('usuarios');

  const tabs = [
    { id: 'usuarios', label: '👥 Usuarios' },
    { id: 'despachos', label: '🏢 Despachos' },
    { id: 'seguridad', label: '🔐 Seguridad' },
    { id: 'sistema', label: '⚙️ Sistema' },
  ];

  const headerContent = (
    <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-white/10 shadow-lg backdrop-blur-md">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as Tab)}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === tab.id
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  return (
    <PageLayout 
      title="Centro de Control." 
      subtitle="Administración global del Sistema Operativo LexIA."
      headerContent={headerContent}
    >
      
      {activeTab === 'usuarios' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xl font-black text-slate-200">Directorio de Usuarios</h3>
            <Button variant="secondary">+ Nuevo Funcionario</Button>
          </div>
          
          <Card variant="glass" className="p-6">
            <div className="text-center py-12">
              <div className="text-5xl mb-4 grayscale opacity-40">👥</div>
              <h4 className="text-lg font-bold text-slate-300">Gestión de Usuarios Activa</h4>
              <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
                Aquí podrás crear cuentas para jueces, secretarios y sustanciadores, y asignarles un despacho específico.
              </p>
              <div className="mt-8 flex justify-center gap-4">
                <Badge variant="success">Modulo en construcción</Badge>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'despachos' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xl font-black text-slate-200">Organigrama de Despachos</h3>
            <Button variant="secondary">+ Nuevo Despacho</Button>
          </div>
          
          <Card variant="glass" className="p-6">
            <div className="text-center py-12">
              <div className="text-5xl mb-4 grayscale opacity-40">🏢</div>
              <h4 className="text-lg font-bold text-slate-300">Infraestructura Judicial</h4>
              <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
                Administra los juzgados, configura las plantillas globales y define la especialidad de cada despacho.
              </p>
              <div className="mt-8 flex justify-center gap-4">
                <Badge variant="warning">Modulo en construcción</Badge>
              </div>
            </div>
          </Card>
        </div>
      )}

      {(activeTab === 'seguridad' || activeTab === 'sistema') && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-6 grayscale opacity-20">🚧</div>
          <h2 className="text-2xl font-black text-slate-400">Próximamente</h2>
          <p className="text-slate-600 mt-2">Esta sección del Sistema Operativo se encuentra en desarrollo.</p>
        </div>
      )}

    </PageLayout>
  );
}
