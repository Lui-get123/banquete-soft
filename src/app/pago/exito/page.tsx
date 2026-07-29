'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';

export default function PagoExitosoPage() {
  const router = useRouter();
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setWindowDimensions({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  return (
    <div className="min-h-screen bg-warm-50 flex items-center justify-center p-4 relative overflow-hidden">
      {windowDimensions.width > 0 && (
        <Confetti 
          width={windowDimensions.width} 
          height={windowDimensions.height} 
          recycle={false}
          numberOfPieces={400}
        />
      )}
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl w-full max-w-md text-center border border-success-100 z-10 animate-fadeInUp">
        <div className="w-20 h-20 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-display font-bold text-warm-900 mb-4">¡Pago Exitoso!</h2>
        <p className="text-warm-600 mb-8 leading-relaxed text-lg">
          Hemos recibido tu pago y tu asistencia está confirmada. 
          Acabamos de enviar tu boleta al correo electrónico que registraste.
        </p>
        <div className="bg-warm-50 rounded-xl p-4 mb-8 text-sm text-warm-500">
          Revisa tu bandeja de entrada o la carpeta de SPAM.
        </div>
        <button
          onClick={() => window.location.href = '/'}
          className="w-full btn-primary py-4 text-lg font-bold shadow-xl shadow-primary-600/20 transition-all hover:-translate-y-0.5"
        >
          Volver al Inicio
        </button>
      </div>
    </div>
  );
}
