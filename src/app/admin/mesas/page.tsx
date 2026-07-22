'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface Asistente {
  id: number;
  nombre: string;
  documento: string;
  estado: string;
  mesa: number | null;
  silla: number | null;
}

interface Config {
  mesas: number;
  sillasPorMesa: number;
}

export default function MesasPage() {
  const router = useRouter();
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [asistentes, setAsistentes] = useState<Asistente[]>([]);
  
  // Setup form states
  const [inputMesas, setInputMesas] = useState(10);
  const [inputSillas, setInputSillas] = useState(8);
  const [savingConfig, setSavingConfig] = useState(false);

  // Modal states
  const [selectedMesa, setSelectedMesa] = useState<number | null>(null);
  const [assigningSilla, setAssigningSilla] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Config
      const resConfig = await fetch('/api/mesas/config');
      if (resConfig.ok) {
        const configData = await resConfig.json();
        setConfig(configData);
      }
      
      // Fetch Asistentes
      const resAsistentes = await fetch('/api/asistentes');
      if (resAsistentes.ok) {
        const asisData = await resAsistentes.json();
        setAsistentes(asisData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const res = await fetch('/api/mesas/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mesas: inputMesas, sillasPorMesa: inputSillas })
      });
      
      if (!res.ok) throw new Error('Error saving config');
      setConfig({ mesas: inputMesas, sillasPorMesa: inputSillas });
    } catch (error) {
      console.error(error);
      alert('Hubo un error al guardar la configuración.');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleAssign = async (asistente_id: number, mesa: number, silla: number) => {
    try {
      const res = await fetch('/api/mesas/asignar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asistente_id, mesa, silla })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error asignando');
      }

      // Optimistic update
      setAsistentes(prev => prev.map(a => 
        a.id === asistente_id ? { ...a, mesa, silla } : a
      ));
      setAssigningSilla(null);
      setSearchTerm('');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleUnassign = async (asistente_id: number) => {
    if (!confirm('¿Seguro que deseas quitar a esta persona de la silla?')) return;
    try {
      const res = await fetch('/api/mesas/asignar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asistente_id, mesa: null, silla: null })
      });

      if (!res.ok) throw new Error('Error desasignando');

      // Optimistic update
      setAsistentes(prev => prev.map(a => 
        a.id === asistente_id ? { ...a, mesa: null, silla: null } : a
      ));
    } catch (error: any) {
      alert(error.message);
    }
  };

  // List of available attendees (Present and not assigned)
  const availableAttendees = useMemo(() => {
    return asistentes.filter(a => 
      a.estado === 'presente' && a.mesa === null &&
      (a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || a.documento.includes(searchTerm))
    );
  }, [asistentes, searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50 pb-12">
      {/* Nav */}
      <nav className="nav-bar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/admin')}
                className="text-warm-600 hover:text-primary-600 font-medium transition-colors"
              >
                ← Volver al Panel
              </button>
            </div>
            <div className="flex items-center">
              <h1 className="text-xl font-display font-bold text-primary-700">Asignación de Mesas</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!config ? (
          /* ─── SETUP FORM ─── */
          <div className="max-w-md mx-auto card animate-fadeInUp">
            <h2 className="text-2xl font-display font-bold text-warm-900 mb-6 text-center">Configurar Salón</h2>
            <form onSubmit={handleSaveConfig} className="space-y-6">
              <div>
                <label className="label-field">Número total de Mesas</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={inputMesas}
                  onChange={e => setInputMesas(parseInt(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-field">Número de Sillas por Mesa</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  required
                  value={inputSillas}
                  onChange={e => setInputSillas(parseInt(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
              <button type="submit" disabled={savingConfig} className="btn-primary w-full">
                {savingConfig ? 'Guardando...' : 'Crear Salón Virtual'}
              </button>
            </form>
          </div>
        ) : (
          /* ─── SALON VIEW ─── */
          <div>
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-3xl font-display font-bold text-warm-900">Plano del Salón</h2>
                <p className="text-warm-500 mt-2">Selecciona una mesa para asignar asistentes a sus sillas.</p>
              </div>
              <div className="text-right">
                <span className="stat-badge bg-primary-100 text-primary-700 text-lg py-2 px-4">
                  {asistentes.filter(a => a.mesa !== null).length} / {config.mesas * config.sillasPorMesa} Asientos Ocupados
                </span>
              </div>
            </div>

            {/* Grid de Mesas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
              {Array.from({ length: config.mesas }).map((_, mesaIndex) => {
                const mesaNumero = mesaIndex + 1;
                const ocupantes = asistentes.filter(a => a.mesa === mesaNumero);
                const isFull = ocupantes.length === config.sillasPorMesa;
                const isEmpty = ocupantes.length === 0;

                return (
                  <button
                    key={mesaNumero}
                    onClick={() => setSelectedMesa(mesaNumero)}
                    className={`relative aspect-square rounded-full flex flex-col items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-md border-4 
                      ${isFull 
                        ? 'bg-primary-50 border-primary-500' 
                        : isEmpty 
                          ? 'bg-white border-warm-200' 
                          : 'bg-accent-50 border-accent-400'}`}
                  >
                    <span className="text-2xl font-display font-bold text-warm-900">Mesa {mesaNumero}</span>
                    <span className={`text-sm font-medium mt-1 ${isFull ? 'text-primary-600' : 'text-warm-500'}`}>
                      {ocupantes.length} / {config.sillasPorMesa}
                    </span>
                    
                    {/* Visual indicators for chairs */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      {Array.from({ length: config.sillasPorMesa }).map((__, i) => {
                        const angle = (i * 360) / config.sillasPorMesa;
                        const radius = 60; // distance from center
                        const sillaOcupada = ocupantes.some(o => o.silla === (i + 1));
                        return (
                          <div 
                            key={i}
                            className={`absolute w-3 h-3 rounded-full ${sillaOcupada ? 'bg-primary-500' : 'bg-warm-200'}`}
                            style={{
                              transform: `rotate(${angle}deg) translateY(-${radius}px)`
                            }}
                          />
                        );
                      })}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── MESA DETALLE MODAL ─── */}
      {selectedMesa && config && (
        <div className="fixed inset-0 bg-warm-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-fadeInUp">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-warm-100 flex justify-between items-center bg-warm-50">
              <h3 className="text-2xl font-display font-bold text-warm-900">
                Gestión - Mesa {selectedMesa}
              </h3>
              <button 
                onClick={() => { setSelectedMesa(null); setAssigningSilla(null); }}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-warm-500 hover:text-warm-900 shadow-sm transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: config.sillasPorMesa }).map((_, sillaIndex) => {
                  const sillaNumero = sillaIndex + 1;
                  const ocupante = asistentes.find(a => a.mesa === selectedMesa && a.silla === sillaNumero);
                  const isAssigningThis = assigningSilla === sillaNumero;

                  return (
                    <div key={sillaNumero} className={`p-4 rounded-2xl border transition-all ${
                      ocupante ? 'bg-primary-50 border-primary-200' : 'bg-warm-50 border-warm-200 border-dashed'
                    }`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-warm-500 text-sm">Silla {sillaNumero}</span>
                        {ocupante && (
                          <span className="stat-badge bg-primary-100 text-primary-700 text-xs py-1">Ocupada</span>
                        )}
                      </div>

                      {ocupante ? (
                        <div className="flex justify-between items-center mt-2">
                          <div>
                            <p className="font-bold text-warm-900">{ocupante.nombre}</p>
                            <p className="text-xs text-warm-500">{ocupante.documento}</p>
                          </div>
                          <button 
                            onClick={() => handleUnassign(ocupante.id)}
                            className="text-danger-500 hover:text-danger-700 hover:bg-danger-50 p-2 rounded-lg transition-colors text-sm font-medium"
                          >
                            Quitar
                          </button>
                        </div>
                      ) : (
                        <div className="mt-2">
                          {!isAssigningThis ? (
                            <button 
                              onClick={() => setAssigningSilla(sillaNumero)}
                              className="w-full py-3 rounded-xl border border-warm-200 bg-white text-warm-600 hover:border-primary-300 hover:text-primary-600 transition-colors font-medium flex items-center justify-center gap-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                              Asignar Asistente
                            </button>
                          ) : (
                            <div className="animate-fadeIn">
                              <div className="flex items-center gap-2 mb-3">
                                <input
                                  type="text"
                                  placeholder="Buscar nombre o cédula..."
                                  value={searchTerm}
                                  onChange={e => setSearchTerm(e.target.value)}
                                  className="input-field text-sm py-2"
                                  autoFocus
                                />
                                <button 
                                  onClick={() => setAssigningSilla(null)}
                                  className="text-warm-400 hover:text-warm-600"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="max-h-48 overflow-y-auto rounded-xl border border-warm-200 bg-white">
                                {availableAttendees.length === 0 ? (
                                  <p className="p-4 text-center text-sm text-warm-500">No hay asistentes presentes sin mesa.</p>
                                ) : (
                                  availableAttendees.map(a => (
                                    <button
                                      key={a.id}
                                      onClick={() => handleAssign(a.id, selectedMesa, sillaNumero)}
                                      className="w-full text-left p-3 hover:bg-warm-50 border-b border-warm-100 last:border-0 transition-colors flex justify-between items-center"
                                    >
                                      <div>
                                        <p className="font-medium text-warm-900 text-sm">{a.nombre}</p>
                                        <p className="text-xs text-warm-500">{a.documento}</p>
                                      </div>
                                      <span className="text-primary-600 text-xs font-medium bg-primary-50 px-2 py-1 rounded-md">Seleccionar</span>
                                    </button>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
