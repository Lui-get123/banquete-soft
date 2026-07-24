import Link from 'next/link';
import { ArrowRight, CheckCircle, Calendar, Users, Shield } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-warm-50 text-warm-900 font-sans selection:bg-primary-200">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-warm-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center shadow-lg">
                <span className="text-white font-display font-bold text-xl">B</span>
              </div>
              <span className="font-display font-bold text-xl text-warm-900">BanqueteSoft</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium text-warm-600 hover:text-primary-600 transition-colors">
                Iniciar Sesión
              </Link>
              <Link href="/registro-cliente" className="text-sm font-medium bg-primary-600 text-white px-4 py-2 rounded-xl hover:bg-primary-700 transition-all shadow-md hover:shadow-lg">
                Registrar Empresa
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-sm font-semibold mb-6 animate-fadeInUp">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
          </span>
          La Plataforma SaaS Definitiva para Eventos
        </div>
        
        <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tight text-warm-900 mb-6 max-w-4xl animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          Gestiona los accesos y mesas de tus <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-500">Eventos</span> con Elegancia.
        </h1>
        
        <p className="text-lg md:text-xl text-warm-600 mb-10 max-w-2xl animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          Todo lo que necesitas para el control de acceso con QR, la distribución interactiva de mesas y métricas financieras en tiempo real. Creado para agencias de eventos premium.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
          <Link href="/registro-cliente" className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-primary-700 hover:scale-105 transition-all shadow-xl shadow-primary-600/20">
            Empieza Ahora
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-white text-warm-800 border-2 border-warm-200 px-8 py-4 rounded-2xl font-bold text-lg hover:border-primary-200 hover:bg-primary-50 transition-all">
            Ingresar al Panel
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-display font-bold text-warm-900">Por qué elegir BanqueteSoft</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Calendar className="w-8 h-8 text-primary-600" />}
              title="Multi-Evento"
              description="Gestiona bodas, graduaciones y fiestas simultáneamente de forma 100% aislada."
            />
            <FeatureCard 
              icon={<Users className="w-8 h-8 text-accent-500" />}
              title="Asientos Inteligentes"
              description="Panel interactivo de mesas con control de ocupación y servicio de catering en tiempo real."
            />
            <FeatureCard 
              icon={<Shield className="w-8 h-8 text-emerald-600" />}
              title="Seguridad Total"
              description="Escáner QR integrado, reenvío automático de boletos y reportes financieros cifrados."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-warm-900 py-12 text-center text-warm-400">
        <p className="text-sm">© {new Date().getFullYear()} BanqueteSoft. Todos los derechos reservados.</p>
        <p className="text-xs mt-2">Plataforma administrada por SuperAdmin.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-warm-50 p-8 rounded-3xl border border-warm-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-warm-900 mb-3">{title}</h3>
      <p className="text-warm-600 leading-relaxed">{description}</p>
    </div>
  );
}
