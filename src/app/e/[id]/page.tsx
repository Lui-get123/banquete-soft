'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { generarImagenBoleta } from '@/lib/boleta-utils';
import { formatCurrency } from '@/lib/utils';

export default function PublicEventRegistrationPage({
  params
}: {
  params: { id: string }
}) {
  const router = useRouter();
  const eventoId = params.id;

  const [eventoNombre, setEventoNombre] = useState<string>('');
  const [eventoPrecio, setEventoPrecio] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [step, setStep] = useState<1 | 2>(1);
  const [cantidadBoletas, setCantidadBoletas] = useState<number>(1);
  const [successMode, setSuccessMode] = useState<'gratis' | 'whatsapp' | null>(null);

  const [asistentesData, setAsistentesData] = useState<{nombre: string, documento: string}[]>([
    { nombre: '', documento: '' }
  ]);
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/public/eventos/${eventoId}?t=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        
        if (res.ok) {
          setEventoNombre(data.nombre);
          setEventoPrecio(data.precio_boleta || 0);
        } else {
          setError(data.error || 'Evento no encontrado');
        }
      } catch (err) {
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventoId]);

  const handleCantidadSelect = (num: number) => {
    setCantidadBoletas(num);
    const newAsistentes = Array(num).fill(null).map((_, i) => asistentesData[i] || { nombre: '', documento: '' });
    setAsistentesData(newAsistentes);
    setStep(2);
  };

  const handleAsistenteChange = (index: number, field: 'nombre' | 'documento', value: string) => {
    const updated = [...asistentesData];
    updated[index][field] = value;
    setAsistentesData(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const regRes = await fetch('/api/public/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evento_id: eventoId,
          telefono,
          email,
          asistentes: asistentesData
        })
      });

      const regData = await regRes.json();
      if (!regRes.ok) throw new Error(regData.error || 'Error en el registro');

      if (regData.requiresPayment && regData.whatsappContacto) {
        const total = regData.precioTotal;
        const titular = asistentesData[0].nombre;
        const mensaje = `Hola, acabo de registrarme para el evento *${eventoNombre}*. Quiero pagar ${cantidadBoletas} boleta(s). El total es ${formatCurrency(total)}. El titular de las boletas es: ${titular} (${email}).`;
        const waUrl = `https://wa.me/${regData.whatsappContacto}?text=${encodeURIComponent(mensaje)}`;
        
        window.open(waUrl, '_blank');
        setSuccessMode('whatsapp');
      } else {
        const boletasBase64 = await Promise.all(regData.asistentes.map((a: any) => generarImagenBoleta(a)));
        
        const emailRes = await fetch('/api/public/enviar-boletas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            boletasBase64,
            evento_id: eventoId
          })
        });

        const emailData = await emailRes.json();
        if (!emailRes.ok) console.warn('Advertencia: No se pudo enviar el correo', emailData.error);
        
        setSuccessMode('gratis');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error && !eventoNombre) {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center border border-danger-100">
          <div className="w-16 h-16 bg-danger-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-danger-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-display font-bold text-warm-900 mb-2">Ops...</h2>
          <p className="text-warm-600">{error}</p>
        </div>
      </div>
    );
  }

  if (successMode === 'gratis') {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center border border-success-100">
          <div className="w-16 h-16 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-display font-bold text-warm-900 mb-2">¡Registro Exitoso!</h2>
          <p className="text-warm-600 mb-6 leading-relaxed">
            Hemos generado tu(s) boleta(s) y te las enviamos a <strong>{email}</strong>. 
            Revisa tu bandeja de entrada o spam.
          </p>
          <button onClick={() => window.location.reload()} className="btn-primary w-full">
            Registrar a otra persona
          </button>
        </div>
      </div>
    );
  }

  if (successMode === 'whatsapp') {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center border border-success-100">
          <div className="w-16 h-16 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-display font-bold text-warm-900 mb-2">¡Redirigiendo a WhatsApp!</h2>
          <p className="text-warm-600 mb-6 leading-relaxed">
            Tu registro está en revisión. Se ha abierto una ventana de WhatsApp para que envíes el comprobante de pago al organizador.
          </p>
          <p className="text-warm-500 text-sm mb-6">
            Una vez el organizador apruebe el pago, tus boletas llegarán al correo: <strong>{email}</strong>
          </p>
          <button onClick={() => window.location.reload()} className="text-primary-600 font-semibold hover:underline">
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-0 left-0 w-full h-96 bg-primary-900 rounded-b-[4rem] sm:rounded-b-[8rem] shadow-2xl -z-0"></div>
      
      <div className="max-w-xl w-full z-10 relative">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-display font-bold text-white mb-2 tracking-tight drop-shadow-md">
            {eventoNombre}
          </h2>
          {eventoPrecio > 0 ? (
            <p className="text-primary-100 text-lg font-medium bg-primary-800/50 inline-block px-4 py-1 rounded-full backdrop-blur-sm">
              {formatCurrency(eventoPrecio)} por persona
            </p>
          ) : (
            <p className="text-success-100 text-lg font-medium bg-success-800/50 inline-block px-4 py-1 rounded-full backdrop-blur-sm">
              Entrada Gratuita
            </p>
          )}
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/20">
          
          <div className="p-8 sm:p-10">
            {step === 1 ? (
              <div className="animate-fadeInUp">
                <h3 className="text-2xl font-display font-bold text-warm-900 mb-6 text-center">
                  ¿Cuántas boletas necesitas?
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                    <button
                      key={num}
                      onClick={() => handleCantidadSelect(num)}
                      className="aspect-square bg-warm-50 border-2 border-warm-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-warm-700 hover:border-primary-500 hover:bg-primary-50 hover:text-primary-600 transition-all shadow-sm"
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 animate-fadeInUp">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-display font-bold text-warm-900">
                    Datos de Asistentes
                  </h3>
                  <button type="button" onClick={() => setStep(1)} className="text-sm text-warm-500 hover:text-primary-600 transition-colors">
                    Cambiar cantidad ({cantidadBoletas})
                  </button>
                </div>

                {asistentesData.map((asistente, i) => (
                  <div key={i} className="p-4 bg-warm-50 rounded-2xl border border-warm-100 relative">
                    <div className="absolute -top-3 -left-3 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-sm border-2 border-white shadow-sm">
                      {i + 1}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      <div>
                        <label className="label-field text-xs">Nombre Completo</label>
                        <input
                          type="text"
                          required
                          className="input-field py-2 text-sm bg-white"
                          value={asistente.nombre}
                          onChange={e => handleAsistenteChange(i, 'nombre', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="label-field text-xs">Documento de Identidad</label>
                        <input
                          type="text"
                          required
                          className="input-field py-2 text-sm bg-white"
                          value={asistente.documento}
                          onChange={e => handleAsistenteChange(i, 'documento', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <hr className="border-warm-200" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="label-field">Email de Contacto (Para boletas)</label>
                    <input
                      type="email"
                      required
                      className="input-field"
                      placeholder="ejemplo@correo.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label-field">Teléfono / WhatsApp</label>
                    <input
                      type="tel"
                      required
                      className="input-field"
                      placeholder="300 123 4567"
                      value={telefono}
                      onChange={e => setTelefono(e.target.value)}
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-danger-50 text-danger-700 rounded-xl text-sm border border-danger-100">
                    {error}
                  </div>
                )}

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 px-8 rounded-xl shadow-xl shadow-primary-600/30 transition-all flex items-center justify-center gap-2 text-lg disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        {eventoPrecio > 0 ? `Pagar ${formatCurrency(eventoPrecio * cantidadBoletas)}` : 'Generar Entradas Gratis'}
                      </>
                    )}
                  </button>
                  {eventoPrecio > 0 && (
                    <p className="text-center text-xs text-warm-500 mt-4 flex items-center justify-center gap-1">
                      <svg className="w-4 h-4 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Serás redirigido a WhatsApp para confirmar tu pago directo con el organizador.
                    </p>
                  )}
                </div>
              </form>
            )}
          </div>
          
          {/* Footer de la tarjeta */}
          <div className="bg-warm-100/50 p-4 text-center border-t border-warm-100">
            <p className="text-xs text-warm-400 font-medium tracking-wide">
              POWERED BY EVENTIX
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
