//src/app/page.tsx
import Header from '@/components/ui/Header';
import {
  Search,
  ArrowRight,
  Check,
  Home,
  Phone,
  Mail,
  MapPin,
  Shield,
  Clock,
  Award,
  Users,
  Globe,
  Share2,
  MessageCircle,
} from 'lucide-react';

const HERO_STATS = [
  { number: '30+', label: 'Propiedades' },
  { number: '100+', label: 'Clientes satisfechos' },
  { number: '15+', label: 'Años de experiencia' },
  { number: '24hs', label: 'Tiempo de respuesta' },
];

const PROPERTY_TYPES = [
  {
    icon: Home,
    title: 'Departamentos en alquiler',
    desc: 'Monoambientes, 2, 3 y 4 ambientes en Libertador San Martín',
    features: ['Amoblados', 'Sin garantía', 'Listo para mudarse'],
    gradient: 'from-brand-primary to-brand-primary-dark',
  },
  {
    icon: Home,
    title: 'Casas y terrenos',
    desc: 'Con jardín, parrilla, terraza o pileta en Entre Ríos',
    features: ['Zonas exclusivas', 'Amplios espacios', 'Excelente ubicación'],
    gradient: 'from-brand-accent to-[#e6af32]',
  },
  {
    icon: Home,
    title: 'Propiedades en venta',
    desc: 'Departamentos, casas y oportunidades únicas en la región',
    features: ['Financiación', 'Escrituración', 'Asesoramiento legal'],
    gradient: 'from-brand-primary-dark to-brand-primary',
  },
];

const WHY_US = [
  { icon: MapPin, title: 'Conocimiento local', desc: 'Expertos en el mercado de Entre Ríos' },
  { icon: Shield, title: 'Seguridad garantizada', desc: 'Trámites verificados y seguros' },
  { icon: Clock, title: 'Respuesta rápida', desc: 'Atención en menos de 24 horas' },
  { icon: Award, title: 'Profesionalismo', desc: 'Asesoramiento especializado' },
  { icon: Users, title: 'Atención personalizada', desc: 'Servicio adaptado a tus necesidades' },
  { icon: Check, title: 'Propiedades verificadas', desc: 'Todas nuestras propiedades están validadas' },
  { icon: Home, title: 'Múltiples garantías', desc: 'Aceptamos diferentes tipos de garantía' },
  { icon: Phone, title: 'Soporte continuo', desc: 'Estamos disponibles cuando nos necesites' },
];

const CONTACT_METHODS = [
  {
    href: 'tel:03447123456',
    icon: Phone,
    iconBg: 'bg-sky-500',
    iconColor: 'text-white',
    title: '03447-123456',
    subtitle: 'Lun a Vie • 9 a 18 hs',
    subtitle2: 'Sáb • 9 a 13 hs',
  },
  {
    href: 'https://wa.me/5491123456789',
    icon: MessageCircle,
    iconBg: 'bg-green-500',
    iconColor: 'text-white',
    title: 'WhatsApp',
    subtitle: 'Respuesta inmediata',
    subtitle2: '24/7 disponible',
    external: true,
  },
  {
    href: 'mailto:info@libertadorsanmartin.com.ar',
    icon: Mail,
    iconBg: 'bg-brand-accent/20',
    iconColor: 'text-brand-accent',
    title: 'Email',
    subtitle: 'info@libertadorsanmartin.com.ar',
    subtitle2: null,
  },
];

function HeroSection() {
  return (
    <section className="relative text-white overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/InsideGBS.jpeg')" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#2e2e2e]/90 via-[#3d3d3d]/85 to-black/80" aria-hidden="true" />
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-72 h-72 bg-white/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-white/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
        <div className="text-center">
          <div className="inline-block mb-6 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
            <p className="text-sm font-medium tracking-wide">INMOBILIARIA EN ENTRE RÍOS</p>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-shadow text-brand-accent">
            GBS y Asociados
          </h1>

          <p className="text-lg md:text-xl font-light mb-8 max-w-3xl mx-auto opacity-95">
            Especialistas en alquileres, ventas y administración de propiedades
          </p>

          <p className="text-2xl md:text-3xl font-semibold mb-12 text-shadow">
            Tu próximo hogar te está esperando
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <a
              href="#propiedades"
              className="group inline-flex items-center gap-3 px-8 py-4 btn-primary text-white font-semibold text-lg rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <Search className="w-5 h-5" />
              Buscar propiedades
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>

            <a
              href="#contacto"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold text-lg rounded-xl border-2 border-white/30 hover:bg-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <Phone className="w-5 h-5" />
              Contactar asesor
            </a>
          </div>

          {/* Search bar mockup */}
          <div className="max-w-3xl mx-auto mb-16">
            <div className="flex gap-2 p-2 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <input
                type="text"
                placeholder="Buscar por dirección, ciudad o código postal..."
                className="flex-1 px-4 py-3 bg-transparent text-white placeholder-white/60 focus:outline-none"
                aria-label="Buscar propiedades"
              />
              <select
                className="px-4 py-2 bg-white/10 text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-white/30 border border-white/20"
                aria-label="Tipo de propiedad"
              >
                <option value="">Todos los tipos</option>
                <option value="alquiler">Alquiler</option>
                <option value="venta">Venta</option>
              </select>
              <button
                className="px-6 py-3 bg-white text-brand-primary font-semibold rounded-xl hover:bg-white/90 transition-all focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Buscar"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {HERO_STATS.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl font-bold mb-1">{stat.number}</p>
                <p className="text-sm opacity-90">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PropertyTypesSection() {
  return (
    <section id="propiedades" className="relative py-20 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        // style={{ backgroundImage: "url('/images/property-types.jpg')" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-white/90" aria-hidden="true" />
      <div className="relative max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-brand-text">
            ¿Qué estás buscando?
          </h2>
          <p className="text-xl text-brand-text-muted max-w-2xl mx-auto">
            Encontrá la propiedad perfecta para vos
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {PROPERTY_TYPES.map((item, i) => (
            <div
              key={i}
              className="card-hover p-8 bg-white rounded-2xl shadow-lg border border-gray-100 hover:border-brand-primary/30"
            >
              <div className={`w-16 h-16 mb-6 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg`}>
                <item.icon className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-2xl font-bold mb-3 text-brand-text">
                {item.title}
              </h3>

              <p className="text-brand-text-muted mb-6 leading-relaxed">{item.desc}</p>

              <ul className="space-y-2">
                {item.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-brand-text">
                    <Check className="w-4 h-4 text-brand-primary flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <a
            href="/propiedades"
            className="inline-flex items-center gap-3 px-8 py-4 btn-secondary text-brand-text font-semibold text-lg rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
          >
            Ver todas las propiedades disponibles
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </div>
    </section>
  );
}

function WhyChooseUsSection() {
  return (
    <section className="relative py-20 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/why-us.jpg')" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-white/85 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-brand-text">
            ¿Por qué elegirnos?
          </h2>
          <p className="text-xl text-brand-text-muted max-w-2xl mx-auto">
            Trabajamos para hacer realidad tu proyecto inmobiliario
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {WHY_US.map((item, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center p-6 bg-gray-50/50 rounded-xl hover:bg-white hover:shadow-md transition-all duration-300 border border-transparent hover:border-brand-primary/20"
            >
              <div className="w-14 h-14 mb-4 rounded-full bg-brand-primary/10 flex items-center justify-center">
                <item.icon className="w-7 h-7 text-brand-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-brand-text">{item.title}</h3>
              <p className="text-sm text-brand-text-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LocalKnowledgeSection() {
  return (
    <section className="relative py-20 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/FrontGBS.jpeg')" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-white/90 to-[#5a5a5a]/10" aria-hidden="true" />
      <div className="relative max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-brand-text">
              Conocemos Entre Ríos como nadie
            </h2>

            <p className="text-lg text-brand-text mb-8 leading-relaxed">
              Somos una inmobiliaria con raíces profundas en Libertador San Martín y toda la provincia de Entre Ríos.
              Nuestro conocimiento del mercado local nos permite ofrecerte las mejores opciones según tus necesidades.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm">
                <div className="w-12 h-12 rounded-lg bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-brand-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1 text-brand-text">
                    Ubicación privilegiada
                  </h3>
                  <p className="text-brand-text-muted">
                    Propiedades en las mejores zonas de Libertador San Martín, Gualeguaychú y alrededores
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm">
                <div className="w-12 h-12 rounded-lg bg-brand-accent/10 flex items-center justify-center flex-shrink-0">
                  <Award className="w-6 h-6 text-brand-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1 text-brand-text">
                    Compromiso local
                  </h3>
                  <p className="text-brand-text-muted">
                    Trabajamos con propietarios e inquilinos de la región, entendiendo sus necesidades
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-brand-primary to-brand-primary-dark rounded-3xl opacity-10"></div>
              <div className="relative bg-white rounded-2xl shadow-2xl p-10 border border-gray-100">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-primary-dark flex items-center justify-center shadow-xl">
                    <Home className="w-14 h-14 text-white" />
                  </div>
                  <div className="mb-2">
                    <span className="text-5xl font-bold gradient-text">+30</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-brand-text">
                    Propiedades gestionadas
                  </h3>
                  <p className="text-brand-text-muted">
                    En Libertador San Martín y la región
                  </p>

                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-brand-primary">100%</p>
                        <p className="text-sm text-brand-text-muted">Verificadas</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-brand-primary">15+</p>
                        <p className="text-sm text-brand-text-muted">Años</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section id="contacto" className="py-20 bg-gradient-to-br from-[#2e2e2e] to-[#1a1a1a] text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl"></div>
      </div>

      <div className="relative max-w-5xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          ¿Tenés una consulta?
        </h2>
        <p className="text-xl mb-12 opacity-90 max-w-2xl mx-auto">
          Hablá directamente con un asesor. Estamos para ayudarte a encontrar tu próximo hogar.
        </p>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {CONTACT_METHODS.map((method, i) => (
            <a
              key={i}
              href={method.href}
              {...(method.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="card-hover p-8 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <div className={`w-16 h-16 mx-auto mb-4 rounded-xl ${method.iconBg} flex items-center justify-center`}>
                {typeof method.icon === 'string' ? (
                  <span className={`text-2xl font-bold ${method.iconColor}`}>{method.icon}</span>
                ) : (
                  <method.icon className={`w-8 h-8 ${method.iconColor}`} />
                )}
              </div>
              <p className="text-2xl font-bold mb-2">{method.title}</p>
              <p className="text-sm opacity-90">{method.subtitle}</p>
              {method.subtitle2 && <p className="text-sm opacity-75 mt-1">{method.subtitle2}</p>}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function FooterSection() {
  return (
    <footer className="bg-brand-text text-white py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold mb-4">GBS y Asociados</h3>
            <p className="text-gray-300 mb-4 leading-relaxed">
              Tu inmobiliaria de confianza en Entre Ríos. Especialistas en alquileres, ventas y administración de propiedades.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-primary transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                aria-label="Sitio web"
              >
                <Globe className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-primary transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                aria-label="Compartir"
              >
                <Share2 className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-4">Servicios</h4>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#" className="hover:text-brand-primary transition-colors">Alquileres</a></li>
              <li><a href="#" className="hover:text-brand-primary transition-colors">Ventas</a></li>
              <li><a href="#" className="hover:text-brand-primary transition-colors">Administración</a></li>
              <li><a href="#" className="hover:text-brand-primary transition-colors">Tasaciones</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-4">Ubicación</h4>
            <p className="text-gray-300 leading-relaxed">
              Libertador San Martín<br />
              Entre Ríos<br />
              Argentina
            </p>
          </div>
        </div>

        <div className="h-px bg-white/10 mb-6"></div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-300">
          <p>© 2025 GBS y Asociados • Todos los derechos reservados</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-brand-primary transition-colors">Términos y Condiciones</a>
            <a href="#" className="hover:text-brand-primary transition-colors">Política de Privacidad</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <HeroSection />
      <PropertyTypesSection />
      <WhyChooseUsSection />
      <LocalKnowledgeSection />
      <ContactSection />
      <FooterSection />
    </div>
  );
}

export default App;
