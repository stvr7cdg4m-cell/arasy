"use client";

import { useState, useRef, useEffect } from "react";
import { formatCurrency, formatPercent } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ClientDecisionCenterProps {
  initialCapitalToLiberate: number;
  activeAlertsCount: number;
  estimatedMargin: number;
  liquidarCount: number;
}

export default function ClientDecisionCenter({
  initialCapitalToLiberate,
  activeAlertsCount,
  estimatedMargin,
  liquidarCount,
}: ClientDecisionCenterProps) {
  const router = useRouter();
  // Lista de mensajes en el chat
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `¡Hola Diego! Bienvenido al **Decision Center AI**. 

Soy tu copiloto financiero ARASY, y tengo cargados en mi contexto el catálogo actual de la distribuidora de tecnología, las ventas de los últimos 12 meses y las metas de este mes.

He detectado un **capital de costo inmovilizado de $${initialCapitalToLiberate.toLocaleString()} ARS** en inventario de baja rotación o sobrestock.

¿En qué puedo ayudarte a decidir hoy? Puedes hacerme preguntas comerciales o usar las sugerencias rápidas de abajo.`,
      timestamp: new Date(),
    },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final del chat al recibir mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Manejar el envío de mensajes
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Agregar mensaje del usuario
    const userMsg: Message = {
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    try {
      // Llamar al backend API route
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.content,
            timestamp: new Date(),
          },
        ]);

        // Procesar las acciones mutativas de la IA (Fase C)
        if (data.actions && data.actions.length > 0) {
          try {
            const customLogs = localStorage.getItem("arasy_custom_logs") || "[]";
            const parsedLogs = JSON.parse(customLogs);
            
            data.actions.forEach((act: { text: string }) => {
              parsedLogs.push({
                timestamp: new Date().toLocaleTimeString(),
                type: "success",
                text: act.text,
              });
            });

            localStorage.setItem("arasy_custom_logs", JSON.stringify(parsedLogs));
            // Sincronizar logs en vivo
            window.dispatchEvent(new Event("arasy_integrations_changed"));
            // Recargar alertas en el Header
            window.dispatchEvent(new Event("arasy_alerts_updated"));
          } catch (e) {
            console.error("Error al procesar logs de la IA:", e);
          }
          // Forzar refresco de Server Components (métricas de Decision Center)
          router.refresh();
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Disculpa, he tenido una dificultad técnica para consultar mis modelos predictivos. Por favor, vuelve a intentar.",
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error consultando chatbot:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "No he podido conectar con el servicio central de IA. Por favor, comprueba tu conexión local.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Renderizador básico e inteligente de Markdown
  // Soporta: Negrita, viñetas, tablas de markdown, bloques de código, links y saltos de línea
  const renderMarkdown = (text: string) => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    
    let inTable = false;
    let tableHeaders: string[] = [];
    let tableRows: string[][] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detección de tablas Markdown (líneas que empiezan y terminan con |)
      if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
        // Ignorar la línea de separación del header | :--- | :--- |
        if (line.includes("---") || line.includes(":-")) {
          continue;
        }

        const cells = line
          .split("|")
          .map((c) => c.trim())
          .filter((c, idx, arr) => idx > 0 && idx < arr.length - 1); // Quitar primer y último elementos vacíos

        if (!inTable) {
          inTable = true;
          tableHeaders = cells;
          tableRows = [];
        } else {
          tableRows.push(cells);
        }
        continue;
      }

      // Si veníamos procesando una tabla y la línea actual ya no es tabla, la renderizamos
      if (inTable && (!line.trim().startsWith("|") || !line.trim().endsWith("|") || i === lines.length - 1)) {
        inTable = false;
        
        // Agregar el elemento de tabla renderizado
        elements.push(
          <div key={`table-${i}`} className="my-4 overflow-x-auto rounded-xl border border-slate-muted/20 card-shadow">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-muted/20 text-slate-muted text-[10px] uppercase font-bold">
                  {tableHeaders.map((th, thIdx) => (
                    <th key={thIdx} className="py-2.5 px-4 font-bold">
                      {parseInlineMarkdown(th)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-muted/10">
                {tableRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-slate-50 transition-colors">
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="py-2.5 px-4 font-medium text-midnight">
                        {parseInlineMarkdown(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      // Si no es tabla, procesar otros bloques
      if (!inTable) {
        const trimmed = line.trim();

        // Títulos de nivel 3 (###)
        if (trimmed.startsWith("###")) {
          elements.push(
            <h4 key={i} className="font-display font-bold text-sm text-midnight mt-4 mb-2">
              {parseInlineMarkdown(trimmed.replace("###", "").trim())}
            </h4>
          );
        }
        // Títulos de nivel 2 (##)
        else if (trimmed.startsWith("##")) {
          elements.push(
            <h3 key={i} className="font-display font-bold text-base text-midnight mt-5 mb-3 border-b border-slate-200 pb-1">
              {parseInlineMarkdown(trimmed.replace("##", "").trim())}
            </h3>
          );
        }
        // Viñetas (bullet points)
        else if (trimmed.startsWith("*") || trimmed.startsWith("-")) {
          const content = trimmed.substring(1).trim();
          elements.push(
            <div key={i} className="flex gap-2 ml-4 my-1.5 items-start text-xs leading-relaxed text-slate-muted">
              <span className="text-primary-blue mt-1 shrink-0 text-[10px]">•</span>
              <span className="font-sans text-midnight">{parseInlineMarkdown(content)}</span>
            </div>
          );
        }
        // Párrafo ordinario
        else if (trimmed.length > 0) {
          elements.push(
            <p key={i} className="text-xs font-sans leading-relaxed text-midnight my-2">
              {parseInlineMarkdown(trimmed)}
            </p>
          );
        }
        // Salto de línea / línea vacía
        else {
          elements.push(<div key={i} className="h-2"></div>);
        }
      }
    }

    return elements;
  };

  // Parsea negritas, códigos inline y links en formato Markdown
  const parseInlineMarkdown = (text: string) => {
    // Reemplazar negritas **texto**
    const boldRegex = /\*\*(.*?)\*\*/g;
    // Reemplazar códigos inline `texto`
    const codeRegex = /`(.*?)`/g;
    // Reemplazar enlaces Markdown [texto](url)
    const linkRegex = /\[(.*?)\]\((.*?)\)/g;

    let parts: React.ReactNode[] = [text];

    // Procesar negrita
    parts = parts.flatMap((part) => {
      if (typeof part !== "string") return part;
      const split = part.split(boldRegex);
      return split.map((str, idx) => (idx % 2 === 1 ? <strong key={idx} className="font-bold text-midnight">{str}</strong> : str));
    });

    // Procesar código inline
    parts = parts.flatMap((part) => {
      if (typeof part !== "string") return part;
      const split = part.split(codeRegex);
      return split.map((str, idx) => (idx % 2 === 1 ? <code key={idx} className="bg-ice text-primary-blue px-1 py-0.5 rounded font-mono text-[10px] font-bold">{str}</code> : str));
    });

    // Procesar links [texto](/url)
    parts = parts.flatMap((part) => {
      if (typeof part !== "string") return part;
      
      const results: React.ReactNode[] = [];
      let lastIndex = 0;
      let match;
      
      // Reiniciar regex global
      linkRegex.lastIndex = 0;
      
      while ((match = linkRegex.exec(part)) !== null) {
        // Agregar texto anterior
        if (match.index > lastIndex) {
          results.push(part.substring(lastIndex, match.index));
        }
        
        const linkText = match[1];
        const linkUrl = match[2];
        
        results.push(
          <Link key={match.index} href={linkUrl} className="text-primary-blue font-bold hover:underline">
            {linkText}
          </Link>
        );
        
        lastIndex = linkRegex.lastIndex;
      }
      
      if (lastIndex < part.length) {
        results.push(part.substring(lastIndex));
      }
      
      return results.length > 0 ? results : part;
    });

    return parts;
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden relative bg-[#EAF2FF]/50">
      
      {/* 1. SECCIÓN PRINCIPAL: CHATBOT */}
      <section className="flex-1 flex flex-col h-full border-r border-slate-muted/20">
        
        {/* Encabezado del Copiloto */}
        <div className="bg-white px-6 py-4 border-b border-slate-muted/15 flex justify-between items-center shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-midnight flex items-center justify-center border border-white/10 shadow-md">
              <span className="material-symbols-outlined text-teal-push text-[24px] font-bold animate-pulse">
                psychology
              </span>
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-midnight flex items-center gap-1.5">
                Copiloto ARASY AI
                <span className="text-[9px] bg-teal-push/10 text-teal-push border border-teal-push/20 px-2 py-0.5 rounded-full font-sans font-bold">
                  Conectado
                </span>
              </h3>
              <p className="text-[10px] text-slate-muted font-sans font-medium">
                Análisis predictivo de inventario y optimización del mix.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setMessages(messages.slice(0, 1))}
            className="flex items-center gap-1 px-3 py-1.5 border border-slate-muted/20 hover:border-slate-muted/50 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-muted hover:text-midnight transition-all active:scale-95 duration-100 cursor-pointer"
            title="Limpiar Conversación"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
            Limpiar
          </button>
        </div>

        {/* Historial de Mensajes */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {messages.map((msg, index) => {
            const isBot = msg.role === "assistant";
            return (
              <div
                key={index}
                className={`flex gap-3 max-w-[85%] ${
                  isBot ? "self-start mr-auto" : "self-end ml-auto flex-row-reverse"
                }`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border shadow-sm ${
                  isBot 
                    ? "bg-midnight text-teal-push border-white/10" 
                    : "bg-primary-blue text-white border-primary-blue/20"
                }`}>
                  <span className="material-symbols-outlined text-[18px]">
                    {isBot ? "psychology" : "person"}
                  </span>
                </div>

                {/* Burbuja de Mensaje */}
                <div className={`rounded-2xl p-5 shadow-sm border ${
                  isBot 
                    ? "bg-white text-midnight border-slate-muted/5 rounded-tl-sm" 
                    : "bg-primary-blue text-white border-primary-blue/10 rounded-tr-sm"
                }`}>
                  {isBot ? (
                    <div className="space-y-1">{renderMarkdown(msg.content)}</div>
                  ) : (
                    <p className="text-xs font-sans whitespace-pre-wrap font-medium">{msg.content}</p>
                  )}
                  <div className={`text-[8px] mt-2 font-mono flex items-center justify-end ${
                    isBot ? "text-slate-muted" : "text-white/60"
                  }`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Animación Escribiendo */}
          {isTyping && (
            <div className="flex gap-3 max-w-[85%] self-start mr-auto">
              <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border border-white/10 bg-midnight text-teal-push shadow-sm">
                <span className="material-symbols-outlined text-[18px] animate-spin">
                  progress_activity
                </span>
              </div>
              <div className="bg-white rounded-2xl rounded-tl-sm p-4 border border-slate-muted/5 flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 bg-slate-muted/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-2 h-2 bg-slate-muted/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-2 h-2 bg-slate-muted/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Sugerencias Rápidas */}
        <div className="px-6 py-2 shrink-0 overflow-x-auto flex gap-2 custom-scrollbar select-none bg-white/40">
          {[
            "¿Qué productos debo liquidar?",
            "¿Cuáles son los productos ANCLA?",
            "¿Cómo está el margen global?",
            "¿Qué alertas de stock tengo?"
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="px-3.5 py-2 bg-white hover:bg-ice border border-slate-muted/15 hover:border-primary-blue/30 rounded-xl text-[11px] font-sans font-bold text-midnight transition-all shrink-0 cursor-pointer active:scale-95 duration-100 shadow-sm"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input de Texto */}
        <div className="p-4 bg-white border-t border-slate-muted/15 shrink-0 flex gap-2 items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendMessage(inputValue);
            }}
            placeholder="Consulte a ARASY sobre rentabilidad, excesos de stock, reposiciones..."
            className="flex-1 bg-slate-50 border border-slate-muted/20 rounded-xl py-3 px-4 text-xs font-sans text-midnight focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:bg-white transition-all placeholder:text-slate-muted"
          />
          <button
            onClick={() => handleSendMessage(inputValue)}
            disabled={!inputValue.trim()}
            className="w-11 h-11 bg-primary-blue hover:bg-primary-blue/90 disabled:bg-slate-100 disabled:text-slate-muted text-white rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 shadow-md shadow-primary-blue/10 disabled:shadow-none"
          >
            <span className="material-symbols-outlined text-[20px] font-bold">send</span>
          </button>
        </div>

      </section>

      {/* 2. PANEL LATERAL: IMPACTO ECONÓMICO */}
      <aside className="w-80 bg-white h-full flex flex-col p-6 overflow-y-auto custom-scrollbar shrink-0 shadow-lg relative z-10">
        
        {/* Resumen de Impacto */}
        <div className="space-y-6">
          <div className="border-b border-slate-muted/10 pb-4">
            <span className="text-[9px] font-bold text-slate-muted uppercase tracking-wider block">Resumen Operativo</span>
            <h4 className="font-display font-bold text-sm text-midnight mt-1">Impacto Económico</h4>
          </div>

          {/* Tarjeta de Capital Inmovilizado */}
          <div className="bg-midnight text-white p-5 rounded-2xl border border-white/10 shadow-md relative overflow-hidden">
            <span className="text-[10px] font-bold text-slate-muted uppercase tracking-wider block">Capital a Liberar</span>
            <h3 className="text-2xl font-display font-bold text-coral-liquidate mt-1">
              {formatCurrency(initialCapitalToLiberate)}
            </h3>
            <p className="text-[10px] text-slate-muted mt-2 leading-relaxed">
              Tied-up capital en costo neto acumulado en **{liquidarCount} SKUs** con recomendación de liquidación inmediata.
            </p>
            <span className="material-symbols-outlined text-[60px] absolute -right-3 -bottom-3 opacity-5 text-white pointer-events-none select-none">
              inventory_2
            </span>
          </div>

          {/* Lista de mini-métricas */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-muted/5 py-1">
              <span className="text-xs text-slate-muted font-sans font-semibold">Margen Estimado Q2</span>
              <span className="text-xs font-bold text-teal-push font-mono bg-teal-push/5 px-2 py-0.5 rounded">
                {formatPercent(estimatedMargin)}
              </span>
            </div>
            
            <div className="flex justify-between items-center border-b border-slate-muted/5 py-1">
              <span className="text-xs text-slate-muted font-sans font-semibold">Alertas de Stock</span>
              <span className="text-xs font-bold text-coral-liquidate font-mono bg-coral-liquidate/5 px-2 py-0.5 rounded">
                {activeAlertsCount} Críticas
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-muted/5 py-1">
              <span className="text-xs text-slate-muted font-sans font-semibold">Plan de Simulación</span>
              <span className="text-xs font-bold text-midnight font-sans bg-ice px-2 py-0.5 rounded">
                Tecnología Mayo
              </span>
            </div>
          </div>

          {/* Sugerencia Rápida */}
          <div className="bg-[#EAF2FF]/40 border border-slate-muted/15 rounded-xl p-4 space-y-3">
            <h5 className="font-display font-bold text-xs text-midnight flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary-blue text-[18px]">info</span>
              Acciones de Copiloto
            </h5>
            <p className="text-[11px] text-slate-muted leading-relaxed">
              Puedes ordenar compras urgentes para evitar quiebres o configurar promociones para reducir sobrestock.
            </p>
            
            <div className="space-y-2 pt-1">
              <Link 
                href="/mix-optimizer" 
                className="w-full py-2 bg-primary-blue hover:bg-primary-blue/90 text-white font-bold text-[10px] rounded-xl flex items-center justify-center gap-1 transition-all active:scale-95 duration-100 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">analytics</span>
                Simular en Mix Optimizer
              </Link>
              
              <Link 
                href="/planning" 
                className="w-full py-2 border border-slate-muted/20 hover:border-slate-muted/50 hover:bg-slate-50 text-slate-muted hover:text-midnight font-bold text-[10px] rounded-xl flex items-center justify-center gap-1 transition-all active:scale-95 duration-100 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                Ir a Planning Inteligente
              </Link>
            </div>
          </div>

        </div>

      </aside>

    </div>
  );
}
