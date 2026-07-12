'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { formatCurrency } from '@/lib/utils';

export default function RegistroPage() {
  const router = useRouter();
  
  const [numBoletas, setNumBoletas] = useState<number | ''>('');
  const [boletas, setBoletas] = useState<{nombre: string, documento: string, monto: number}[]>([]);
  const [comunes, setComunes] = useState({
    telefono: '',
    email: '',
    metodo_pago: 'transferencia',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [asistentesRegistrados, setAsistentesRegistrados] = useState<any[]>([]);
  const [boletasImagenes, setBoletasImagenes] = useState<string[]>([]);
  const [enviandoCorreo, setEnviandoCorreo] = useState(false);
  const [correoExito, setCorreoExito] = useState(false);

  const handleNumBoletasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setNumBoletas(isNaN(val) ? '' : val);
    
    if (!isNaN(val) && val > 0 && val <= 50) { 
      const newBoletas = [...boletas];
      while (newBoletas.length < val) {
        newBoletas.push({ nombre: '', documento: '', monto: 60000 });
      }
      if (newBoletas.length > val) {
        newBoletas.length = val;
      }
      setBoletas(newBoletas);
    } else {
      setBoletas([]);
    }
  };

  const handleBoletaChange = (index: number, field: string, value: string | number) => {
    const newBoletas = [...boletas];
    newBoletas[index] = { ...newBoletas[index], [field]: value } as any;
    setBoletas(newBoletas);
  };

  const handleComunesChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setComunes(prev => ({ ...prev, [name]: value }));
  };

  const generarImagenBoleta = async (asistente: any): Promise<string> => {
    const qrCanvas = document.createElement('canvas');
    await QRCode.toCanvas(qrCanvas, asistente.qr_token, {
      width: 200,
      margin: 1,
      color: {
        dark: '#5B2333',  
        light: '#00000000', 
      },
    }).catch(() => {});

    let qrImg = qrCanvas;
    if (qrCanvas.width <= 1) {
      const fallbackUrl = await QRCode.toDataURL(asistente.qr_token);
      const img = new Image();
      img.src = fallbackUrl;
      await new Promise((resolve) => { img.onload = resolve; });
      qrImg = img as any;
    }

    const templateImg = new Image();
    templateImg.src = '/boleta.jpeg';
    
    await new Promise((resolve) => {
      templateImg.onload = resolve;
      templateImg.onerror = () => resolve(null);
    });

    const canvas = document.createElement('canvas');
    canvas.width = templateImg.width || 800;
    canvas.height = templateImg.height || 1200;
    const ctx = canvas.getContext('2d')!;

    if (templateImg.width) {
      ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = '#F5F0E8';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const qrSize = Math.round(canvas.width * 0.18);
    const marginX = Math.round(canvas.width * 0.12);
    const marginY = Math.round(canvas.height * 0.08);
    const qrX = canvas.width - qrSize - marginX;
    const qrY = marginY;

    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

    const fontSize = Math.max(13, Math.round(canvas.width * 0.025));
    ctx.textAlign = 'center';
    const textCenterX = qrX + qrSize / 2;

    ctx.fillStyle = '#5B2333'; 
    ctx.font = `bold ${fontSize}px Georgia, serif`;
    const nameY = qrY + qrSize + fontSize + 6;

    const displayName = asistente.nombre.length > 22
      ? asistente.nombre.substring(0, 20) + '...'
      : asistente.nombre;
    ctx.fillText(displayName, textCenterX, nameY);

    return canvas.toDataURL('image/jpeg', 0.92);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numBoletas || boletas.length === 0) return;
    
    setError('');
    setLoading(true);

    try {
      const payload = {
        comunes,
        boletas
      };

      const response = await fetch('/api/asistentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar asistentes');
      }

      setAsistentesRegistrados(data);

      const imagenes = await Promise.all(data.map((asistente: any) => generarImagenBoleta(asistente)));
      setBoletasImagenes(imagenes);

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewRegistration = () => {
    setNumBoletas('');
    setBoletas([]);
    setComunes({
      telefono: '',
      email: '',
      metodo_pago: 'transferencia',
    });
    setSuccess(false);
    setAsistentesRegistrados([]);
    setBoletasImagenes([]);
    setCorreoExito(false);
  };

  const handleEnviarCorreo = async () => {
    setEnviandoCorreo(true);
    setError('');
    try {
      const response = await fetch('/api/enviar-boletas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: comunes.email,
          boletasBase64: boletasImagenes
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar correos');
      }

      setCorreoExito(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEnviandoCorreo(false);
    }
  };

  const handleDownloadAll = () => {
    boletasImagenes.forEach((base64, idx) => {
      const asistente = asistentesRegistrados[idx];
      const link = document.createElement('a');
      link.download = `boleta-${asistente.nombre.replace(/\s+/g, '-')}-${asistente.documento}.jpeg`;
      link.href = base64;
      link.click();
    });
  };

  return (
    <div className="min-h-screen bg-warm-50">
      <nav className="nav-bar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-warm-600 hover:text-primary-600 font-medium transition-colors duration-200"
              >
                ← Volver al Panel
              </button>
            </div>
            <div className="flex items-center">
              <h1 className="text-xl font-bold font-display text-primary-700">Registrar Pago</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!success ? (
          <div className="card animate-fadeInUp">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold font-display text-warm-900">Nuevo Registro de Pago</h2>
                <div className="h-1 w-12 bg-accent-500 rounded-full mt-1"></div>
              </div>
            </div>
            
            {error && (
              <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Configuration Step */}
              <div className="bg-white p-5 rounded-2xl border border-warm-200 shadow-sm">
                <label className="label-field text-lg mb-2">¿Cuántas boletas vas a generar?</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={numBoletas}
                  onChange={handleNumBoletasChange}
                  className="input-field text-xl"
                  placeholder="Ej: 2"
                  required
                />
              </div>

              {boletas.length > 0 && (
                <div className="space-y-6">
                  {/* Dynamic Fields */}
                  {boletas.map((boleta, idx) => (
                    <div key={idx} className="bg-warm-50/50 p-5 rounded-2xl border border-warm-200 shadow-sm animate-fadeInUp">
                      <h3 className="text-lg font-bold text-primary-700 mb-4 pb-2 border-b border-warm-200">
                        Datos Boleta {idx + 1}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="label-field">Nombre Completo *</label>
                          <input
                            type="text"
                            value={boleta.nombre}
                            onChange={(e) => handleBoletaChange(idx, 'nombre', e.target.value)}
                            className="input-field"
                            placeholder="Ej: Juan Pérez"
                            required
                          />
                        </div>
                        <div>
                          <label className="label-field">Documento *</label>
                          <input
                            type="text"
                            value={boleta.documento}
                            onChange={(e) => handleBoletaChange(idx, 'documento', e.target.value)}
                            className="input-field"
                            placeholder="Ej: 123456789"
                            required
                          />
                        </div>
                        <div>
                          <label className="label-field">Monto Pagado *</label>
                          <input
                            type="number"
                            value={boleta.monto}
                            onChange={(e) => handleBoletaChange(idx, 'monto', Number(e.target.value))}
                            className="input-field"
                            min="0"
                            step="1000"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Common Data */}
                  <div className="bg-white p-5 rounded-2xl border border-warm-200 shadow-sm animate-fadeInUp delay-100">
                    <h3 className="text-lg font-bold text-primary-700 mb-4 pb-2 border-b border-warm-200">
                      Datos de Contacto y Pago
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="label-field">Teléfono / WhatsApp *</label>
                        <input
                          type="tel"
                          name="telefono"
                          value={comunes.telefono}
                          onChange={handleComunesChange}
                          className="input-field"
                          placeholder="Ej: 3001234567"
                          required
                        />
                      </div>
                      <div>
                        <label className="label-field">Correo Electrónico *</label>
                        <input
                          type="email"
                          name="email"
                          value={comunes.email}
                          onChange={handleComunesChange}
                          className="input-field"
                          placeholder="Ej: correo@ejemplo.com"
                          required
                        />
                      </div>
                      <div>
                        <label className="label-field">Método de Pago *</label>
                        <select
                          name="metodo_pago"
                          value={comunes.metodo_pago}
                          onChange={handleComunesChange}
                          className="input-field"
                          required
                        >
                          <option value="transferencia">Transferencia Bancaria</option>
                          <option value="efectivo">Efectivo</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Submit Area */}
                  <div className="flex justify-end space-x-3 pt-6 border-t border-warm-200">
                    <button
                      type="button"
                      onClick={() => router.push('/dashboard')}
                      className="btn-secondary"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Generando {boletas.length} Boleta{boletas.length !== 1 ? 's' : ''}...
                        </span>
                      ) : `Generar ${boletas.length} Boleta${boletas.length !== 1 ? 's' : ''}`}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        ) : (
          <div className="card animate-fadeInUp text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-success-100 rounded-2xl mb-4">
              <svg className="w-10 h-10 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold font-display text-warm-900 mb-2">¡Registro Exitoso!</h2>
            <p className="text-lg text-warm-500 mb-8">Se generaron {asistentesRegistrados.length} boletas correctamente.</p>

            {error && (
              <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 justify-center">
                {error}
              </div>
            )}

            {correoExito && (
              <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 justify-center font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                ¡Correos enviados exitosamente!
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10">
              {boletasImagenes.map((imgUrl, idx) => (
                <div key={idx} className="bg-warm-50 rounded-2xl p-4 border border-warm-200 shadow-sm hover:shadow-warm transition-shadow">
                  <img src={imgUrl} alt={`Boleta ${idx + 1}`} className="w-full rounded-xl shadow-sm mb-3" />
                  <p className="font-bold text-warm-900">{asistentesRegistrados[idx]?.nombre}</p>
                  <p className="text-sm text-warm-500">Doc: {asistentesRegistrados[idx]?.documento}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={handleEnviarCorreo}
                disabled={enviandoCorreo || correoExito}
                className="btn-primary flex items-center justify-center gap-2"
              >
                {enviandoCorreo ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Enviando...
                  </span>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    Enviar Boletas por Correo
                  </>
                )}
              </button>
              
              <button
                onClick={handleDownloadAll}
                className="btn-accent flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Descargar Todo
              </button>
              
              <button
                onClick={handleNewRegistration}
                className="btn-secondary flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                Nuevo Registro
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

