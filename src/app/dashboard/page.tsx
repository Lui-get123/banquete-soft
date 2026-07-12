'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col">
      {/* Navigation */}
      <nav className="nav-bar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-display font-bold text-primary-700 tracking-tight">
                Sistema de Acceso
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-warm-600 text-sm">
                Bienvenido, {user.username}
              </span>
              <button
                onClick={handleLogout}
                className="text-warm-500 hover:text-primary-600 font-medium text-sm transition-colors duration-200"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Welcome Section */}
        <div className="mb-10 animate-fadeInUp">
          <h2 className="text-3xl font-display font-bold text-warm-900 tracking-tight">
            Panel Principal
          </h2>
          <div className="bg-accent-500 h-1 w-16 rounded-full mt-3 mb-3" />
          <p className="text-warm-500">Seleccione una opción para comenzar</p>
        </div>

        {/* Dashboard Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Registrar Pago */}
          <Link
            href="/registro"
            className="card-hover p-6 cursor-pointer group animate-fadeInUp-delay-1"
          >
            <div className="flex items-center justify-center w-14 h-14 bg-primary-100 rounded-full mb-4 group-hover:scale-105 transition-transform duration-300">
              <svg
                className="w-7 h-7 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-warm-900 mb-1">
              Registrar Pago
            </h3>
            <p className="text-warm-500 text-sm leading-relaxed">
              Registrar nuevos asistentes y generar códigos QR
            </p>
            <div className="mt-4 flex items-center text-primary-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span>Ir a registro</span>
              <svg
                className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>

          {/* Escáner QR */}
          <Link
            href="/escaner"
            className="card-hover p-6 cursor-pointer group animate-fadeInUp-delay-2"
          >
            <div className="flex items-center justify-center w-14 h-14 bg-accent-100 rounded-full mb-4 group-hover:scale-105 transition-transform duration-300">
              <svg
                className="w-7 h-7 text-accent-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-warm-900 mb-1">
              Escáner QR
            </h3>
            <p className="text-warm-500 text-sm leading-relaxed">
              Validar entrada de asistentes usando códigos QR
            </p>
            <div className="mt-4 flex items-center text-accent-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span>Ir a escáner</span>
              <svg
                className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>

          {/* Administración */}
          <Link
            href="/admin"
            className="card-hover p-6 cursor-pointer group animate-fadeInUp-delay-3"
          >
            <div className="flex items-center justify-center w-14 h-14 bg-warm-200 rounded-full mb-4 group-hover:scale-105 transition-transform duration-300">
              <svg
                className="w-7 h-7 text-warm-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-warm-900 mb-1">
              Administración
            </h3>
            <p className="text-warm-500 text-sm leading-relaxed">
              Ver estadísticas y gestionar asistentes
            </p>
            <div className="mt-4 flex items-center text-warm-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span>Ir a admin</span>
              <svg
                className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-warm-400 text-sm">
          Banquete Pro Construcción © 2026
        </p>
      </footer>
    </div>
  );
}
