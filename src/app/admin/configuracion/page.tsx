'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function ConfiguracionPage() {
  const router = useRouter();
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await apiFetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        if (data.whatsapp_contacto) {
          setWhatsapp(data.whatsapp_contacto);
        }
      } else if (res.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      
      const res = await apiFetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp_contacto: whatsapp.trim() || null })
      });

      if (res.ok) {
        setMessage({ text: 'Configuración guardada correctamente.', type: 'success' });
      } else {
        throw new Error('Error al guardar');
      }
    } catch (error) {
      console.error(error);
      setMessage({ text: 'Hubo un error al guardar la configuración.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

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
              <h1 className="text-xl font-display font-bold text-primary-700">Configuración</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card animate-fadeInUp">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-display font-bold text-warm-900">WhatsApp de Pagos</h2>
          </div>
          
          <p className="text-warm-600 mb-8 leading-relaxed">
            Ingresa tu número de WhatsApp. Cuando un invitado se registre en uno de tus eventos de cobro, será redirigido automáticamente a tu WhatsApp con un mensaje pre-armado para coordinar el pago contigo de manera directa.
          </p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-primary-700 mb-2">
                Número de WhatsApp (con código de país)
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Ej: 573001234567"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value.replace(/[^0-9]/g, ''))}
              />
              <p className="text-xs text-warm-500 mt-2">
                Escribe solo números. Por ejemplo, para Colombia usa el 57 seguido de tu número celular.
              </p>
            </div>

            {message && (
              <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'}`}>
                {message.text}
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary w-full sm:w-auto"
              >
                {saving ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
