import Link from 'next/link';
import { ArrowRight, CheckCircle, Calendar, Users, Shield, QrCode, Mail, Smartphone, BarChart3, Clock } from 'lucide-react';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-warm-50 text-warm-900 font-sans selection:bg-primary-200 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-warm-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Eventix Logo" className="w-16 h-16 object-contain drop-shadow-md" />
              <span className="font-display font-extrabold text-2xl text-warm-900 tracking-tight">Eventix</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/login" className="text-base font-semibold text-warm-600 hover:text-primary-600 transition-colors">
                Iniciar Sesión
              </Link>
              <Link href="/registro-cliente" className="text-base font-bold bg-primary-600 text-white px-6 py-2.5 rounded-xl hover:bg-primary-700 transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5">
                Empezar Gratis
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section (Split Layout) */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
        <div className="absolute top-40 left-0 w-72 h-72 bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-0 w-72 h-72 bg-accent-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        
        <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
          <div className="flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-bold mb-8 shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              La Plataforma Definitiva
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-extrabold tracking-tight text-warm-900 mb-6 leading-tight">
              Control total para tus <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-500">Eventos Exclusivos</span>.
            </h1>
            
            <p className="text-lg md:text-xl text-warm-600 mb-10 max-w-lg leading-relaxed">
              Gestiona el acceso con QR, distribuye mesas interactivas y envía boletas desde tu propio correo corporativo. Todo en un solo lugar.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link href="/registro-cliente" className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-primary-700 hover:scale-105 transition-all shadow-xl shadow-primary-600/30">
                Crear Cuenta Gratis
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            
            <div className="mt-8 flex items-center gap-4 text-sm text-warm-500 font-medium">
              <div className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-primary-500" /> Sin tarjeta de crédito</div>
              <div className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-primary-500" /> Configuración en 5 min</div>
            </div>
          </div>
          
          <div className="relative w-full h-[400px] md:h-[600px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white/50 bg-white/20 backdrop-blur-sm transform md:rotate-2 hover:rotate-0 transition-transform duration-500">
            {/* Mockup Placeholder - We'll use Next/Image assuming it's available */}
            <div className="absolute inset-0 bg-gradient-to-br from-warm-100 to-warm-200 animate-pulse"></div>
            <Image 
              src="/mockup.jpg" 
              alt="Dashboard de Eventix" 
              layout="fill" 
              objectFit="cover"
              className="relative z-10 hover:scale-105 transition-transform duration-700"
              priority
            />
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 bg-white border-y border-warm-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold tracking-widest text-primary-600 uppercase mb-3">Flujo de Trabajo</h2>
            <h3 className="text-3xl md:text-4xl font-display font-extrabold text-warm-900">¿Cómo funciona Eventix?</h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-primary-200 via-accent-200 to-primary-200 -translate-y-1/2 z-0"></div>
            
            <StepCard 
              number="1"
              title="Crea y Configura"
              description="Diseña tu evento, sube tu logo y vincula tu cuenta de WhatsApp y Gmail para un branding 100% tuyo."
              icon={<Calendar className="w-6 h-6 text-primary-600" />}
            />
            <StepCard 
              number="2"
              title="Vende y Envía"
              description="Los asistentes pagan y reciben boletas con códigos QR únicos directamente desde tu correo."
              icon={<Mail className="w-6 h-6 text-accent-600" />}
            />
            <StepCard 
              number="3"
              title="Escanea y Controla"
              description="Usa cualquier celular para escanear los QR en la puerta. Verifica acceso y ubica asistentes en sus mesas."
              icon={<QrCode className="w-6 h-6 text-emerald-600" />}
            />
          </div>
        </div>
      </section>

      {/* Extended Features Grid */}
      <section className="py-24 bg-warm-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-sm font-bold tracking-widest text-primary-600 uppercase mb-3">Características</h2>
            <h3 className="text-3xl md:text-4xl font-display font-extrabold text-warm-900 mb-6">Todo lo que necesitas, sin complicaciones</h3>
            <p className="text-lg text-warm-600">Eventix está diseñado para darte control absoluto sobre tus eventos, protegiendo tu marca y agilizando la logística.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Shield className="w-8 h-8 text-emerald-600" />}
              title="Control de Acceso Seguro"
              description="Escáner QR integrado que previene fraudes. Visualiza foto, datos y estado del asistente al instante."
            />
            <FeatureCard 
              icon={<Mail className="w-8 h-8 text-primary-600" />}
              title="Marca Blanca (White-label)"
              description="Las boletas se envían usando tus propias credenciales de Gmail. Tus clientes nunca verán nuestro nombre."
            />
            <FeatureCard 
              icon={<Smartphone className="w-8 h-8 text-green-600" />}
              title="Integración WhatsApp"
              description="Recibe notificaciones de pago y solicitudes directamente en el WhatsApp de tu empresa."
            />
            <FeatureCard 
              icon={<Users className="w-8 h-8 text-accent-500" />}
              title="Asientos Inteligentes"
              description="Panel visual para asignar mesas, controlar la capacidad y agilizar el servicio de catering."
            />
            <FeatureCard 
              icon={<BarChart3 className="w-8 h-8 text-blue-600" />}
              title="Métricas en Tiempo Real"
              description="Dashboard con ingresos, cantidad de boletas vendidas y asistentes aprobados al momento."
            />
            <FeatureCard 
              icon={<Clock className="w-8 h-8 text-orange-500" />}
              title="Multi-Evento Aislado"
              description="Gestiona bodas, graduaciones y congresos simultáneamente sin cruzar datos ni asistentes."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-warm-900 pt-16 pb-8 border-t border-warm-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 border-b border-warm-800 pb-12">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Eventix Logo" className="w-12 h-12 object-contain grayscale opacity-70" />
              <span className="font-display font-bold text-xl text-warm-100 tracking-tight">Eventix</span>
            </div>
            <div className="text-warm-400 text-sm text-center md:text-right">
              Plataforma SaaS para Gestión de Eventos Profesionales
            </div>
          </div>
          <div className="text-center text-warm-500 text-sm font-medium">
            <p>© {new Date().getFullYear()} Eventix. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StepCard({ number, title, description, icon }: { number: string, title: string, description: string, icon: React.ReactNode }) {
  return (
    <div className="relative z-10 flex flex-col items-center text-center group">
      <div className="w-20 h-20 bg-white rounded-2xl shadow-xl shadow-warm-200/50 flex items-center justify-center mb-6 border-2 border-warm-50 group-hover:border-primary-200 group-hover:-translate-y-2 transition-all duration-300 relative">
        <div className="absolute -top-3 -right-3 w-8 h-8 bg-warm-900 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
          {number}
        </div>
        {icon}
      </div>
      <h4 className="text-xl font-bold text-warm-900 mb-3">{title}</h4>
      <p className="text-warm-600 leading-relaxed text-sm">{description}</p>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white p-8 rounded-3xl border border-warm-100 hover:shadow-2xl hover:shadow-warm-200/50 hover:-translate-y-1 transition-all duration-300">
      <div className="w-14 h-14 bg-warm-50 rounded-2xl flex items-center justify-center shadow-inner border border-warm-100 mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-warm-900 mb-3">{title}</h3>
      <p className="text-warm-600 leading-relaxed text-sm">{description}</p>
    </div>
  );
}
