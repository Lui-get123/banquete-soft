'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  const [eventos, setEventos] = useState<any[]>([]);
  const [eventoActivo, setEventoActivo] = useState<string>('');
  const [nuevoEventoNombre, setNuevoEventoNombre] = useState('');
  const [creandoEvento, setCreandoEvento] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);

    if (parsedUser.role === 'superadmin') {
      router.push('/superadmin');
      return;
    }

    setUser(parsedUser);
    
    if (parsedUser.status === 'active') {
      cargarEventos();
    }
  }, [router]);

  const cargarEventos = async () => {
    try {
      const res = await apiFetch('/api/eventos');
      if (res.ok) {
        const data = await res.json();
        setEventos(data);
        
        const guardado = localStorage.getItem('evento_id');
        if (guardado && data.find((e: any) => e.id.toString() === guardado)) {
          setEventoActivo(guardado);
        } else if (data.length > 0) {
          setEventoActivo(data[0].id.toString());
          localStorage.setItem('evento_id', data[0].id.toString());
        }
      }
    } catch (error) {
      console.error('Error cargando eventos:', error);
    }
  };

  const handleCambiarEvento = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setEventoActivo(val);
    localStorage.setItem('evento_id', val);
    // Recargar para limpiar cualquier caché
    window.location.reload();
  };

  const handleCrearEvento = async () => {
    if (!nuevoEventoNombre.trim()) return;
    setCreandoEvento(true);
    try {
      const res = await apiFetch('/api/eventos', {
        method: 'POST',
        body: JSON.stringify({ nombre: nuevoEventoNombre.trim() })
      });
      if (res.ok) {
        setNuevoEventoNombre('');
        await cargarEventos();
      } else {
        alert('Error al crear evento');
      }
    } catch (e) {
      alert('Error de conexión');
    } finally {
      setCreandoEvento(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) {
    return null;
  }

  if (user.status === 'pending') {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-display font-bold text-warm-900 mb-2">Cuenta Pendiente</h2>
          <p className="text-warm-600 mb-6">
            Tu cuenta aún no ha sido aprobada. Un administrador está revisando tu solicitud. Por favor, intenta iniciar sesión más tarde.
          </p>
          <button onClick={handleLogout} className="inline-block w-full bg-warm-200 text-warm-800 font-bold py-3 rounded-xl hover:bg-warm-300 transition-colors">
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
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
        {/* Welcome & Event Selection */}
        <div className="mb-10 animate-fadeInUp flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl font-display font-bold text-warm-900 tracking-tight">
              Panel Principal
            </h2>
            <div className="bg-accent-500 h-1 w-16 rounded-full mt-3 mb-3" />
            <p className="text-warm-500">Seleccione una opción para comenzar</p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-warm-200 w-full md:w-auto min-w-[300px]">
            <label className="block text-sm font-bold text-primary-700 mb-2">Evento Activo</label>
            <select 
              className="input-field mb-3 bg-warm-50"
              value={eventoActivo}
              onChange={handleCambiarEvento}
            >
              {eventos.map(e => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </select>
            
            <div className="flex gap-2">
              <input 
                type="text" 
                className="input-field text-sm" 
                placeholder="Nuevo evento..."
                value={nuevoEventoNombre}
                onChange={e => setNuevoEventoNombre(e.target.value)}
              />
              <button 
                onClick={handleCrearEvento}
                disabled={creandoEvento || !nuevoEventoNombre.trim()}
                className="btn-primary text-sm whitespace-nowrap px-3 py-2 disabled:opacity-50"
              >
                Crear
              </button>
            </div>

            {eventoActivo && (
              <button
                onClick={() => {
                  const url = `${window.location.origin}/e/${eventoActivo}`;
                  navigator.clipboard.writeText(url);
                  alert('¡Enlace de invitación copiado al portapapeles!');
                }}
                className="w-full mt-3 flex items-center justify-center gap-2 bg-warm-100 hover:bg-warm-200 text-warm-700 text-sm font-semibold py-2 rounded-xl transition-colors border border-warm-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Copiar Enlace de Invitación
              </button>
            )}
          </div>
        </div>

        {/* Dashboard Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Registrar Pago */}
          <Link
            href="/registro"
            className="card-hover p-6 cursor-pointer group animate-fadeInUp-delay-1"
          >
            <div className="flex items-center justify-center w-14 h-14 bg-primary-100 rounded-full mb-4 group-hover:scale-105 transition-transform duration-300">
              <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-warm-900 mb-1">Registrar Pago</h3>
            <p className="text-warm-500 text-sm leading-relaxed">Registrar nuevos asistentes y generar códigos QR</p>
          </Link>

          {/* Escáner QR */}
          <Link
            href="/escaner"
            className="card-hover p-6 cursor-pointer group animate-fadeInUp-delay-2"
          >
            <div className="flex items-center justify-center w-14 h-14 bg-accent-100 rounded-full mb-4 group-hover:scale-105 transition-transform duration-300">
              <svg className="w-7 h-7 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-warm-900 mb-1">Escáner QR</h3>
            <p className="text-warm-500 text-sm leading-relaxed">Validar entrada de asistentes usando códigos QR</p>
          </Link>

          {/* Administración */}
          <Link
            href="/admin/asistentes"
            className="card-hover p-6 cursor-pointer group animate-fadeInUp-delay-3"
          >
            <div className="flex items-center justify-center w-14 h-14 bg-warm-200 rounded-full mb-4 group-hover:scale-105 transition-transform duration-300">
              <svg className="w-7 h-7 text-warm-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-warm-900 mb-1">Asistentes</h3>
            <p className="text-warm-500 text-sm leading-relaxed">Ver y gestionar lista de asistentes y tickets</p>
          </Link>

          {/* Asignación de Mesas */}
          <Link
            href="/admin/mesas"
            className="card-hover p-6 cursor-pointer group animate-fadeInUp-delay-3"
          >
            <div className="flex items-center justify-center w-14 h-14 bg-success-100 rounded-full mb-4 group-hover:scale-105 transition-transform duration-300">
              <svg className="w-7 h-7 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-warm-900 mb-1">Asignación de Mesas</h3>
            <p className="text-warm-500 text-sm leading-relaxed">Diseñar salón y asignar sillas a invitados</p>
          </Link>

          {/* Estadísticas */}
          <Link
            href="/admin/estadisticas"
            className="card-hover p-6 cursor-pointer group animate-fadeInUp-delay-3"
          >
            <div className="flex items-center justify-center w-14 h-14 bg-indigo-100 rounded-full mb-4 group-hover:scale-105 transition-transform duration-300">
              <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-warm-900 mb-1">Estadísticas</h3>
            <p className="text-warm-500 text-sm leading-relaxed">Centro de mando y gráficos financieros</p>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-warm-400 text-sm">
          BanqueteSoft © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
