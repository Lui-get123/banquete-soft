'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function SuperAdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'superadmin') {
      router.push('/dashboard');
      return;
    }

    setUser(parsedUser);
    cargarClientes();
  }, [router]);

  const cargarClientes = async () => {
    try {
      const res = await apiFetch('/api/superadmin/clientes');
      if (res.ok) {
        const data = await res.json();
        setClientes(data);
      }
    } catch (error) {
      console.error('Error fetching clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'pending' : 'active';
    try {
      const res = await apiFetch('/api/superadmin/clientes', {
        method: 'PATCH',
        body: JSON.stringify({ id, status: newStatus })
      });

      if (res.ok) {
        const updated = await res.json();
        setClientes(prev => prev.map(c => c.id === id ? { ...c, status: updated.status } : c));
      } else {
        alert('Error al actualizar estado');
      }
    } catch (e) {
      alert('Error de conexión');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user || loading) return null;

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col">
      <nav className="nav-bar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-accent-600 to-accent-400 flex items-center justify-center shadow-lg mr-2">
                <span className="text-white font-display font-bold">SA</span>
              </div>
              <h1 className="text-xl font-display font-bold text-warm-900 tracking-tight">
                Panel Maestro
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-warm-600 text-sm font-semibold text-accent-600">
                Super Admin
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

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="mb-10 animate-fadeInUp">
          <h2 className="text-3xl font-display font-bold text-warm-900 tracking-tight">
            Gestión de Clientes (SaaS)
          </h2>
          <div className="bg-accent-500 h-1 w-16 rounded-full mt-3 mb-3" />
          <p className="text-warm-500">Administra las cuentas de las empresas que usan BanqueteSoft.</p>
        </div>

        <div className="bg-white shadow-sm border border-warm-200 rounded-3xl overflow-hidden animate-fadeInUp-delay-1">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-warm-100 border-b border-warm-200">
                  <th className="py-4 px-6 font-semibold text-warm-800 text-sm">ID</th>
                  <th className="py-4 px-6 font-semibold text-warm-800 text-sm">Empresa (Usuario)</th>
                  <th className="py-4 px-6 font-semibold text-warm-800 text-sm">Fecha Registro</th>
                  <th className="py-4 px-6 font-semibold text-warm-800 text-sm">Estado</th>
                  <th className="py-4 px-6 font-semibold text-warm-800 text-sm text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-warm-500">
                      No hay clientes registrados.
                    </td>
                  </tr>
                ) : (
                  clientes.map((cliente) => (
                    <tr key={cliente.id} className="border-b border-warm-100 hover:bg-warm-50 transition-colors">
                      <td className="py-4 px-6 text-sm text-warm-600">#{cliente.id}</td>
                      <td className="py-4 px-6 text-sm font-semibold text-warm-900">{cliente.username}</td>
                      <td className="py-4 px-6 text-sm text-warm-600">
                        {new Date(cliente.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          cliente.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {cliente.status === 'active' ? 'Activo' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleToggleStatus(cliente.id, cliente.status)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                            cliente.status === 'active'
                              ? 'bg-warm-100 text-warm-700 hover:bg-warm-200'
                              : 'bg-primary-600 text-white hover:bg-primary-700'
                          }`}
                        >
                          {cliente.status === 'active' ? 'Desactivar' : 'Aprobar Cuenta'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
