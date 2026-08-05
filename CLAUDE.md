# ARASY - Guía de Desarrollo y Estado del Proyecto

## Comandos Operativos
* **Desarrollo Local:** `npm run dev` (Inicia el servidor en http://localhost:3000)
* **Verificación de Tipos y Linter:** `npm run lint` (Debe pasar con cero errores/warnings)
* **Compilación de Producción:** `npm run build`
* **Base de Datos SQLite:**
  * Generar cliente de Prisma: `npx prisma generate`
  * Siembra de datos de simulación: `npx prisma db seed`

---

## Estado del Proyecto (v0.3.0)
* **Fase 1 (Estabilización Técnica): Completada.**
  * Todos los errores de renderizado en cascada de `localStorage` (`react-hooks/set-state-in-effect`), warnings de NextJS/LCP y tipados ambiguos `any` fueron resueltos.
  * Repositorio Git re-inicializado y limpio con dos commits clave (`f8da8a0` y `6ef69d3`).
* **Fase 2 (Conexión de Datos Activa): Completada.**
  * Endpoints creados: `POST /api/planning/execute` (reposición, liquidación y registro de ventas) y `GET /api/alerts` (alertas activas no resueltas).
  * Vistas del cliente (`ClientPlanningView.tsx` y `ClientStockAnalysis.tsx`) conectadas transaccionalmente a la base de datos de SQLite.
  * Campanita de notificaciones en `Header.tsx` conectada dinámicamente al backend y refrescada por eventos globales.

---

## Próximos Pasos (Fase 3: Inteligencia & Visualización) - SESIÓN DE MAÑANA
1. **Optimización de IA (Tool Calling / Function Calling):**
   * Migrar la API en `src/app/api/chat/route.ts` para que use llamadas a funciones de OpenAI en lugar de inyectar todo el catálogo como texto de sistema, haciéndolo escalable a miles de SKUs.
2. **Visualización Gráfica:**
   * Sustituir las barras HTML/CSS del Dashboard por un componente interactivo basado en `Recharts` para mostrar el historial de ventas y forecast.
3. **Planes de Despliegue (Futuro):**
   * Revisar el archivo `deployment_analysis.md` en el cerebro de la app para preparar la publicación en **Vercel** usando base de datos **Turso** con el dominio `arasy.app`.
