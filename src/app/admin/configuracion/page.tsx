'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function ConfiguracionPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await apiFetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        if (data.mp_access_token) {
          setToken(data.mp_access_token);
        }
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await apiFetch('/api/config', {
        method: 'POST',
        body: JSON.stringify({ mp_access_token: token.trim() })
      });

      if (!res.ok) {
        throw new Error('Error al guardar configuración');
      }

      setMessage({ text: 'Configuración guardada exitosamente.', type: 'success' });
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-display font-bold text-warm-900">Integración de Pagos</h2>
          </div>
          
          <p className="text-warm-600 mb-8 leading-relaxed">
            Conecta tu cuenta de <strong>MercadoPago</strong> para recibir el dinero de la venta de tus boletas directamente en tu cuenta. Los cobros se realizarán de manera automática y los invitados recibirán su boleta solo cuando el pago sea exitoso.
          </p>

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="label-field mb-2 flex items-center justify-between">
                <span>Access Token (MercadoPago)</span>
                <a 
                  href="https://www.mercadopago.com.co/developers/panel/credentials" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                >
                  ¿Dónde encuentro mi token?
                </a>
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="input-field font-mono text-sm"
                placeholder="APP_USR-1234567890..."
              />
              <p className="text-xs text-warm-500 mt-2">
                Pega aquí tu credencial "Access Token" de Producción de MercadoPago.
              </p>
            </div>

            {message && (
              <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-success-50 text-success-700' : 'bg-red-50 text-red-700'}`}>
                {message.text}
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-xl shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Guardando...
                  </>
                ) : (
                  <>Guardar Configuración</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
