'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
import { apiFetch } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

// Componente de escáner simple y seguro
const ScannerComponent = ({ onScan }: { onScan: (code: string) => void }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState('');
  const containerId = `scanner-${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      await new Promise(r => setTimeout(r, 150)); // Esperar DOM
      if (!mounted) return;

      const container = document.getElementById(containerId);
      if (!container) return;
      container.innerHTML = '';

      try {
        const scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: window.innerWidth > window.innerHeight 
              ? window.innerWidth / window.innerHeight 
              : window.innerHeight / window.innerWidth // Ayuda a que en celular se vea derecho y no volteado a 90 grados
          },
          (decodedText) => {
            if (mounted) onScan(decodedText);
          },
          () => {}
        );
      } catch (err) {
        console.error(err);
        setError('Error al iniciar la cámara');
      }
    };

    init();

    // Limpieza total al desmontar
    return () => {
      mounted = false;
      const cleanup = async () => {
        if (scannerRef.current) {
          try {
            await scannerRef.current.stop();
            await scannerRef.current.clear();
          } catch {}
          scannerRef.current = null;
        }
      };
      cleanup();
    };
  }, [onScan, containerId]);

  return (
    <div>
      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-xl mb-4 text-center text-sm">
          {error}
        </div>
      )}
      <div 
        id={containerId} 
        className="w-full overflow-hidden rounded-2xl bg-warm-900"
        style={{
          // Forzar que el video no se deforme
          "& video": {
            objectFit: "cover !important",
            width: "100% !important"
          }
        } as any}
      ></div>
      <style dangerouslySetInnerHTML={{__html: `
        #${containerId} video {
          object-fit: cover !important;
          width: 100% !important;
          height: auto !important;
          transform: none !important; 
        }
      `}} />
    </div>
  );
};

export default function EscanerPage() {
  const router = useRouter();
  const [asistente, setAsistente] = useState<any>(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(true);
  const [resetKey, setResetKey] = useState(0);

  const handleScan = async (qrToken: string) => {
    setScanning(false);
    try {
      const response = await apiFetch(`/api/asistentes/qr/${qrToken}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'QR no encontrado');
      setAsistente(data);
      setError('');
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setTimeout(() => setError(''), 3000);
      setScanning(true);
    }
  };

  const handleToggleStatus = async () => {
    if (!asistente) return;
    try {
      const nuevoEstado = asistente.estado === 'presente' ? 'no_presente' : 'presente';
      const response = await apiFetch(`/api/asistentes/${asistente.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error');
      setAsistente({ ...asistente, ...data });
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleReset = () => {
    setAsistente(null);
    setError('');
    setResetKey(prev => prev + 1); // Nuevo componente
    setScanning(true);
  };

  return (
    <div className="min-h-screen bg-warm-50">
      {/* Nav */}
      <nav className="nav-bar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-warm-600 hover:text-primary-600 font-medium transition-colors duration-200 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver al Panel
              </button>
            </div>
            <div className="flex items-center">
              <h1 className="text-xl font-display font-bold text-primary-700">Escáner QR</h1>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!asistente ? (
          /* ─── Scanner Card ─── */
          <div className="card animate-fadeInUp">
            <h2 className="text-2xl font-display font-bold text-warm-900 mb-6 text-center">
              Escanear Código QR
            </h2>

            {error && (
              <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-xl mb-4 text-center text-sm">
                {error}
              </div>
            )}

            {scanning && <ScannerComponent key={resetKey} onScan={handleScan} />}

            <p className="flex items-center justify-center gap-2 text-warm-500 mt-5 text-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-500"></span>
              </span>
              Apunte la cámara hacia el código QR del asistente
            </p>
          </div>
        ) : (
          /* ─── Result Card ─── */
          <div className="card animate-fadeInUp">
            {/* Person Icon & Name */}
            <div className="text-center mb-6">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                asistente.estado === 'presente' ? 'bg-accent-100' : 'bg-warm-200'
              }`}>
                <svg className={`w-10 h-10 ${
                  asistente.estado === 'presente' ? 'text-accent-600' : 'text-warm-500'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-display font-bold text-warm-900">{asistente.nombre}</h2>
              <p className="text-warm-500 mt-1">{asistente.documento}</p>
            </div>

            {/* Info Rows */}
            <div className="space-y-3 mb-6">
              {/* Estado */}
              <div className="flex justify-between items-center p-4 rounded-xl bg-warm-50 border border-warm-200">
                <span className="text-warm-600 text-sm">Estado:</span>
                <span className={`stat-badge ${
                  asistente.estado === 'presente'
                    ? 'bg-success-100 text-success-700'
                    : 'bg-warm-200 text-warm-600'
                }`}>
                  {asistente.estado === 'presente' ? '● Presente' : '○ No Presente'}
                </span>
              </div>

              {/* Monto Pagado */}
              <div className="flex justify-between items-center p-4 rounded-xl bg-warm-50 border border-warm-200">
                <span className="text-warm-600 text-sm">Monto Pagado:</span>
                <span className="font-semibold text-warm-900">{formatCurrency(asistente.monto)}</span>
              </div>

              {/* Método de Pago */}
              <div className="flex justify-between items-center p-4 rounded-xl bg-warm-50 border border-warm-200">
                <span className="text-warm-600 text-sm">Método de Pago:</span>
                <span className="font-semibold text-warm-900 capitalize">{asistente.metodo_pago}</span>
              </div>

              {/* Teléfono */}
              <div className="flex justify-between items-center p-4 rounded-xl bg-warm-50 border border-warm-200">
                <span className="text-warm-600 text-sm">Teléfono:</span>
                <span className="font-semibold text-warm-900">{asistente.telefono}</span>
              </div>

              {/* Hora de Ingreso */}
              {asistente.hora_ingreso && (
                <div className="flex justify-between items-center p-4 rounded-xl bg-accent-50 border border-accent-200">
                  <span className="text-accent-700 text-sm font-medium">Hora de Ingreso:</span>
                  <span className="font-semibold text-accent-700">{formatDate(asistente.hora_ingreso)}</span>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-xl mb-6 text-center text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-center gap-4">
              <button onClick={handleToggleStatus} className={`${
                asistente.estado === 'presente' ? 'btn-danger' : 'btn-success'
              }`}>
                {asistente.estado === 'presente' ? 'Marcar como No Presente' : 'Marcar como Presente'}
              </button>
              <button onClick={handleReset} className="btn-secondary">
                Escanear Otro
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
