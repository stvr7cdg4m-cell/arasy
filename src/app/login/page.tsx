"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push(redirectPath);
      } else {
        setError(data.error || "Contraseña incorrecta.");
      }
    } catch {
      setError("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 animate-shake">
          <span className="material-symbols-outlined text-sm">error</span>
          <span>{error}</span>
        </div>
      )}

      <div>
        <label
          htmlFor="password"
          className="block text-xs font-medium text-slate-300 mb-1.5"
        >
          Contraseña de Demostración
        </label>
        <div className="relative">
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            required
            className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium py-3 px-4 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Verificando...</span>
          </>
        ) : (
          <>
            <span>Ingresar a Arasy Demo</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </>
        )}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#070D18] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-3">
              <Image
                src="/logo-negativo.svg"
                alt="ARASY Logo"
                width={180}
                height={60}
                className="h-16 w-auto object-contain"
                priority
              />
            </Link>
            <h1 className="text-lg font-semibold text-slate-200 mt-2">
              Acceso a Entorno Demo
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Ingresa la contraseña de demostración para acceder a la plataforma.
            </p>
          </div>

          <Suspense fallback={<div className="text-slate-400 text-xs text-center py-4">Cargando...</div>}>
            <LoginForm />
          </Suspense>

          <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors inline-flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Volver a la página principal</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
