# CHANGELOG - ARASY

Historial de cambios y evolución del producto **ARASY** (Claridad para decidir).

---

## [0.3.0] - 2026-06-04
### Añadido
* **APIs de Persistencia y Negocio:**
  * Endpoint `POST /api/planning/execute` para procesar compras (incrementando stock físico), liquidaciones (creando un registro de `Sale` y reduciendo stock) y resolución de alertas asociadas en SQLite con Prisma.
  * Endpoint `GET /api/alerts` para retornar todas las alertas operativas no resueltas de la base de datos.
* **Alertas Operativas Dinámicas en Frontend:**
  * El panel de notificaciones del Header se conecta dinámicamente a `/api/alerts` en lugar de mostrar datos simulados estáticos.
  * Los componentes se suscriben al evento global `arasy_alerts_updated` para refrescar las notificaciones del header tras completar una acción de negocio.

### Modificado
* **Integración Activa en Vistas del Cliente:**
  * `ClientPlanningView.tsx` modificado para persistir la compra/liquidación en la base de datos al pulsar "Ejecutar".
  * `ClientStockAnalysis.tsx` modificado en el botón del modal "Aplicar Campaña" para gatillar la API de ejecución y actualizar stock real y alertas.
  * `dashboard/page.tsx` y `decision-center/page.tsx` modificados para cargar y contar únicamente las alertas no resueltas de la base de datos.

---

## [0.2.0] - 2026-06-04
### Añadido
* **Optimización LCP de Recursos:** Logotipo de Sidebar migrado a Next.js `Image` para mejorar rendimiento.

### Modificado
* **Tipado Estático Riguroso (TypeScript):**
  * Definición de interfaces `SavedScenario` en `ClientMixOptimizer.tsx` y `ChatMessage` en `chat/route.ts` para eliminar el uso de tipos implícitos y explícitos `any`.
  * Integración de tipos directos de Prisma `Product` y `Goal` en la firma de `generateHeuristicResponse` en `src/app/api/chat/route.ts`.
  * Corrección de catch blocks no tipados (`catch (error: any)`) en todos los endpoints de API (`chat`, `mixes`, `planning/save`, `stock-analysis`) reemplazándolos con validaciones de tipo seguras `instanceof Error`.
* **Rendimiento y Ciclos de Renderizado (React):**
  * Encapsulado de la hidratación de estados desde `localStorage` en `Header.tsx` y `Sidebar.tsx` con directivas locales de ESLint para eliminar parpadeo y renders innecesarios.
  * Remoción de memoización manual redundante en `ClientPlanningView.tsx` (`manualRevenue`), permitiendo al React Compiler optimizar el componente sin interrupciones.
  * Simplificación del estado del cliente en `ClientStockAnalysis.tsx` removiendo llamadas inactivas a `setItems`.
* **Limpieza de Código:**
  * Remoción de importaciones muertas en `dashboard/page.tsx` (`formatCurrency`, `formatPercentage`).
  * Eliminación de variables no utilizadas en `chat/route.ts` y `seed.ts` (`channelMultiplier`, `isFuture`).
  * Configuración del indicador local `no-page-custom-font` en el link de tipografía de `layout.tsx` para alinearlo con App Router.

---

## [0.1.0] - 2026-06-04
### Añadido
* **Estructura y Shell del Sistema:**
  * Navegación lateral (`Sidebar`) con estados activos y perfil de usuario persistido en `localStorage`.
  * Encabezado (`Header`) con barra de búsqueda global, selector de período mensual dinámico, panel de notificaciones operativas y Consola de Configuración del Demo Backend (para simular comisiones e inventario objetivo).
* **Módulo de Dashboard (Control Tower):**
  * KPIs clave: Objetivo de ventas, Venta actual MTD con porcentaje de incremento, Brecha Restante (GAP) y Margen Ponderado del Mix con indicadores de salud.
  * Resumen de Inventario con capital inmovilizado y cobertura promedio en días.
  * Gráfico interactivo personalizado de performance comercial de 12 meses históricos y 3 meses proyectados.
  * Paneles de Oportunidades (Empujar), Riesgos (Liquidar) y Alertas de Operación (Control Tower).
* **Módulo de Planning Inteligente:**
  * Panel de control de planificación con cálculo de ingreso potencial, exposición a riesgos y acciones pendientes.
  * Pipeline de decisiones sugeridas por SKU (Empujar, Mantener, Liquidar, Excluir) basado en un algoritmo de promedio ponderado de ventas de los últimos 90 días (50% M-1, 30% M-2, 20% M-3).
  * Simulador de compras e incrementos de stock, y herramienta de ajuste masivo de objetivos comerciales.
* **Módulo de Mix Optimizer:**
  * Simulador dinámico del mix comercial que evalúa el cumplimiento del margen ponderado a nivel global (no SKU) en tiempo real al editar precio, costo o unidades objetivo de cada SKU.
  * Guardado de escenarios simulados en base de datos local para análisis comparativo posterior.
* **Módulo de Análisis de Stock:**
  * Diagnóstico detallado de inventario clasificando la salud de los SKUs (Saludable, Exceso, Crítico) frente a un estándar de cobertura objetivo de 1.5 meses.
  * Panel de detalle heurístico de IA por SKU que calcula el capital neto a liberar y el impacto financiero esperado.
* **Módulo de Decision Center AI (Copiloto):**
  * Chatbot conversacional integrado con OpenAI (GPT-4o-mini) y motor heurístico local de respaldo en español en caso de no tener API Key configurada.
  * Reconocimiento inteligente de intenciones (búsqueda de liquidaciones, stock crítico, metas, márgenes y alertas) y renderizado nativo de tablas markdown dentro de la interfaz de chat.
  * Panel de impacto económico lateral de acceso rápido para evaluar el capital inmovilizado.
* **Infraestructura de Datos y Lógica de Negocio:**
  * Integración con SQLite local mediante Prisma Client.
  * Lógica financiera aislada para el cálculo de comisiones de Mercado Libre y Shopify en `financials.ts`.
  * Motor de cálculo del mix comercial en `mixEngine.ts`.
  * Análisis de velocidad y run-rate de inventario en `sales_analytics.ts`.
