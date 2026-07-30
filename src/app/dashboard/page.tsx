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
  const [nuevoEventoPrecio, setNuevoEventoPrecio] = useState('0');
  const [creandoEvento, setCreandoEvento] = useState(false);
  const [editandoEvento, setEditandoEvento] = useState(false);
  const [eventoEditNombre, setEventoEditNombre] = useState('');
  const [eventoEditPrecio, setEventoEditPrecio] = useState('0');
  const [configCompleta, setConfigCompleta] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      window.location.href = '/login';
      return;
    }

    const parsedUser = JSON.parse(userData);

    if (parsedUser.role === 'superadmin') {
      window.location.href = '/superadmin';
      return;
    }

    setUser(parsedUser);
    
    if (parsedUser.status === 'active') {
      cargarEventos();
      verificarConfiguracion();
    }
  }, [router]);

  const verificarConfiguracion = async () => {
    try {
      const res = await apiFetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        const tieneWhatsapp = !!data.whatsapp_contacto;
        const tieneEmail = !!data.email_user && !!data.email_pass;
        setConfigCompleta(tieneWhatsapp && tieneEmail);
      }
    } catch (error) {
      console.error('Error verificando config:', error);
    }
  };

  const cargarEventos = async () => {
    try {
      const res = await apiFetch('/api/eventos');
      if (res.ok) {
        const data = await res.json();
        setEventos(data);
        
        const guardado = localStorage.getItem('evento_id');
        if (guardado && data.find((e: any) => e.id.toString() === guardado)) {
          setEventoActivo(guardado);
          const current = data.find((e: any) => e.id.toString() === guardado);
          if (current) {
            setEventoEditNombre(current.nombre);
            setEventoEditPrecio((current.precio_boleta || 0).toString());
          }
        } else if (data.length > 0) {
          setEventoActivo(data[0].id.toString());
          localStorage.setItem('evento_id', data[0].id.toString());
          setEventoEditNombre(data[0].nombre);
          setEventoEditPrecio((data[0].precio_boleta || 0).toString());
        } else {
          setEventoActivo('');
          localStorage.removeItem('evento_id');
        }
      }
    } catch (error) {
      console.error('Error cargando eventos:', error);
    }
  };

  const handleCambiarEvento = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const eid = e.target.value;
    setEventoActivo(eid);
    localStorage.setItem('evento_id', eid);
    const ev = eventos.find((ev: any) => ev.id.toString() === eid);
    if (ev) {
      setEventoEditNombre(ev.nombre);
      setEventoEditPrecio((ev.precio_boleta || 0).toString());
      setEditandoEvento(false);
    }
    window.location.href = '/dashboard';
  };

  const handleCrearEvento = async () => {
    if (!nuevoEventoNombre.trim()) return;
    setCreandoEvento(true);
    try {
      const response = await apiFetch('/api/eventos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nuevoEventoNombre, precio_boleta: parseFloat(nuevoEventoPrecio) || 0 }),
      });
      if (response.ok) {
        setNuevoEventoNombre('');
        setNuevoEventoPrecio('0');
        await cargarEventos();
      } else {
        alert('Error al crear evento');
      }
    } catch (error) {
      console.error(error);
      alert('Error al crear evento');
    } finally {
      setCreandoEvento(false);
    }
  };

  const handleGuardarEdicion = async () => {
    if (!eventoEditNombre.trim()) return;
    try {
      const response = await apiFetch('/api/eventos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: parseInt(eventoActivo), 
          nombre: eventoEditNombre, 
          precio_boleta: parseFloat(eventoEditPrecio) || 0 
        }),
      });

      if (!response.ok) throw new Error('Error al actualizar');
      
      alert('Evento actualizado correctamente');
      setEditandoEvento(false);
      cargarEventos();
    } catch (error) {
      console.error(error);
      alert('Error al actualizar evento');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
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
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain drop-shadow-sm" />
              <h1 className="text-xl font-display font-bold text-primary-700 tracking-tight">
                Eventix
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
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column - Titles and Cards */}
          <div className="flex-1">
            <div className="mb-8 animate-fadeInUp">
              <h2 className="text-3xl font-display font-bold text-warm-900 tracking-tight">
                Panel Principal
              </h2>
              <div className="bg-accent-500 h-1 w-16 rounded-full mt-3 mb-3" />
              <p className="text-warm-500">Seleccione una opción para comenzar</p>
            </div>

            {/* Dashboard Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <DashboardCard
            href="/registro"
            title="Registrar Pago"
            desc="Registrar nuevos asistentes y generar códigos QR"
            delayClass="animate-fadeInUp-delay-1"
            baseColorClass="bg-primary-100"
            iconColorClass="text-primary-600"
            disabled={!eventoActivo}
            needsConfig={!configCompleta}
            icon={
              <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          />

          <DashboardCard
            href="/escaner"
            title="Escáner QR"
            desc="Validar entrada de asistentes usando códigos QR"
            delayClass="animate-fadeInUp-delay-2"
            baseColorClass="bg-accent-100"
            iconColorClass="text-accent-600"
            disabled={!eventoActivo}
            icon={
              <svg className="w-7 h-7 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            }
          />

          <DashboardCard
            href="/admin/asistentes"
            title="Asistentes"
            desc="Ver y gestionar lista de asistentes y tickets"
            delayClass="animate-fadeInUp-delay-3"
            baseColorClass="bg-warm-200"
            iconColorClass="text-warm-600"
            disabled={!eventoActivo}
            needsConfig={!configCompleta}
            icon={
              <svg className="w-7 h-7 text-warm-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />

          <DashboardCard
            href="/admin/diseno-boleta"
            title="Diseño de Boleta"
            desc="Personalizar colores, logo y texto de la boleta"
            delayClass="animate-fadeInUp-delay-5"
            baseColorClass="bg-indigo-100"
            iconColorClass="text-indigo-600"
            disabled={!eventoActivo}
            icon={
              <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            }
          />
          
          <DashboardCard
            href="/admin/eventos"
            title="Mis Eventos"
            desc="Gestionar, ver estadísticas y descargar reportes de todos tus eventos"
            delayClass="animate-fadeInUp-delay-6"
            baseColorClass="bg-rose-100"
            iconColorClass="text-rose-600"
            disabled={false}
            icon={
              <svg className="w-7 h-7 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
          />

          <DashboardCard
            href="/admin/mesas"
            title="Asignación de Mesas"
            desc="Diseñar salón y asignar sillas a invitados"
            delayClass="animate-fadeInUp-delay-3"
            baseColorClass="bg-success-100"
            iconColorClass="text-success-600"
            disabled={!eventoActivo}
            icon={
              <svg className="w-7 h-7 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />

          <DashboardCard
            href="/admin/estadisticas"
            title="Estadísticas"
            desc="Centro de mando y gráficos financieros"
            delayClass="animate-fadeInUp-delay-3"
            baseColorClass="bg-indigo-100"
            iconColorClass="text-indigo-600"
            disabled={!eventoActivo}
            icon={
              <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            }
          />
          <DashboardCard 
            href="/admin/configuracion"
            title="Configuración"
            desc="Configura tu WhatsApp para pagos"
            delayClass="animate-fadeInUp-delay-4"
            baseColorClass="bg-yellow-100"
            iconColorClass="text-yellow-600"
            disabled={false}
            icon={
              <svg className="w-7 h-7 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
        </div>
          </div>

          {/* Right Column - Event Form */}
          <div className="w-full lg:w-80 shrink-0 animate-fadeInUp">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-warm-200 sticky top-6">
              <label className="block text-sm font-bold text-primary-700 mb-2">Evento Activo</label>
              <select 
                className="input-field mb-4 bg-warm-50 text-sm"
                value={eventoActivo}
                onChange={handleCambiarEvento}
              >
                {eventos.map(e => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
              
              <div className="flex flex-col gap-3 mb-4">
                <input 
                  type="text" 
                  className="input-field text-sm" 
                  placeholder="Nombre de nuevo evento..."
                  value={nuevoEventoNombre}
                  onChange={e => setNuevoEventoNombre(e.target.value)}
                />
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-warm-500 text-sm">$</span>
                  <input 
                    type="number" 
                    className="input-field text-sm pl-7" 
                    placeholder="Precio boleta (0 = Gratis)"
                    value={nuevoEventoPrecio}
                    onChange={e => setNuevoEventoPrecio(e.target.value)}
                  />
                </div>
                <button 
                  onClick={handleCrearEvento}
                  disabled={creandoEvento || !nuevoEventoNombre.trim()}
                  className="btn-primary w-full text-sm font-bold px-4 py-2.5 disabled:opacity-50"
                >
                  Crear Evento
                </button>
              </div>

              {eventoActivo && (
                <div className="mt-5 pt-5 border-t border-warm-100">
                  {configCompleta ? (
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/e/${eventoActivo}`;
                        navigator.clipboard.writeText(url);
                        alert('¡Enlace de invitación copiado al portapapeles!');
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-warm-100 hover:bg-warm-200 text-warm-700 text-sm font-semibold py-2.5 rounded-xl transition-colors border border-warm-200"
                      title="Copiar Enlace de Invitación"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      Copiar Enlace de Registro Público
                    </button>
                  ) : (
                    <div className="text-center p-3 bg-amber-50 rounded-xl border border-dashed border-amber-300">
                      <p className="text-amber-700 text-xs font-medium">⚠️ Configura tu WhatsApp y correo Gmail para habilitar el registro público</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-warm-400 text-sm">
          Eventix © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}

const DashboardCard = ({
  href,
  title,
  desc,
  icon,
  delayClass,
  baseColorClass,
  iconColorClass,
  disabled,
  needsConfig
}: any) => {
  if (needsConfig) {
    return (
      <div
        onClick={() => alert('Para usar esta función, primero ve a Configuración y registra tu número de WhatsApp y tu correo Gmail con contraseña de aplicación.')}
        className={`card-hover p-6 cursor-pointer group ${delayClass} bg-amber-50 border-2 border-dashed border-amber-300`}
      >
        <div className={`flex items-center justify-center w-14 h-14 bg-amber-100 rounded-full mb-4`}>
          <div className="text-amber-500">
            {icon}
          </div>
        </div>
        <h3 className="text-lg font-semibold text-amber-800 mb-1">{title}</h3>
        <p className="text-amber-600 text-sm leading-relaxed">Configura WhatsApp y correo primero</p>
      </div>
    );
  }

  if (disabled) {
    return (
      <div
        onClick={() => alert('Debes crear o seleccionar un evento primero para acceder a esta opción.')}
        className={`card-hover p-6 cursor-not-allowed group ${delayClass} bg-danger-50 border border-danger-200 opacity-80`}
      >
        <div className={`flex items-center justify-center w-14 h-14 bg-danger-100 rounded-full mb-4`}>
          <div className="text-danger-500">
            {icon}
          </div>
        </div>
        <h3 className="text-lg font-semibold text-danger-900 mb-1">{title}</h3>
        <p className="text-danger-600 text-sm leading-relaxed">{desc}</p>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={`card-hover p-6 cursor-pointer group ${delayClass}`}
    >
      <div className={`flex items-center justify-center w-14 h-14 ${baseColorClass} rounded-full mb-4 group-hover:scale-105 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-warm-900 mb-1">{title}</h3>
      <p className="text-warm-500 text-sm leading-relaxed">{desc}</p>
    </Link>
  );
};
