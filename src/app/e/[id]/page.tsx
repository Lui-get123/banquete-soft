'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { generarImagenBoleta } from '@/lib/boleta-utils';

export default function PublicEventRegistrationPage({
  params
}: {
  params: { id: string }
}) {
  const router = useRouter();
  const eventoId = params.id;

  const [eventoNombre, setEventoNombre] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    documento: '',
    telefono: '',
    email: ''
  });

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/public/eventos/${eventoId}`);
        const data = await res.json();
        
        if (res.ok) {
          setEventoNombre(data.nombre);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // 1. Register attendee
      const regRes = await fetch('/api/public/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evento_id: eventoId,
          telefono: formData.telefono,
          email: formData.email,
          asistentes: [{
            nombre: formData.nombre,
            documento: formData.documento
          }]
        })
      });

      const regData = await regRes.json();
      if (!regRes.ok) throw new Error(regData.error || 'Error en el registro');

      // 2. Generate Ticket Image
      const asistente = regData[0];
      const imagenBase64 = await generarImagenBoleta(asistente);

      // 3. Send Email
      const emailRes = await fetch('/api/public/enviar-boletas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          boletasBase64: [imagenBase64]
        })
      });

      const emailData = await emailRes.json();
      if (!emailRes.ok) console.warn('Advertencia: No se pudo enviar el correo', emailData.error);

      setSuccess(true);
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

  if (success) {
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
            Hemos generado tu boleta y te la enviamos a <strong>{formData.email}</strong>. 
            Revisa tu bandeja de entrada o spam.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary w-full shadow-lg shadow-primary-600/20"
          >
            Registrar a otra persona
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col items-center justify-center p-4 sm:p-8">
      {/* Decorative background */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary-900 to-warm-50 z-0"></div>
      
      <div className="bg-white p-8 sm:p-10 rounded-[2rem] shadow-2xl w-full max-w-lg z-10 animate-fadeInUp relative overflow-hidden">
        {/* Shine effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-400 via-primary-500 to-accent-400"></div>

        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 bg-primary-50 text-primary-700 text-xs font-bold uppercase tracking-wider rounded-full mb-4">
            Invitación Oficial
          </span>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-warm-900 mb-2 leading-tight">
            {eventoNombre}
          </h1>
          <p className="text-warm-500 text-sm">Completa tus datos para recibir tu boleta de acceso QR.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label-field">Nombre Completo</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              className="input-field"
              placeholder="Ej. Juan Pérez"
              required
            />
          </div>

          <div>
            <label className="label-field">Documento de Identidad</label>
            <input
              type="text"
              name="documento"
              value={formData.documento}
              onChange={handleInputChange}
              className="input-field"
              placeholder="Tu número de documento"
              required
            />
          </div>

          <div>
            <label className="label-field">Teléfono / WhatsApp</label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleInputChange}
              className="input-field"
              placeholder="+123456789"
              required
            />
          </div>

          <div>
            <label className="label-field">Correo Electrónico</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="input-field"
              placeholder="tu@correo.com"
              required
            />
            <p className="text-xs text-warm-400 mt-1 ml-1">
              Aquí enviaremos tu boleta con el código QR.
            </p>
          </div>

          {error && (
            <div className="bg-danger-50 border border-danger-100 text-danger-600 px-4 py-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-primary mt-4 py-4 text-lg font-bold shadow-xl shadow-primary-600/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generando Boleta...
              </span>
            ) : (
              'Confirmar Asistencia'
            )}
          </button>
        </form>
      </div>

      <p className="text-warm-400 text-xs mt-8 z-10">
        Tecnología de BanqueteSoft © {new Date().getFullYear()}
      </p>
    </div>
  );
}
