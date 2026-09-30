import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/landing/Navbar";
import ContactForm from "@/components/landing/ContactForm";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#070D18] text-slate-100 font-sans selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-blue-600/15 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[900px] right-0 w-[550px] h-[550px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER / NAVIGATION */}
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-6 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span>Consultoría Estratégica en E-Commerce & Retail Multicanal</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-display font-extrabold text-white tracking-tight leading-[1.1] mb-6">
            Escalá la rentabilidad de tu E-Commerce y dominá tus{" "}
            <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              Canales de Venta
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 font-normal leading-relaxed mb-10 max-w-3xl mx-auto">
            Auditamos, optimizamos y aceleramos la operación de tu tienda online y marketplaces. Aumentamos tus márgenes netos, eliminamos sobrestocks y profesionalizamos tu gestión multicanal.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <a
              href="#contacto"
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 via-blue-500 to-teal-400 hover:from-blue-500 hover:to-teal-300 text-white font-semibold text-base px-8 py-4 rounded-xl shadow-xl shadow-blue-600/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <span>Agendá un Diagnóstico Gratuito</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </a>

            <a
              href="#servicios"
              className="w-full sm:w-auto bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-medium text-base px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <span>Conocé nuestros Servicios</span>
              <span className="material-symbols-outlined">explore</span>
            </a>
          </div>

          {/* Social Proof / Metrics Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
            <div className="text-center p-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-teal-400 font-display">
                +45%
              </div>
              <div className="text-xs text-slate-400 font-medium mt-1">
                Crecimiento en Marketplaces
              </div>
            </div>

            <div className="text-center p-3 border-l border-slate-800/80">
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-400 font-display">
                +32%
              </div>
              <div className="text-xs text-slate-400 font-medium mt-1">
                Mejora en Margen Bruto
              </div>
            </div>

            <div className="text-center p-3 border-l border-slate-800/80">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-display">
                100%
              </div>
              <div className="text-xs text-slate-400 font-medium mt-1">
                Control Multicanal
              </div>
            </div>

            <div className="text-center p-3 border-l border-slate-800/80">
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-display">
                -35%
              </div>
              <div className="text-xs text-slate-400 font-medium mt-1">
                Capital Inmovilizado
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ECOSYSTEM / INTEGRATIONS RIBBON (#plataformas) */}
      <section id="plataformas" className="py-12 border-y border-slate-800/80 bg-slate-950/60 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-8">
            Especialistas en Integración y Estrategia para las Principales Plataformas del Mercado
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 items-center justify-items-center opacity-85">
            <div className="bg-slate-900/80 border border-slate-800 hover:border-yellow-500/50 p-4 rounded-xl w-full text-center transition-all group">
              <span className="material-symbols-outlined text-yellow-400 text-2xl mb-1">storefront</span>
              <div className="text-xs font-bold text-white group-hover:text-yellow-400 transition-colors">
                Mercado Libre
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Tiendas Oficiales & Meli</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-xl w-full text-center transition-all group">
              <span className="material-symbols-outlined text-emerald-400 text-2xl mb-1">shopping_bag</span>
              <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                Shopify
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">D2C & B2B Stores</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 p-4 rounded-xl w-full text-center transition-all group">
              <span className="material-symbols-outlined text-blue-400 text-2xl mb-1">cloud</span>
              <div className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                Tienda Nube
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">E-commerce Latam</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 p-4 rounded-xl w-full text-center transition-all group">
              <span className="material-symbols-outlined text-purple-400 text-2xl mb-1">hub</span>
              <div className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors">
                VTEX
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Enterprise Commerce</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 hover:border-sky-500/50 p-4 rounded-xl w-full text-center transition-all group">
              <span className="material-symbols-outlined text-sky-400 text-2xl mb-1">code</span>
              <div className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors">
                WooCommerce
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Custom Platforms</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 p-4 rounded-xl w-full text-center transition-all group">
              <span className="material-symbols-outlined text-amber-400 text-2xl mb-1">inventory</span>
              <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                ERPs & WMS
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">SAP, Defontana, Tango</div>
            </div>
          </div>
        </div>
      </section>

      {/* CONSULTING SERVICES SECTION (#servicios) */}
      <section id="servicios" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-semibold text-teal-400 tracking-wider uppercase mb-2">
            Nuestros Servicios de Consultoría
          </h2>
          <h3 className="text-3xl sm:text-4xl font-display font-bold text-white">
            Soluciones estratégicas para hacer crecer tu operación online
          </h3>
          <p className="text-slate-300 text-base mt-4">
            Trabajamos mano a mano con fundadores, gerentes de e-commerce y directores de retail para optimizar cada punto de contacto de su negocio digital.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Card 1: Marketplace Strategy */}
          <div className="bg-slate-900/80 border border-slate-800 p-8 rounded-2xl relative overflow-hidden group hover:border-teal-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-6 border border-teal-500/20">
              <span className="material-symbols-outlined text-2xl">rocket_launch</span>
            </div>
            <h4 className="text-xl font-bold text-white mb-3">
              1. Estrategia & Aceleración de Marketplaces
            </h4>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              Optimización integral de tus canales en Mercado Libre y Amazon. Estrategia de pricing competitivo, catálogo de publicaciones, posicionamiento SEO interno y reputación.
            </p>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-400 text-xs">check</span>
                <span>Optimización de Publicaciones & Buy Box</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-400 text-xs">check</span>
                <span>Gestión de Mercado Envíos Flex / Full</span>
              </li>
            </ul>
          </div>

          {/* Card 2: Unit Economics & Margin Audit */}
          <div className="bg-slate-900/80 border border-slate-800 p-8 rounded-2xl relative overflow-hidden group hover:border-blue-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6 border border-blue-500/20">
              <span className="material-symbols-outlined text-2xl">attach_money</span>
            </div>
            <h4 className="text-xl font-bold text-white mb-3">
              2. Auditoría de Margen & Unit Economics
            </h4>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              Desglose quirúrgico de la rentabilidad real de tu comercio. Analizamos comisiones por canal, pasarelas de pago, envíos y descuentos para calcular el margen neto real.
            </p>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-400 text-xs">check</span>
                <span>Análisis de comisiones y costo de envío</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-400 text-xs">check</span>
                <span>Simulación de promociones y descuentos</span>
              </li>
            </ul>
          </div>

          {/* Card 3: Inventory & Buying Optimization */}
          <div className="bg-slate-900/80 border border-slate-800 p-8 rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 border border-emerald-500/20">
              <span className="material-symbols-outlined text-2xl">inventory</span>
            </div>
            <h4 className="text-xl font-bold text-white mb-3">
              3. Optimización de Inventario & Compras
            </h4>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              Categorizamos tu catálogo en productos Ancla (estrella), Acompañantes y Lastres. Diseñamos planes de compra y liquidación para mantener tu stock siempre saludable.
            </p>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-xs">check</span>
                <span>Prevención de quiebres de ventas</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-xs">check</span>
                <span>Planes para liberar capital inmovilizado</span>
              </li>
            </ul>
          </div>

          {/* Card 4: Omnichannel Integration */}
          <div className="bg-slate-900/80 border border-slate-800 p-8 rounded-2xl relative overflow-hidden group hover:border-purple-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-6 border border-purple-500/20">
              <span className="material-symbols-outlined text-2xl">sync_alt</span>
            </div>
            <h4 className="text-xl font-bold text-white mb-3">
              4. Integración & Operación Omnicanal
            </h4>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              Sincronización fluida entre tu tienda online, marketplaces y sucursales físicas. Unificamos la gestión de inventario para evitar vender sin stock o duplicar tareas.
            </p>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-400 text-xs">check</span>
                <span>Flujos de sincronización de stock</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-400 text-xs">check</span>
                <span>Estandarización de procesos de preparación</span>
              </li>
            </ul>
          </div>

          {/* Card 5: Technology & BI Dashboards (Arasy Proprietary) */}
          <div className="bg-slate-900/80 border border-slate-800 p-8 rounded-2xl relative overflow-hidden group hover:border-amber-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-6 border border-amber-500/20">
              <span className="material-symbols-outlined text-2xl">monitoring</span>
            </div>
            <h4 className="text-xl font-bold text-white mb-3">
              5. Implementación BI & Tecnología Arasy
            </h4>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              Desplegamos nuestra plataforma **Arasy Control Tower** para darte visibilidad en tiempo real de tus ventas, stock en riesgo y métricas clave en un solo tablero.
            </p>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400 text-xs">check</span>
                <span>Tableros de control ejecutivo</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400 text-xs">check</span>
                <span>Alertas prescriptivas de toma de decisión</span>
              </li>
            </ul>
          </div>

          {/* Card 6: Monthly Advisory & Growth Coaching */}
          <div className="bg-slate-900/80 border border-slate-800 p-8 rounded-2xl relative overflow-hidden group hover:border-sky-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-6 border border-sky-500/20">
              <span className="material-symbols-outlined text-2xl">groups</span>
            </div>
            <h4 className="text-xl font-bold text-white mb-3">
              6. Acompañamiento Mensual Ejecutivo
            </h4>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              Reuniones ejecutivas periódicas para evaluar KPIs, ajustar proyecciones de venta, validar campañas de marketing y liderar la toma de decisiones estratégicas.
            </p>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sky-400 text-xs">check</span>
                <span>Sesiones quincenales/mensuales de comité</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sky-400 text-xs">check</span>
                <span>Revisión de plan comercial y presupuesto</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION: METODOLOGÍA TRABAJO (#metodologia) */}
      <section id="metodologia" className="py-20 border-t border-slate-800/80 bg-slate-950/40 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-semibold text-blue-400 tracking-wider uppercase mb-2">
              Proceso de Trabajo
            </h2>
            <h3 className="text-3xl sm:text-4xl font-display font-bold text-white">
              Metodología estructurada en 4 pasos
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl relative">
              <div className="text-3xl font-extrabold text-blue-500/40 font-mono mb-4">01</div>
              <h4 className="text-base font-bold text-white mb-2">Diagnóstico Inicial</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Analizamos tus canales de venta actuales (Mercado Libre, Shopify, etc.), estructura de costos y catálogo de productos.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl relative">
              <div className="text-3xl font-extrabold text-teal-500/40 font-mono mb-4">02</div>
              <h4 className="text-base font-bold text-white mb-2">Plan Estratégico</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Diseñamos la hoja de ruta: pricing por canal, categorización de inventario y plan de acción para incrementar el margen bruto.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl relative">
              <div className="text-3xl font-extrabold text-emerald-500/40 font-mono mb-4">03</div>
              <h4 className="text-base font-bold text-white mb-2">Ejecución & Control</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Implementamos las optimizaciones operativas, ajustamos publicaciones y configuramos los tableros de seguimiento Arasy.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl relative">
              <div className="text-3xl font-extrabold text-amber-500/40 font-mono mb-4">04</div>
              <h4 className="text-base font-bold text-white mb-2">Escalado Sustentable</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Revisamos métricas en comités periódicos, acelerando canales rentables y manteniendo un nivel de inventario óptimo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: TECNOLOGÍA PROPIETARIA (#tecnologia) */}
      <section id="tecnologia" className="py-20 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 sm:p-12 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-semibold border border-teal-500/30">
                <span className="material-symbols-outlined text-sm">memory</span>
                <span>Tecnología Interna de Apoyo</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">
                Potenciados por nuestra Plataforma Analítica Arasy
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                A diferencia de consultoras tradicionales que entregan reportes estáticos en planillas, nuestros clientes cuentan con el respaldo de **Arasy**: nuestra plataforma propietaria para monitorear stock, simular combinaciones de productos y recibir recomendaciones prescriptivas en vivo.
              </p>
              <div className="pt-2 flex flex-wrap gap-4 text-xs font-medium text-slate-300">
                <span className="flex items-center gap-1.5 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/60">
                  <span className="material-symbols-outlined text-teal-400 text-sm">verified</span>
                  Matriz Ancla / Lastre
                </span>
                <span className="flex items-center gap-1.5 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/60">
                  <span className="material-symbols-outlined text-blue-400 text-sm">verified</span>
                  Simulador de Margen
                </span>
                <span className="flex items-center gap-1.5 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/60">
                  <span className="material-symbols-outlined text-amber-400 text-sm">verified</span>
                  Alertas de Quiebre
                </span>
              </div>
            </div>

            <div className="lg:col-span-5 bg-slate-950/80 p-6 rounded-2xl border border-slate-800 space-y-4 text-center">
              <div className="w-12 h-12 bg-blue-600/20 text-blue-400 rounded-xl flex items-center justify-center mx-auto border border-blue-500/30">
                <span className="material-symbols-outlined text-2xl">devices</span>
              </div>
              <h3 className="text-lg font-bold text-white">Demostración en Reuniones</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                En la sesión estratégica te mostramos cómo funciona la plataforma Arasy simulando escenarios reales para tu catálogo.
              </p>
              <a
                href="#contacto"
                className="inline-flex items-center gap-2 text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors"
              >
                <span>Pedí tu llamada con demostración</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: FORMULARIO DE CONTACTO (#contacto) */}
      <section id="contacto" className="py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 space-y-4">
            <span className="text-xs font-semibold text-blue-400 tracking-wider uppercase">
              Hablemos de tu negocio
            </span>
            <h2 className="text-3xl font-display font-bold text-white leading-tight">
              ¿Listo para acelerar tus ventas y optimizar tu rentabilidad?
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Completá el formulario y coordinamos una llamada estratégica de 30 minutos para analizar la situación actual de tu e-commerce, tus canales de venta y darte un diagnóstico inicial.
            </p>

            <div className="space-y-3 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center text-xs">
                  ✓
                </div>
                <span>Diagnóstico preliminar de tus canales de venta.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center text-xs">
                  ✓
                </div>
                <span>Demostración de la plataforma Arasy en vivo.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center text-xs">
                  ✓
                </div>
                <span>Recomendaciones accionables de aplicación inmediata.</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-negativo.svg"
              alt="ARASY Logo"
              width={140}
              height={42}
              className="h-9 w-auto object-contain opacity-95"
            />
            <span className="text-slate-600">|</span>
            <span>© {new Date().getFullYear()} E-Commerce & Retail Intelligence.</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#servicios" className="hover:text-slate-200 transition-colors">
              Servicios
            </a>
            <a href="#plataformas" className="hover:text-slate-200 transition-colors">
              Marketplaces
            </a>
            <a href="#contacto" className="hover:text-slate-200 transition-colors">
              Contacto
            </a>
            {/* Discreet link for internal admin login */}
            <Link
              href="/login"
              className="text-slate-600 hover:text-slate-400 transition-colors font-mono"
            >
              [Acceso Demo]
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
