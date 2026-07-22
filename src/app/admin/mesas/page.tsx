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
  comida_servida?: boolean;
}

interface MesaConfig {
  id: number;
  sillas: number;
}

interface Config {
  mesas: MesaConfig[];
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
      const resConfig = await fetch('/api/mesas/config');
      if (resConfig.ok) {
        let configData = await resConfig.json();
        if (configData) {
          // Migrar formato antiguo { mesas: 10, sillasPorMesa: 8 } a nuevo formato array si es necesario
          if (typeof configData.mesas === 'number') {
            const legacyMesas = Array.from({ length: configData.mesas }).map((_, i) => ({
              id: i + 1,
              sillas: configData.sillasPorMesa
            }));
            configData = { mesas: legacyMesas };
          }
          setConfig(configData);
        }
      }
      
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

  const saveConfig = async (newConfig: Config) => {
    const res = await fetch('/api/mesas/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig)
    });
    if (!res.ok) throw new Error('Error saving config');
    setConfig(newConfig);
  };

  const handleCreateInitialLayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const initialMesas = Array.from({ length: inputMesas }).map((_, i) => ({
        id: i + 1,
        sillas: inputSillas
      }));
      await saveConfig({ mesas: initialMesas });
    } catch (error) {
      console.error(error);
      alert('Hubo un error al guardar la configuración.');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleAddMesa = async () => {
    if (!config) return;
    try {
      const newId = config.mesas.length > 0 ? Math.max(...config.mesas.map(m => m.id)) + 1 : 1;
      const newMesa = { id: newId, sillas: 8 }; // Por defecto 8 sillas
      await saveConfig({ mesas: [...config.mesas, newMesa] });
    } catch (error) {
      alert('Error al añadir mesa');
    }
  };

  const handleDeleteMesa = async (mesaId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar abrir el modal
    if (!config) return;
    if (!confirm(`¿Estás seguro de eliminar la Mesa ${mesaId}? Cualquier persona sentada será desasignada.`)) return;
    
    try {
      // 1. Desasignar en backend
      await fetch('/api/mesas/modificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unassignList: [{ mesa: mesaId }] })
      });

      // 2. Desasignar localmente
      setAsistentes(prev => prev.map(a => a.mesa === mesaId ? { ...a, mesa: null, silla: null } : a));

      // 3. Quitar de la configuración
      await saveConfig({ mesas: config.mesas.filter(m => m.id !== mesaId) });
    } catch (error) {
      alert('Error al eliminar la mesa');
    }
  };

  const handleAddSilla = async () => {
    if (!config || selectedMesa === null) return;
    try {
      const mesaIdx = config.mesas.findIndex(m => m.id === selectedMesa);
      const newConfig = { mesas: [...config.mesas] };
      newConfig.mesas[mesaIdx].sillas += 1;
      await saveConfig(newConfig);
    } catch (error) {
      alert('Error al añadir silla');
    }
  };

  const handleRemoveSilla = async () => {
    if (!config || selectedMesa === null) return;
    const mesaIdx = config.mesas.findIndex(m => m.id === selectedMesa);
    const currentSillas = config.mesas[mesaIdx].sillas;
    
    if (currentSillas <= 1) {
      return alert('La mesa debe tener al menos 1 silla. Si no, elimina la mesa completa.');
    }
    
    if (!confirm(`¿Seguro que deseas quitar la silla #${currentSillas}? Si hay alguien sentado ahí, perderá el puesto.`)) return;

    try {
      // 1. Desasignar en backend
      await fetch('/api/mesas/modificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unassignList: [{ mesa: selectedMesa, silla: currentSillas }] })
      });

      // 2. Desasignar localmente
      setAsistentes(prev => prev.map(a => 
        (a.mesa === selectedMesa && a.silla === currentSillas) ? { ...a, mesa: null, silla: null } : a
      ));

      // 3. Quitar de la configuración
      const newConfig = { mesas: [...config.mesas] };
      newConfig.mesas[mesaIdx].sillas -= 1;
      await saveConfig(newConfig);
    } catch (error) {
      alert('Error al quitar silla');
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

      setAsistentes(prev => prev.map(a => 
        a.id === asistente_id ? { ...a, mesa: null, silla: null, comida_servida: false } : a
      ));
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleToggleServir = async (asistente_id: number, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/mesas/servir', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asistente_id, comida_servida: !currentStatus })
      });

      if (!res.ok) throw new Error('Error al actualizar estado de comida');

      setAsistentes(prev => prev.map(a => 
        a.id === asistente_id ? { ...a, comida_servida: !currentStatus } : a
      ));
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleResetSalon = async () => {
    if (!confirm('⚠️ ZONA DE RIESGO ⚠️\n\n¿Estás completamente seguro de que quieres eliminar TODAS las mesas y sillas? Esto levantará a todas las personas de sus asientos y el salón quedará vacío.')) return;

    try {
      const res = await fetch('/api/mesas/reset', { method: 'POST' });
      if (!res.ok) throw new Error('Error al reiniciar');
      
      setConfig(null);
      setAsistentes(prev => prev.map(a => ({ ...a, mesa: null, silla: null })));
    } catch (error) {
      alert('Hubo un error al eliminar todo el salón.');
    }
  };

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

  // Cálculos estadísticos globales
  const totalSillas = config?.mesas.reduce((acc, m) => acc + m.sillas, 0) || 0;
  const asientosOcupados = asistentes.filter(a => a.mesa !== null).length;

  return (
    <div className="min-h-screen bg-warm-50 pb-12">
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
              <h1 className="text-xl font-display font-bold text-primary-700">Asignación de Mesas</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!config ? (
          <div className="max-w-md mx-auto card animate-fadeInUp">
            <h2 className="text-2xl font-display font-bold text-warm-900 mb-6 text-center">Configurar Salón</h2>
            <form onSubmit={handleCreateInitialLayout} className="space-y-6">
              <div>
                <label className="label-field">Número inicial de Mesas</label>
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
                <label className="label-field">Número inicial de Sillas por Mesa</label>
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
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-8 gap-4">
              <div>
                <h2 className="text-3xl font-display font-bold text-warm-900">Plano del Salón</h2>
                <p className="text-warm-500 mt-2">Selecciona una mesa para gestionar sillas e invitados.</p>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <span className="stat-badge bg-primary-100 text-primary-700 text-lg py-2 px-4">
                  {asientosOcupados} / {totalSillas} Asientos Ocupados
                </span>
                <button 
                  onClick={handleAddMesa}
                  className="btn-success flex items-center gap-2 shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                  Añadir Mesa
                </button>
                <button 
                  onClick={handleResetSalon}
                  className="bg-danger-100 text-danger-700 hover:bg-danger-600 hover:text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-md transition-all border border-danger-200"
                  title="Eliminar Todo el Salón"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  Zona de Riesgo
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
              {config.mesas.map((mesaConfig) => {
                const mesaNumero = mesaConfig.id;
                const totalSillasMesa = mesaConfig.sillas;
                const ocupantes = asistentes.filter(a => a.mesa === mesaNumero);
                const isFull = ocupantes.length === totalSillasMesa && totalSillasMesa > 0;
                const isEmpty = ocupantes.length === 0;
                
                const ocupadosConComida = ocupantes.filter(o => o.comida_servida).length;
                const mesaServida = ocupantes.length > 0 && ocupadosConComida === ocupantes.length;

                return (
                  <div key={mesaNumero} className="relative group">
                    <button
                      onClick={() => setSelectedMesa(mesaNumero)}
                      className={`relative aspect-square w-full rounded-full flex flex-col items-center justify-center transition-all duration-300 transform group-hover:scale-105 shadow-md border-4 
                        ${mesaServida 
                          ? 'bg-amber-50 border-amber-500 shadow-amber-200' 
                          : isFull 
                            ? 'bg-primary-50 border-primary-500' 
                            : isEmpty 
                              ? 'bg-white border-warm-200' 
                              : 'bg-accent-50 border-accent-400'}`}
                    >
                      <span className="text-2xl font-display font-bold text-warm-900">Mesa {mesaNumero}</span>
                      <span className={`text-sm font-medium mt-1 ${mesaServida ? 'text-amber-600' : isFull ? 'text-primary-600' : 'text-warm-500'}`}>
                        {ocupantes.length} / {totalSillasMesa}
                      </span>
                      {mesaServida && (
                        <span className="absolute bottom-4 text-xs font-bold text-amber-600 bg-amber-100 px-2 rounded-full">SERVIDA ✅</span>
                      )}
                      
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {Array.from({ length: totalSillasMesa }).map((__, i) => {
                          const angle = (i * 360) / totalSillasMesa;
                          const radius = 60;
                          const ocupante = ocupantes.find(o => o.silla === (i + 1));
                          const sillaOcupada = !!ocupante;
                          const sillaServida = ocupante?.comida_servida;
                          
                          return (
                            <div 
                              key={i}
                              className={`absolute w-3 h-3 rounded-full ${sillaServida ? 'bg-amber-500' : sillaOcupada ? 'bg-primary-500' : 'bg-warm-200'}`}
                              style={{
                                transform: `rotate(${angle}deg) translateY(-${radius}px)`
                              }}
                            />
                          );
                        })}
                      </div>
                    </button>
                    
                    {/* Botón Flotante Eliminar Mesa */}
                    <button
                      onClick={(e) => handleDeleteMesa(mesaNumero, e)}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-white border border-danger-200 text-danger-500 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 hover:bg-danger-50 hover:scale-110 transition-all z-10"
                      title="Eliminar Mesa"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── MESA DETALLE MODAL ─── */}
      {selectedMesa && config && (
        <div className="fixed inset-0 bg-warm-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-fadeInUp">
            
            <div className="p-6 border-b border-warm-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-warm-50 gap-4 rounded-t-3xl">
              <h3 className="text-2xl font-display font-bold text-warm-900">
                Gestión - Mesa {selectedMesa}
              </h3>
              
              <div className="flex items-center gap-3 flex-wrap">
                <button 
                  onClick={handleAddSilla}
                  className="bg-white border border-warm-200 text-warm-700 px-3 py-1.5 rounded-lg hover:bg-warm-100 transition-colors text-sm font-medium flex items-center gap-1 shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                  Añadir Silla
                </button>
                <button 
                  onClick={handleRemoveSilla}
                  className="bg-white border border-danger-200 text-danger-600 px-3 py-1.5 rounded-lg hover:bg-danger-50 transition-colors text-sm font-medium flex items-center gap-1 shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4"/></svg>
                  Quitar Silla
                </button>
                <button 
                  onClick={() => { setSelectedMesa(null); setAssigningSilla(null); }}
                  className="w-10 h-10 ml-2 rounded-full bg-white flex items-center justify-center text-warm-500 hover:text-warm-900 shadow-sm border border-warm-200 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-white rounded-b-3xl">
              {(() => {
                const mesaConfig = config.mesas.find(m => m.id === selectedMesa);
                if (!mesaConfig) return null;

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Array.from({ length: mesaConfig.sillas }).map((_, sillaIndex) => {
                      const sillaNumero = sillaIndex + 1;
                      const ocupante = asistentes.find(a => a.mesa === selectedMesa && a.silla === sillaNumero);
                      const isAssigningThis = assigningSilla === sillaNumero;

                      return (
                        <div key={sillaNumero} className={`p-4 rounded-2xl border transition-all ${
                          ocupante ? 'bg-primary-50 border-primary-200 shadow-sm' : 'bg-warm-50 border-warm-200 border-dashed'
                        }`}>
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-warm-500 text-sm">Silla {sillaNumero}</span>
                            {ocupante && (
                              <div className="flex gap-1">
                                {ocupante.comida_servida && (
                                  <span className="stat-badge bg-amber-100 text-amber-700 text-xs py-1">Servida</span>
                                )}
                                <span className="stat-badge bg-primary-100 text-primary-700 text-xs py-1">Ocupada</span>
                              </div>
                            )}
                          </div>

                          {ocupante ? (
                            <div className="flex flex-col mt-2">
                              <div className="flex justify-between items-center mb-3">
                                <div>
                                  <p className="font-bold text-warm-900">{ocupante.nombre}</p>
                                  <p className="text-xs text-warm-500">{ocupante.documento}</p>
                                </div>
                                <button 
                                  onClick={() => handleUnassign(ocupante.id)}
                                  className="text-danger-500 hover:text-danger-700 hover:bg-danger-50 p-2 rounded-lg transition-colors text-sm font-medium"
                                  title="Quitar persona de la mesa"
                                >
                                  Levantar
                                </button>
                              </div>
                              <button
                                onClick={() => handleToggleServir(ocupante.id, !!ocupante.comida_servida)}
                                className={`w-full py-2 rounded-lg font-medium transition-colors text-sm flex justify-center items-center gap-2 ${
                                  ocupante.comida_servida 
                                    ? 'bg-amber-100 text-amber-700 border border-amber-300 hover:bg-amber-200' 
                                    : 'bg-warm-100 text-warm-700 hover:bg-primary-100 hover:text-primary-700 hover:border-primary-300 border border-transparent'
                                }`}
                              >
                                {ocupante.comida_servida ? '✅ Comida Servida (Deshacer)' : '🍽️ Marcar Servida'}
                              </button>
                            </div>
                          ) : (
                            <div className="mt-2">
                              {!isAssigningThis ? (
                                <button 
                                  onClick={() => setAssigningSilla(sillaNumero)}
                                  className="w-full py-3 rounded-xl border border-warm-200 bg-white text-warm-600 hover:border-primary-300 hover:text-primary-600 transition-colors font-medium flex items-center justify-center gap-2 shadow-sm"
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
                                  <div className="max-h-48 overflow-y-auto rounded-xl border border-warm-200 bg-white shadow-inner">
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
                                          <span className="text-primary-600 text-xs font-medium bg-primary-50 px-2 py-1 rounded-md">Sentar aquí</span>
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
                );
              })()}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
