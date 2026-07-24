'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { generarImagenBoleta, BoletaConfig } from '@/lib/boleta-utils';

export default function DisenoBoletaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [eventoId, setEventoId] = useState('');
  
  const [config, setConfig] = useState<BoletaConfig>({
    bg_url: '/boleta.jpeg',
    qr_x: 0.7, 
    qr_y: 0.08,
    qr_size: 0.18,
    name_x: 0.79,
    name_y: 0.28,
    name_color: '#5B2333',
    name_size: 0.025
  });

  const [previewUrl, setPreviewUrl] = useState('');
  const [generatingPreview, setGeneratingPreview] = useState(false);

  useEffect(() => {
    const eid = localStorage.getItem('evento_id');
    if (!eid) {
      alert('Debes seleccionar un evento primero.');
      router.push('/dashboard');
      return;
    }
    setEventoId(eid);
    fetchConfig();
  }, []);

  useEffect(() => {
    generatePreview();
  }, [config]);

  const fetchConfig = async () => {
    try {
      const res = await apiFetch('/api/boleta-config');
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setConfig(data);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = async () => {
    setGeneratingPreview(true);
    try {
      const mockAsistente = {
        nombre: 'JUAN PEREZ',
        qr_token: 'PREVIEW12345'
      };
      const url = await generarImagenBoleta(mockAsistente, config);
      setPreviewUrl(url);
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingPreview(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen es muy grande. Máximo 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setConfig(prev => ({ ...prev, bg_url: event.target!.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiFetch('/api/boleta-config', {
        method: 'POST',
        body: JSON.stringify(config)
      });
      if (res.ok) {
        alert('Configuración guardada correctamente.');
      } else {
        alert('Error al guardar.');
      }
    } catch (e) {
      console.error(e);
      alert('Error de red.');
    } finally {
      setSaving(false);
    }
  };

  const handleSliderChange = (field: keyof BoletaConfig, value: number) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  if (loading) return <div className="p-10 text-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-warm-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-warm-200">
          <div>
            <h1 className="text-2xl font-display font-bold text-warm-900">Diseñador de Boletas</h1>
            <p className="text-warm-500 text-sm">Personaliza la imagen y ubicación del QR de tu evento.</p>
          </div>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Guardando...' : 'Guardar Diseño'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel de Controles */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-warm-200 space-y-6 h-fit">
            
            <div>
              <label className="block text-sm font-bold text-primary-700 mb-2">Fondo de Boleta</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full text-sm text-warm-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              <p className="text-xs text-warm-400 mt-2">Sube una imagen vertical (Recomendado: 800x1200px, máx 2MB).</p>
            </div>

            <hr className="border-warm-100" />

            <div>
              <h3 className="font-bold text-warm-900 mb-4">Código QR</h3>
              <div className="space-y-4">
                <div>
                  <label className="flex justify-between text-sm text-warm-700">
                    <span>Posición Horizontal (X)</span>
                    <span className="font-mono bg-warm-100 px-2 rounded">{Math.round(config.qr_x * 100)}%</span>
                  </label>
                  <input type="range" min="0" max="1" step="0.01" value={config.qr_x} onChange={e => handleSliderChange('qr_x', parseFloat(e.target.value))} className="w-full accent-primary-600" />
                </div>
                <div>
                  <label className="flex justify-between text-sm text-warm-700">
                    <span>Posición Vertical (Y)</span>
                    <span className="font-mono bg-warm-100 px-2 rounded">{Math.round(config.qr_y * 100)}%</span>
                  </label>
                  <input type="range" min="0" max="1" step="0.01" value={config.qr_y} onChange={e => handleSliderChange('qr_y', parseFloat(e.target.value))} className="w-full accent-primary-600" />
                </div>
                <div>
                  <label className="flex justify-between text-sm text-warm-700">
                    <span>Tamaño del QR</span>
                    <span className="font-mono bg-warm-100 px-2 rounded">{Math.round(config.qr_size * 100)}%</span>
                  </label>
                  <input type="range" min="0.05" max="0.5" step="0.01" value={config.qr_size} onChange={e => handleSliderChange('qr_size', parseFloat(e.target.value))} className="w-full accent-primary-600" />
                </div>
              </div>
            </div>

            <hr className="border-warm-100" />

            <div>
              <h3 className="font-bold text-warm-900 mb-4">Nombre del Invitado</h3>
              <div className="space-y-4">
                <div>
                  <label className="flex justify-between text-sm text-warm-700">
                    <span>Posición Horizontal (X)</span>
                    <span className="font-mono bg-warm-100 px-2 rounded">{Math.round(config.name_x * 100)}%</span>
                  </label>
                  <input type="range" min="0" max="1" step="0.01" value={config.name_x} onChange={e => handleSliderChange('name_x', parseFloat(e.target.value))} className="w-full accent-primary-600" />
                </div>
                <div>
                  <label className="flex justify-between text-sm text-warm-700">
                    <span>Posición Vertical (Y)</span>
                    <span className="font-mono bg-warm-100 px-2 rounded">{Math.round(config.name_y * 100)}%</span>
                  </label>
                  <input type="range" min="0" max="1" step="0.01" value={config.name_y} onChange={e => handleSliderChange('name_y', parseFloat(e.target.value))} className="w-full accent-primary-600" />
                </div>
                <div>
                  <label className="flex justify-between text-sm text-warm-700">
                    <span>Tamaño del Texto</span>
                    <span className="font-mono bg-warm-100 px-2 rounded">{Math.round((config.name_size || 0.025) * 1000)}</span>
                  </label>
                  <input type="range" min="0.01" max="0.1" step="0.002" value={config.name_size || 0.025} onChange={e => handleSliderChange('name_size', parseFloat(e.target.value))} className="w-full accent-primary-600" />
                </div>
                <div>
                  <label className="block text-sm text-warm-700 mb-2">Color del Texto</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={config.name_color} onChange={e => setConfig({ ...config, name_color: e.target.value })} className="w-10 h-10 rounded cursor-pointer border-0 p-0" />
                    <span className="text-sm font-mono text-warm-600">{config.name_color.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => {
                setConfig({
                  bg_url: '/boleta.jpeg',
                  qr_x: 0.7, 
                  qr_y: 0.08,
                  qr_size: 0.18,
                  name_x: 0.79,
                  name_y: 0.28,
                  name_color: '#5B2333',
                  name_size: 0.025
                });
              }}
              className="w-full py-2 bg-warm-100 text-warm-700 rounded-xl hover:bg-warm-200 transition text-sm font-semibold mt-4"
            >
              Restablecer Valores por Defecto
            </button>

          </div>

          {/* Panel de Vista Previa */}
          <div className="bg-warm-200 p-6 rounded-2xl border border-warm-300 flex flex-col items-center justify-center min-h-[600px] relative overflow-hidden">
            <h3 className="absolute top-4 left-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-warm-600 shadow-sm z-10">
              Vista Previa en Tiempo Real
            </h3>
            
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Vista Previa Boleta" 
                className={`max-w-full max-h-[800px] shadow-2xl rounded-lg transition-opacity duration-200 ${generatingPreview ? 'opacity-70' : 'opacity-100'}`}
              />
            ) : (
              <div className="animate-pulse text-warm-500 font-medium">Generando vista previa...</div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
