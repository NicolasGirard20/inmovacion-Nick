import Image from 'next/image';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import HowWeWork from '@/components/ui/HowWeWork';
import {
  Building2, Scale, KeyRound, Handshake, FileText,
  ShieldCheck, FileSignature, Users, ScrollText, BookOpen,
  BadgeDollarSign, Home, Clock, Award, MapPin,
  Mail, ArrowRight, Landmark,
  MessageCircle, Gavel, Star, type LucideIcon
} from 'lucide-react';

type Stat = {
  number: string;
  label: string;
};

type Service = {
  icon: LucideIcon;
  title: string;
  desc: string;
};

type Value = {
  icon: LucideIcon;
  title: string;
  desc: string;
};

const HERO_STATS: Stat[] = [
  { number: '30+', label: 'Propiedades gestionadas' },
  { number: '100+', label: 'Clientes satisfechos' },
  { number: '30+', label: 'Años de experiencia' },
  { number: '24hs', label: 'Tiempo de respuesta' },
];

const INMOBILIARIA_SERVICES: Service[] = [
  { icon: KeyRound, title: 'Alquileres', desc: 'Departamentos monoambientes, 2, 3 y 4 ambientes' },
  { icon: Handshake, title: 'Ventas', desc: 'Casas, departamentos y terrenos en la región' },
  { icon: Building2, title: 'Administración', desc: 'Gestión integral de propiedades y consorcios' },
  { icon: BadgeDollarSign, title: 'Tasaciones', desc: 'Valoración profesional de tu propiedad' },
];

const ABOGACIA_SERVICES: Service[] = [
  { icon: Scale, title: 'Derecho Civil', desc: 'Contratos, obligaciones y responsabilidad civil' },
  { icon: FileSignature, title: 'Contratos Inmobiliarios', desc: 'Redacción, revisión y ejecución contractual' },
  { icon: ScrollText, title: 'Sucesiones', desc: 'Tramitación integral de sucesiones y testamentos' },
  { icon: Users, title: 'Derecho de Familia', desc: 'Divorcios, alimentos, régimen patrimonial' },
];

const VALUES: Value[] = [
  { icon: MapPin, title: 'Conocimiento local', desc: 'Expertos en el mercado de Entre Ríos' },
  { icon: ShieldCheck, title: 'Seguridad jurídica', desc: 'Asesoramiento legal en cada operación' },
  { icon: Clock, title: 'Respuesta rápida', desc: 'Atención en menos de 24 horas' },
  { icon: Star, title: 'Calidad garantizada', desc: 'Servicio profesional certificado' },
  { icon: Users, title: 'Atención personalizada', desc: 'Soluciones a medida para cada cliente' },
  
];

function HeroUnifiedSection() {
  return (
    <section className="relative overflow-hidden min-h-screen flex flex-col">
      {/* Imagen de fondo */}
      <div className="absolute inset-0">
        <Image
          src="/images/FrontGBS.jpeg"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-black/50 via-brand-text/40 to-brand-primary-dark/50" aria-hidden="true" />
      </div>

      {/* Logo esquina superior derecha */}
      <div className="absolute top-6 right-6 z-20">
        <div className="relative h-40 w-40 md:h-48 md:w-48 rounded-xl overflow-hidden shadow-lg" style={{ backgroundColor: 'var(--color-brand-white)' }}>
          <Image
            src="/logo.png"
            alt="GBS & Asociados"
            fill
            className="object-cover"
          />
        </div>
      </div>

      {/* Glow decorativo */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-brand-accent/10 rounded-full mix-blend-overlay filter blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-brand-blue/10 rounded-full mix-blend-overlay filter blur-3xl"></div>
      </div>

      {/* Contenido central */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">


          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-tight mb-4 animate-fade-in-up delay-100 font-serif" style={{ fontFamily: "var(--font-crimson-pro), serif" }}>
            GBS & Asociados
          </h1>

          <p className="text-lg md:text-xl text-white font-bold tracking-[0.15em] uppercase mb-4 animate-fade-in-up delay-200">
            Estudio Jurídico e Inmobiliario
          </p>

          <p className="text-xl md:text-2xl text-white mb-10 leading-relaxed animate-fade-in-up delay-300 font-serif" style={{ fontFamily: "var(--font-crimson-pro), serif" }}>
            &ldquo;Un espacio donde resolvemos tus problemas&rdquo;
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-400">
            <a
              href="#contacto"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-brand-accent text-brand-text font-bold rounded-xl hover:bg-brand-accent-hover transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-lg"
            >
              <Building2 className="w-6 h-6" />
              Consulta Inmobiliaria
            </a>
            <a
              href="#contacto"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-brand-blue text-white font-bold rounded-xl hover:bg-brand-blue-active transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-lg"
            >
              <Scale className="w-6 h-6" />
              Consulta Legal
            </a>
          </div>
        </div>
      </div>

      {/* Marquee dentro del hero */}
      <div className="relative z-10 bg-brand-black/80 backdrop-blur-sm py-5">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...items, ...items, ...items].map((item, i) => (
            <span key={i} className="mx-6 text-sm font-bold tracking-widest uppercase">
              <span className="text-brand-accent">{item}</span>
              <span className="text-white/10 mx-6">•</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

const items = [
  'Alquileres', 'Ventas', 'Administración', 'Tasaciones',
  'Derecho Civil', 'Contratos', 'Sucesiones', 'Familia',
  'Monoambientes', '2 Ambientes', 'Casas', 'Terrenos',
];

function DualServicesSection() {
  return (
    <section id="servicios" className="py-16 md:py-24 bg-brand-bg">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-block mb-4 px-4 py-1.5 bg-white rounded-full border border-gray-200 shadow-sm">
            <p className="text-xs font-semibold tracking-[0.15em] text-brand-text-warm uppercase">Nuestra experiencia</p>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-brand-text mb-4">
            Dos especialidades,<br className="md:hidden" /> un mismo compromiso
          </h2>
          <p className="text-lg text-brand-text-warm max-w-2xl mx-auto">
            Integramos servicios inmobiliarios y legales para brindarte soluciones completas y seguras.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Inmobiliaria Card */}
          <div className="group bg-white rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden flex flex-col">
            <div className="relative h-48 md:h-56 overflow-hidden">
              <Image
                src="/images/property-types.jpg"
                alt="Propiedades inmobiliarias"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
            <div className="p-8 md:p-10 flex flex-col flex-1">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-blue/20 to-brand-blue/5 flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-brand-blue" />
                </div>
                <div>
                  <span className="text-xs font-semibold tracking-[0.15em] text-brand-blue uppercase">División</span>
                  <h3 className="text-2xl font-bold text-brand-text">Inmobiliaria</h3>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {INMOBILIARIA_SERVICES.map((service, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-brand-bg border border-gray-100 hover:border-brand-blue/20 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center mb-3">
                      <service.icon className="w-5 h-5 text-brand-blue" />
                    </div>
                    <h4 className="font-bold text-brand-text mb-1">{service.title}</h4>
                    <p className="text-sm text-brand-text-warm">{service.desc}</p>
                  </div>
                ))}
              </div>

              <a
                href="/propiedades"
                className="inline-flex items-center gap-2 text-brand-blue font-semibold hover:text-brand-blue-active transition-colors group/link mt-auto pt-6"
              >
                Ver todas las propiedades
                <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>

          {/* Abogacía Card */}
          <div className="group bg-white rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden flex flex-col">
            <div className="relative h-48 md:h-56 overflow-hidden">
              <Image
                src="/images/local-knowledge.jpg"
                alt="Asesoramiento legal"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
            <div className="p-8 md:p-10 flex flex-col flex-1">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-accent/20 to-brand-accent/5 flex items-center justify-center">
                  <Scale className="w-7 h-7 text-brand-accent" />
                </div>
                <div>
                  <span className="text-xs font-semibold tracking-[0.15em] text-brand-accent uppercase">División</span>
                  <h3 className="text-2xl font-bold text-brand-text">Abogacía</h3>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {ABOGACIA_SERVICES.map((service, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-brand-bg border border-gray-100 hover:border-brand-accent/20 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center mb-3">
                      <service.icon className="w-5 h-5 text-brand-accent" />
                    </div>
                    <h4 className="font-bold text-brand-text mb-1">{service.title}</h4>
                    <p className="text-sm text-brand-text-warm">{service.desc}</p>
                  </div>
                ))}
              </div>

              <a
                href="/disponibilidad"
                className="inline-flex items-center gap-2 text-brand-accent font-semibold hover:text-brand-accent-hover transition-colors group/link mt-auto pt-6"
              >
                Consultar disponibilidad
                <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ValuesSection() {
  return (
    <section id="por-que-gbs" className="py-20 md:py-28 bg-white relative overflow-hidden">
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-blue/5 rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-accent/5 rounded-full mix-blend-multiply filter blur-3xl"></div>
      </div>

        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block mb-4 px-4 py-1.5 bg-brand-bg rounded-full border border-gray-200">
              <p className="text-xs font-semibold tracking-[0.15em] text-brand-text-warm uppercase">Por qué GBS</p>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-brand-text mb-4">
              La diferencia GBS
            </h2>
            <p className="text-lg text-brand-text-warm max-w-2xl mx-auto">
              Ofrecemos experiencia y soluciones integrales en un mismo lugar.
            </p>
          </div>

          <div className="relative rounded-3xl overflow-hidden mb-12 h-48 md:h-72">
            <Image
              src="/images/why-us.jpg"
              alt="Oficina GBS & Asociados"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-text/70 via-transparent to-brand-text/30" />
            <div className="absolute inset-0 flex items-center px-8 md:px-16">
              <div className="max-w-lg">
                <p className="text-white/80 text-sm md:text-base font-medium tracking-wider uppercase mb-2">Nuestro compromiso</p>
                <h3 className="text-white text-xl md:text-3xl font-bold leading-tight">
                  Confianza, experiencia y dedicación en cada servicio
                </h3>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALUES.map((value, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl bg-brand-bg border border-gray-100 hover:bg-white hover:shadow-lg hover:border-brand-accent/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <value.icon className="w-6 h-6 text-brand-text-warm group-hover:text-brand-blue transition-colors duration-300" />
                </div>
                <h3 className="text-lg font-bold text-brand-text mb-2">{value.title}</h3>
                <p className="text-sm text-brand-text-warm leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>

          {/* Stats Bar */}
          <div className="mt-16 bg-brand-text py-10 rounded-2xl">
            <div className="grid grid-cols-2 md:grid-cols-4  gap-6">
              {HERO_STATS.map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-2xl md:text-3xl font-bold text-brand-accent mb-1">{stat.number}</p>
                  <p className="text-sm text-white/70">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section id="contacto" className="py-20 md:py-28 bg-gradient-to-br from-brand-text to-brand-black text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-5" aria-hidden="true">
        <div className="absolute top-10 left-1/3 w-80 h-80 bg-brand-blue rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute bottom-10 right-1/3 w-80 h-80 bg-brand-accent rounded-full mix-blend-multiply filter blur-3xl"></div>
      </div>

      <div className="relative max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-block mb-4 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
            <p className="text-xs font-semibold tracking-[0.15em] text-brand-accent uppercase">Contacto</p>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Hablemos
          </h2>
          <p className="text-lg text-white/70 max-w-xl mx-auto">
            Ya sea para buscar propiedad o asesorarte legalmente, estamos listos para ayudarte.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-colors">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-brand-blue/20 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-brand-blue" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Consultas inmobiliarias</h3>
                  <p className="text-sm text-white/60">Alquileres, ventas, tasaciones</p>
                </div>
              </div>
              <div className="flex gap-3">
                <a
                  href="https://wa.me/5493436205284"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-whatsapp text-white font-semibold rounded-xl hover:bg-whatsapp-hover transition-all"
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp
                </a>
                <a
                  href="mailto:inmobiliaria@gbsasociados.com"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/30 hover:bg-white/20 transition-all"
                >
                  <Mail className="w-5 h-5" />
                  Email
                </a>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-colors">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-brand-accent/20 flex items-center justify-center">
                  <Gavel className="w-6 h-6 text-brand-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Consultas legales</h3>
                  <p className="text-sm text-white/60">Derecho civil, contratos, sucesiones</p>
                </div>
              </div>
              <div className="flex gap-3">
                <a
                  href="https://wa.me/5493434612497"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-whatsapp text-white font-semibold rounded-xl hover:bg-whatsapp-hover transition-all"
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp
                </a>
                <a
                  href="mailto:legal@gbsasociados.com"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/30 hover:bg-white/20 transition-all"
                >
                  <Mail className="w-5 h-5" />
                  Email
                </a>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-brand-blue" />
                </div>
                <div>
                  <h3 className="text-xl font-bold leading-tight">Ubicación</h3>
                  <p className="text-xs text-white/60">Libertador San Martín, Entre Ríos</p>
                </div>
              </div>
              <a
                href="https://maps.app.goo.gl/CJ4mCUHTz8m9h6Gu5"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-brand-blue hover:text-white transition-all border border-white/10"
              >
                Abrir Maps ↗
              </a>
            </div>

            <div className="w-full flex-1 min-h-[300px] md:min-h-[330px] rounded-xl overflow-hidden border border-white/10 shadow-inner">
              <iframe
                src="https://maps.google.com/maps?q=-32.067752,-60.454276&hl=es&z=16&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación GBS & Asociados"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1">
        <HeroUnifiedSection />
        <HowWeWork />
        <DualServicesSection />
        <ValuesSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}

export default App;
