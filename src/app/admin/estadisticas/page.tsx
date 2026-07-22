'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function EstadisticasPage() {
  const router = useRouter();
  const [asistentes, setAsistentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarAsistentes();
  }, []);

  const cargarAsistentes = async () => {
    try {
      const res = await apiFetch('/api/asistentes');
      if (res.ok) {
        const data = await res.json();
        setAsistentes(data);
      } else if (res.status === 401) {
        router.push('/login');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      </div>
    );
  }

  const totalRecaudado = asistentes.reduce((sum, a) => sum + (a.monto || 0), 0);
  const pagoEfectivo = asistentes.filter(a => a.metodo_pago === 'efectivo').reduce((sum, a) => sum + (a.monto || 0), 0);
  const pagoTransf = asistentes.filter(a => a.metodo_pago === 'transferencia').reduce((sum, a) => sum + (a.monto || 0), 0);
  
  const totalPersonas = asistentes.length;
  const presentes = asistentes.filter(a => a.estado === 'presente').length;
  const ausentes = totalPersonas - presentes;

  const sillasOcupadas = asistentes.filter(a => a.mesa !== null).length;
  const comidaServida = asistentes.filter(a => a.comida_servida).length;

  const dataMetodos = [
    { name: 'Efectivo', value: pagoEfectivo },
    { name: 'Transferencia', value: pagoTransf },
  ];
  const COLORS_METODOS = ['#e69a4e', '#5B2333']; // Accent and Primary

  const dataAsistencia = [
    { name: 'Presentes', value: presentes },
    { name: 'Ausentes', value: ausentes },
  ];
  const COLORS_ASIST = ['#10b981', '#cbd5e1']; // Green and Gray

  return (
    <div className="min-h-screen bg-warm-50">
      {/* Nav */}
      <nav className="nav-bar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-warm-600 hover:text-primary-600 font-medium transition-colors"
              >
                ← Volver al Panel
              </button>
            </div>
            <div className="flex items-center">
              <h1 className="text-xl font-display font-bold text-primary-700">Centro de Estadísticas</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Top summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-primary-900 to-primary-700 border-none shadow-lg shadow-primary-900/20 text-white">
            <p className="text-primary-100 font-medium mb-1">Total Recaudado</p>
            <h2 className="text-4xl font-bold font-display">{formatCurrency(totalRecaudado)}</h2>
            <div className="mt-4 flex gap-4 text-sm text-primary-100">
              <div><span className="font-bold">{formatCurrency(pagoEfectivo)}</span> Efectivo</div>
              <div><span className="font-bold">{formatCurrency(pagoTransf)}</span> Transf.</div>
            </div>
          </div>

          <div className="card border-l-4 border-success-500">
            <p className="text-warm-500 font-medium mb-1">Asistencia</p>
            <h2 className="text-4xl font-bold text-warm-900 font-display">{presentes} / {totalPersonas}</h2>
            <div className="mt-4 w-full bg-warm-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-success-500 h-2 rounded-full" 
                style={{ width: `${totalPersonas > 0 ? (presentes/totalPersonas)*100 : 0}%` }}
              ></div>
            </div>
            <p className="text-xs text-warm-400 mt-2 text-right">{totalPersonas > 0 ? Math.round((presentes/totalPersonas)*100) : 0}% del total</p>
          </div>

          <div className="card border-l-4 border-amber-500">
            <p className="text-warm-500 font-medium mb-1">Platos Servidos</p>
            <h2 className="text-4xl font-bold text-warm-900 font-display">{comidaServida} / {sillasOcupadas}</h2>
            <div className="mt-4 w-full bg-warm-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-amber-500 h-2 rounded-full" 
                style={{ width: `${sillasOcupadas > 0 ? (comidaServida/sillasOcupadas)*100 : 0}%` }}
              ></div>
            </div>
            <p className="text-xs text-warm-400 mt-2 text-right">Basado en {sillasOcupadas} sillas asignadas</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card h-96 flex flex-col">
            <h3 className="font-display font-bold text-warm-900 text-lg mb-4">Proporción de Recaudo</h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataMetodos}
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {dataMetodos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_METODOS[index % COLORS_METODOS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card h-96 flex flex-col">
            <h3 className="font-display font-bold text-warm-900 text-lg mb-4">Estado de Asistencia</h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataAsistencia}
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {dataAsistencia.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_ASIST[index % COLORS_ASIST.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
