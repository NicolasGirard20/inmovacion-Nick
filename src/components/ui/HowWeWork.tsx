import Image from 'next/image';

const STEPS = [
  { num: '01', title: 'Contacto', desc: 'Escribinos por WhatsApp, email o visitanos en nuestra oficina.' },
  { num: '02', title: 'Consulta', desc: 'Analizamos tu caso sin cargo y te proponemos la mejor solución.' },
  { num: '03', title: 'Acción', desc: 'Gestionamos todo el proceso: documentación, trámites y firmas.' },
  { num: '04', title: 'Resolución', desc: 'Tu propiedad o asunto resuelto con total seguridad jurídica.' },
];

export default function HowWeWork() {
  return (
    <section className="py-16 md:py-24 bg-[#f8f9fa]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header centrado como las otras secciones */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4 px-4 py-1.5 bg-white rounded-full border border-gray-200 shadow-sm">
            <p className="text-xs font-semibold tracking-[0.15em] text-[#686363] uppercase">Cómo trabajamos</p>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[#2e2e2e] mb-4" style={{ fontFamily: "var(--font-crimson-pro), serif" }}>
            De la consulta<br className="md:hidden" /> a la resolución
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Imagen - izquierda */}
          <div className="order-1">
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src="/images/InsideGBS.jpeg"
                alt="Oficina GBS & Asociados"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2e2e2e]/50 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-white/80 text-sm font-medium tracking-wider uppercase mb-1">Nuestra oficina</p>
                <p className="text-white text-xl font-bold" style={{ fontFamily: "var(--font-crimson-pro), serif" }}>
                  Libertador San Martín, Entre Ríos
                </p>
              </div>
            </div>
          </div>

          {/* Pasos - derecha */}
          <div className="space-y-10 order-2">
            {STEPS.map((step, i) => (
              <div key={i} className="group flex gap-5 pl-6 border-l-2 border-[#e5e7eb] hover:border-[#63bae9] transition-colors duration-300">
                <span className="text-4xl md:text-5xl font-bold text-[#686363] group-hover:text-[#63bae9] transition-colors duration-300 flex-shrink-0" style={{ fontFamily: "var(--font-crimson-pro), serif" }}>
                  {step.num}
                </span>
                <div>
                  <h3 className="text-xl font-bold text-[#2e2e2e] mb-2">{step.title}</h3>
                  <p className="text-[#686363] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
