"use client";

import { useState } from "react";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    website: "",
    phone: "",
    channel: "MERCADO_LIBRE",
    goal: "INCREMENTAR_MARGEN",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || "Ocurrió un error al enviar tu consulta.");
      }
    } catch {
      setError("Error de red. Por favor intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-slate-900/90 border border-emerald-500/30 p-8 rounded-2xl text-center shadow-2xl animate-fade-in">
        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/40">
          <span className="material-symbols-outlined text-3xl">check_circle</span>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">¡Sesión Solicitada!</h3>
        <p className="text-slate-300 text-sm max-w-md mx-auto mb-6">
          Gracias por ponerte en contacto. Analizaremos los datos de tu marca y te escribiremos por WhatsApp/Email en menos de 24 horas para agendar la llamada estratégica.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setFormData({
              name: "",
              email: "",
              company: "",
              website: "",
              phone: "",
              channel: "MERCADO_LIBRE",
              goal: "INCREMENTAR_MARGEN",
              message: "",
            });
          }}
          className="text-xs text-blue-400 hover:text-blue-300 underline font-medium"
        >
          Enviar otra consulta
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl space-y-5"
    >
      <div className="border-b border-slate-800 pb-4 mb-4">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-teal-400 uppercase tracking-wider mb-1">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <span>Diagnóstico Estratégico Sin Costo</span>
        </div>
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          Agendar Sesión de Consultoría
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Cuéntanos sobre tu comercio para analizar tus canales y enviarte una propuesta de aceleración.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">error</span>
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Nombre Completo *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: Martín Rodríguez"
            className="w-full bg-slate-950/70 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Email de Contacto *
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="martin@tumarca.com"
            className="w-full bg-slate-950/70 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Empresa / Marca
          </label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            placeholder="Ej: Urban Store"
            className="w-full bg-slate-950/70 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Sitio Web o Tienda Mercado Libre
          </label>
          <input
            type="text"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder="www.tumarca.com o Link Meli"
            className="w-full bg-slate-950/70 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Canal de Venta Principal
          </label>
          <select
            value={formData.channel}
            onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
            className="w-full bg-slate-950/70 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="MERCADO_LIBRE">Mercado Libre (Official Store / Platinum)</option>
            <option value="SHOPIFY">Shopify / Tienda propia</option>
            <option value="TIENDA_NUBE">Tienda Nube / WooCommerce</option>
            <option value="MULTICANAL">Multicanal (E-commerce + Marketplaces)</option>
            <option value="RETAIL_PHYSICAL">Retail Físico + E-commerce</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Objetivo Principal
          </label>
          <select
            value={formData.goal}
            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
            className="w-full bg-slate-950/70 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="INCREMENTAR_MARGEN">Aumentar Margen Bruto & Rentabilidad</option>
            <option value="ESCALAR_VENTAS">Escalar Ventas en Marketplaces</option>
            <option value="LIBERAR_SOBRESTOCK">Liberar Capital de Sobrestock</option>
            <option value="PROFESIONALIZAR">Profesionalizar la Operación Multicanal</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5">
          WhatsApp / Teléfono
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+54 9 11 1234-5678"
          className="w-full bg-slate-950/70 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5">
          Mensaje o Detalle de la Operación (Opcional)
        </label>
        <textarea
          rows={3}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Cuéntanos brevemente sobre tu catálogo, volumen de ventas o principales inquietudes..."
          className="w-full bg-slate-950/70 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        ></textarea>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 via-blue-500 to-teal-400 hover:from-blue-500 hover:to-teal-300 text-white font-semibold py-3.5 px-6 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Enviando Consulta...</span>
          </>
        ) : (
          <>
            <span>Solicitar Diagnóstico Estratégico</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </>
        )}
      </button>

      <p className="text-[11px] text-center text-slate-500">
        🔒 Confidencialidad garantizada. Respetamos tus datos de negocio.
      </p>
    </form>
  );
}
