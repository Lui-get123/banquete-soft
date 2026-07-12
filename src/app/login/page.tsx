'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-warm-100 via-warm-50 to-primary-50 px-4 relative overflow-hidden">
      {/* Decorative background circles for visual depth */}
      <div
        className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary-100 opacity-40 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-accent-100 opacity-30 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-md w-full relative z-10 animate-fadeInUp">
        {/* Header section */}
        <div className="flex flex-col items-center text-center mb-8">
          {/* Gold accent bar */}
          <div className="mb-5">
            <span className="block w-12 h-1.5 rounded-full bg-accent-500" />
          </div>

          {/* Icon circle */}
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-800 rounded-full mb-5 shadow-lg shadow-primary-600/20">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h1 className="text-3xl font-display font-bold text-primary-800 tracking-tight">
            Sistema de Acceso
          </h1>
          <p className="text-warm-500 mt-2 text-sm tracking-wide">
            Gestión de Banquetes y Eventos
          </p>
        </div>

        {/* Login card */}
        <div className="card shadow-xl shadow-warm-900/5 animate-fadeInUp-delay-1">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label-field">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="Ingrese su usuario"
                required
              />
            </div>

            <div>
              <label className="label-field">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Ingrese su contraseña"
                required
              />
            </div>

            {error && (
              <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0 text-danger-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Iniciando sesión...
                </span>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 mb-4 flex items-center gap-3">
            <div className="flex-1 h-px bg-warm-200" />
            <span className="text-xs text-warm-400 uppercase tracking-widest">Credenciales</span>
            <div className="flex-1 h-px bg-warm-200" />
          </div>

          {/* Default credentials hint */}
          <div className="text-center text-sm text-warm-400 space-y-0.5">
            <p>
              Usuario por defecto: <strong className="text-warm-600 font-medium">admin</strong>
            </p>
            <p>
              Contraseña por defecto: <strong className="text-warm-600 font-medium">admin123</strong>
            </p>
          </div>
        </div>

        {/* Footer accent */}
        <div className="mt-8 text-center animate-fadeInUp-delay-2">
          <span className="inline-block w-8 h-1 rounded-full bg-accent-500 opacity-60" />
        </div>
      </div>
    </div>
  );
}
