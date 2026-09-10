import Header from '@/components/ui/Header';
import {
  Building2, Scale, KeyRound, Handshake, FileText,
  ShieldCheck, FileSignature, Users, ScrollText, BookOpen,
  BadgeDollarSign, Home, Clock, Award, MapPin, Check,
  Phone, Mail, MessageCircle, ArrowRight, Landmark,
  Gavel, Star, type LucideIcon
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
  { number: '15+', label: 'Años de experiencia' },
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
  { icon: Award, title: 'Trayectoria', desc: 'Más de 15 años en el mercado regional' },
];

function HeroSplitSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="grid md:grid-cols-2 min-h-[90vh]">
        {/* Inmobiliaria */}
        <div className="relative flex items-center justify-center p-8 md:p-16 min-h-[50vh] md:min-h-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/images/InsideGBS.jpeg')" }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#2e2e2e]/85 via-[#3d3d3d]/80 to-[#4a4a4a]/85" aria-hidden="true" />
          <div className="absolute inset-0" aria-hidden="true">
            <div className="absolute top-10 right-10 w-64 h-64 bg-[#63bae9]/10 rounded-full mix-blend-overlay filter blur-3xl"></div>
          </div>

          <div className="relative text-center md:text-left z-10 max-w-lg">
            <div className="inline-block mb-6 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 animate-fade-in-up">
              <p className="text-xs font-semibold tracking-[0.2em] text-[#fcc238] uppercase">Inmobiliaria</p>
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white leading-tight animate-fade-in-up delay-100">
              Tu próximo<br />hogar te espera
            </h2>

            <p className="text-base md:text-lg text-white/80 mb-8 leading-relaxed animate-fade-in-up delay-200">
              Especialistas en alquileres, ventas y administración de propiedades en Libertador San Martín y toda la región.
            </p>

            <ul className="space-y-2 mb-8 animate-fade-in-up delay-300">
              {['Departamentos amoblados sin garantía', 'Casas con jardín y espacios amplios', 'Propiedades verificadas y financiables'].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-white/70">
                  <Check className="w-4 h-4 text-[#fcc238] flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up delay-400">
              <a
                href="#servicios"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#fcc238] text-[#2e2e2e] font-bold rounded-xl hover:bg-[#e6af32] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <Building2 className="w-5 h-5" />
                Explorar propiedades
              </a>
              <a
                href="#contacto"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/30 hover:bg-white/20 transition-all"
              >
                <Phone className="w-5 h-5" />
                Contactar asesor
              </a>
            </div>
          </div>
        </div>

        {/* Abogacía */}
        <div className="relative flex items-center justify-center p-8 md:p-16 min-h-[50vh] md:min-h-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/images/FrontGBS.jpeg')" }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a]/90 via-[#2e2e2e]/85 to-[#3d3d3d]/80" aria-hidden="true" />
          <div className="absolute inset-0" aria-hidden="true">
            <div className="absolute bottom-10 left-10 w-64 h-64 bg-[#fcc238]/10 rounded-full mix-blend-overlay filter blur-3xl"></div>
          </div>

          <div className="relative text-center md:text-left z-10 max-w-lg">
            <div className="inline-block mb-6 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 animate-fade-in-up">
              <p className="text-xs font-semibold tracking-[0.2em] text-[#63bae9] uppercase">Estudio Jurídico</p>
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white leading-tight animate-fade-in-up delay-100">
              Tus derechos<br />primero
            </h2>

            <p className="text-base md:text-lg text-white/80 mb-8 leading-relaxed animate-fade-in-up delay-200">
              Asesoramiento legal integral con enfoque en derecho civil, contratos inmobiliarios, sucesiones y derecho de familia.
            </p>

            <ul className="space-y-2 mb-8 animate-fade-in-up delay-300">
              {['Derecho civil y comercial con excelencia', 'Contratos inmobiliarios transparentes', 'Acompañamiento en cada paso del proceso'].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-white/70">
                  <Check className="w-4 h-4 text-[#63bae9] flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up delay-400">
              <a
                href="#servicios"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#63bae9] text-white font-bold rounded-xl hover:bg-[#4ca8d8] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <Gavel className="w-5 h-5" />
                Ver servicios legales
              </a>
              <a
                href="#contacto"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/30 hover:bg-white/20 transition-all"
              >
                <MessageCircle className="w-5 h-5" />
                Consulta gratuita
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="relative bg-[#2e2e2e] border-t border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {HERO_STATS.map((stat, i) => (
              <div key={i} className="text-center animate-fade-in-up" style={{ animationDelay: `${(i + 5) * 100}ms` }}>
                <p className="text-2xl md:text-3xl font-bold text-[#fcc238] mb-1">{stat.number}</p>
                <p className="text-sm text-white/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function DualServicesSection() {
  return (
    <section id="servicios" className="py-20 md:py-28 bg-[#f8f9fa]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-block mb-4 px-4 py-1.5 bg-white rounded-full border border-gray-200 shadow-sm">
            <p className="text-xs font-semibold tracking-[0.15em] text-[#969696] uppercase">Nuestra experiencia</p>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[#2e2e2e] mb-4">
            Dos especialidades,<br className="md:hidden" /> un mismo compromiso
          </h2>
          <p className="text-lg text-[#686363] max-w-2xl mx-auto">
            Integramos servicios inmobiliarios y legales para brindarte soluciones completas y seguras.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Inmobiliaria Card */}
          <div className="group bg-white rounded-3xl p-8 md:p-10 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#63bae9]/20 to-[#63bae9]/5 flex items-center justify-center">
                <Building2 className="w-7 h-7 text-[#63bae9]" />
              </div>
              <div>
                <span className="text-xs font-semibold tracking-[0.15em] text-[#63bae9] uppercase">División</span>
                <h3 className="text-2xl font-bold text-[#2e2e2e]">Inmobiliaria</h3>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {INMOBILIARIA_SERVICES.map((service, i) => (
                <div key={i} className="p-4 rounded-2xl bg-[#f8f9fa] border border-gray-100 hover:border-[#63bae9]/20 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center mb-3">
                    <service.icon className="w-5 h-5 text-[#63bae9]" />
                  </div>
                  <h4 className="font-bold text-[#2e2e2e] mb-1">{service.title}</h4>
                  <p className="text-sm text-[#686363]">{service.desc}</p>
                </div>
              ))}
            </div>

            <a
              href="/propiedades"
              className="inline-flex items-center gap-2 text-[#63bae9] font-semibold hover:text-[#4ca8d8] transition-colors group/link"
            >
              Ver todas las propiedades
              <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* Abogacía Card */}
          <div className="group bg-white rounded-3xl p-8 md:p-10 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#fcc238]/20 to-[#fcc238]/5 flex items-center justify-center">
                <Scale className="w-7 h-7 text-[#fcc238]" />
              </div>
              <div>
                <span className="text-xs font-semibold tracking-[0.15em] text-[#fcc238] uppercase">División</span>
                <h3 className="text-2xl font-bold text-[#2e2e2e]">Abogacía</h3>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {ABOGACIA_SERVICES.map((service, i) => (
                <div key={i} className="p-4 rounded-2xl bg-[#f8f9fa] border border-gray-100 hover:border-[#fcc238]/20 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center mb-3">
                    <service.icon className="w-5 h-5 text-[#fcc238]" />
                  </div>
                  <h4 className="font-bold text-[#2e2e2e] mb-1">{service.title}</h4>
                  <p className="text-sm text-[#686363]">{service.desc}</p>
                </div>
              ))}
            </div>

            <a
              href="#contacto"
              className="inline-flex items-center gap-2 text-[#fcc238] font-semibold hover:text-[#e6af32] transition-colors group/link"
            >
              Solicitar asesoramiento legal
              <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function ValuesSection() {
  return (
    <section className="py-20 md:py-28 bg-white relative overflow-hidden">
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#63bae9]/5 rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#fcc238]/5 rounded-full mix-blend-multiply filter blur-3xl"></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-block mb-4 px-4 py-1.5 bg-[#f8f9fa] rounded-full border border-gray-200">
            <p className="text-xs font-semibold tracking-[0.15em] text-[#969696] uppercase">Por qué GBS</p>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[#2e2e2e] mb-4">
            La diferencia GBS
          </h2>
          <p className="text-lg text-[#686363] max-w-2xl mx-auto">
            Más de 15 años combinando experiencia inmobiliaria con respaldo jurídico.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {VALUES.map((value, i) => (
            <div
              key={i}
              className="group p-6 rounded-2xl bg-[#f8f9fa] border border-gray-100 hover:bg-white hover:shadow-lg hover:border-[#fcc238]/30 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <value.icon className="w-6 h-6 text-[#686363] group-hover:text-[#63bae9] transition-colors duration-300" />
              </div>
              <h3 className="text-lg font-bold text-[#2e2e2e] mb-2">{value.title}</h3>
              <p className="text-sm text-[#686363] leading-relaxed">{value.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section id="contacto" className="py-20 md:py-28 bg-gradient-to-br from-[#2e2e2e] to-[#1a1a1a] text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-5" aria-hidden="true">
        <div className="absolute top-10 left-1/3 w-80 h-80 bg-[#63bae9] rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute bottom-10 right-1/3 w-80 h-80 bg-[#fcc238] rounded-full mix-blend-multiply filter blur-3xl"></div>
      </div>

      <div className="relative max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-block mb-4 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
            <p className="text-xs font-semibold tracking-[0.15em] text-[#fcc238] uppercase">Contacto</p>
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
                <div className="w-12 h-12 rounded-xl bg-[#63bae9]/20 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-[#63bae9]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Consultas inmobiliarias</h3>
                  <p className="text-sm text-white/60">Alquileres, ventas, tasaciones</p>
                </div>
              </div>
              <div className="flex gap-3">
                <a
                  href="https://wa.me/5491123456789"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] text-white font-semibold rounded-xl hover:bg-[#20BD5A] transition-all"
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
                <div className="w-12 h-12 rounded-xl bg-[#fcc238]/20 flex items-center justify-center">
                  <Gavel className="w-6 h-6 text-[#fcc238]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Consultas legales</h3>
                  <p className="text-sm text-white/60">Derecho civil, contratos, sucesiones</p>
                </div>
              </div>
              <div className="flex gap-3">
                <a
                  href="https://wa.me/5491123456789"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] text-white font-semibold rounded-xl hover:bg-[#20BD5A] transition-all"
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

          <div className="p-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
            <h3 className="text-xl font-bold mb-6">Información de contacto</h3>

            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-[#fcc238]" />
                </div>
                <div>
                  <p className="text-sm text-white/60">Teléfono</p>
                  <a href="tel:03447123456" className="font-semibold hover:text-[#fcc238] transition-colors">03447-123456</a>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-[#63bae9]" />
                </div>
                <div>
                  <p className="text-sm text-white/60">Dirección</p>
                  <p className="font-semibold">Libertador San Martín, Entre Ríos</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-[#fcc238]" />
                </div>
                <div>
                  <p className="text-sm text-white/60">Horarios</p>
                  <p className="font-semibold">Lun a Vie 9-18hs • Sáb 9-13hs</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/10">
              <p className="text-sm text-white/60 mb-4">Respuesta garantizada en menos de 24 horas</p>
              <a
                href="https://wa.me/5491123456789"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-[#fcc238] text-[#2e2e2e] font-bold rounded-xl hover:bg-[#e6af32] transition-all shadow-lg hover:shadow-xl"
              >
                <MessageCircle className="w-5 h-5" />
                Escribinos por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FooterSection() {
  return (
    <footer className="bg-[#1a1a1a] text-white py-12 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold mb-2">GBS y Asociados</h3>
            <p className="text-sm text-[#fcc238] font-semibold tracking-wider mb-4">
              Inmobiliaria & Estudio Jurídico
            </p>
            <p className="text-gray-400 leading-relaxed mb-4 max-w-md">
              Soluciones integrales en servicios inmobiliarios y legales en Libertador San Martín y toda la provincia de Entre Ríos.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold tracking-wider text-[#969696] uppercase mb-4">Inmobiliaria</h4>
            <ul className="space-y-2.5 text-gray-400">
              <li><a href="#" className="hover:text-[#63bae9] transition-colors text-sm">Alquileres</a></li>
              <li><a href="#" className="hover:text-[#63bae9] transition-colors text-sm">Ventas</a></li>
              <li><a href="#" className="hover:text-[#63bae9] transition-colors text-sm">Administración</a></li>
              <li><a href="#" className="hover:text-[#63bae9] transition-colors text-sm">Tasaciones</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold tracking-wider text-[#969696] uppercase mb-4">Servicios Legales</h4>
            <ul className="space-y-2.5 text-gray-400">
              <li><a href="#" className="hover:text-[#fcc238] transition-colors text-sm">Derecho Civil</a></li>
              <li><a href="#" className="hover:text-[#fcc238] transition-colors text-sm">Contratos</a></li>
              <li><a href="#" className="hover:text-[#fcc238] transition-colors text-sm">Sucesiones</a></li>
              <li><a href="#" className="hover:text-[#fcc238] transition-colors text-sm">Familia</a></li>
            </ul>
          </div>
        </div>

        <div className="h-px bg-white/5 mb-6"></div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} GBS y Asociados • Todos los derechos reservados</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Términos y Condiciones</a>
            <a href="#" className="hover:text-white transition-colors">Política de Privacidad</a>
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
      <main className="flex-1">
        <HeroSplitSection />
        <DualServicesSection />
        <ValuesSection />
        <ContactSection />
      </main>
      <FooterSection />
    </div>
  );
}

export default App;