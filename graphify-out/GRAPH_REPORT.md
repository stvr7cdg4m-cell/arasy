# Graph Report - /Users/Federicorm 1/.gemini/antigravity/scratch/Arasy  (2026-08-05)

## Corpus Check
- Corpus is ~30,369 words - fits in a single context window. You may not need a graph.

## Summary
- 236 nodes · 287 edges · 31 communities (17 shown, 14 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Vistas y Lógica del Mix
- Dependencias de Desarrollo
- Dependencias Principales
- Configuración TypeScript
- Base de Datos y Rutas de API
- Finanzas y Análisis de Stock
- Componentes del Dashboard
- Copiloto AI (Chat y Herramientas)
- Scripts y Metadata npm
- Layout y Navegación Principal
- Archivos de Soporte TypeScript
- Documentación y Changelog
- Gráfico de Canales
- Gráfico de Rendimiento MTD
- Página de Integraciones
- Sincronización de Canales
- Instrucciones de Graphify
- Configuración de ESLint
- Configuración de Next.js
- Configuración de PostCSS
- Reglas de Next.js para Agentes
- Icono de Archivo SVG
- Icono de Globo SVG
- Logo Negativo SVG
- Logo Positivo SVG
- Logo de Next.js SVG
- Logo de Vercel SVG
- Icono de Ventana SVG
- Documentación Readme

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `prisma` - 13 edges
3. `formatCurrency()` - 11 edges
4. `POST()` - 9 edges
5. `Financials` - 8 edges
6. `formatPercent` - 7 edges
7. `include` - 7 edges
8. `scripts` - 5 edges
9. `ClientMixOptimizer()` - 5 edges
10. `ClientStockAnalysis()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Fase 1: Estabilización Técnica` --conceptually_related_to--> `Versión 0.3.0`  [INFERRED]
  CLAUDE.md → CHANGELOG.md
- `Fase 2: Conexión de Datos Activa` --conceptually_related_to--> `Versión 0.3.0`  [INFERRED]
  CLAUDE.md → CHANGELOG.md
- `PlanningPage()` --calls--> `formatCurrency()`  [EXTRACTED]
  src/app/planning/page.tsx → src/lib/utils.ts
- `Graphify Integration Rules` --conceptually_related_to--> `Graphify Workflow`  [INFERRED]
  .agents/rules/graphify.md → .agents/workflows/graphify.md
- `ClientDecisionCenter()` --calls--> `formatCurrency()`  [EXTRACTED]
  src/app/decision-center/ClientDecisionCenter.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (31 total, 14 thin omitted)

### Community 0 - "Vistas y Lógica del Mix"
Cohesion: 0.12
Nodes (17): ClientDecisionCenter(), ClientDecisionCenterProps, Message, ClientMixOptimizer(), ClientMixOptimizerProps, ExtendedSkuMixItem, ClientPlanningView(), PageProps (+9 more)

### Community 1 - "Dependencias de Desarrollo"
Cohesion: 0.10
Nodes (21): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, prisma, tailwindcss, @tailwindcss/postcss (+13 more)

### Community 2 - "Dependencias Principales"
Cohesion: 0.11
Nodes (19): better-sqlite3, lucide-react, next, openai, dependencies, better-sqlite3, lucide-react, next (+11 more)

### Community 3 - "Configuración TypeScript"
Cohesion: 0.11
Nodes (19): dom, dom.iterable, esnext, compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules (+11 more)

### Community 4 - "Base de Datos y Rutas de API"
Cohesion: 0.15
Nodes (4): PageProps, adapter, globalForPrisma, prisma

### Community 5 - "Finanzas y Análisis de Stock"
Cohesion: 0.20
Nodes (8): GET(), ClientPlanningViewProps, PlanningItem, PageProps, StockAnalysisPage(), Financials, SalesAnalytics, SalesHistoryItem

### Community 6 - "Componentes del Dashboard"
Cohesion: 0.15
Nodes (13): ChannelDistributionChart, ChannelDistributionChartWrapper(), ChannelDistributionChartWrapperProps, ChannelItem, ChannelSyncStatus, ChannelSyncStatusWrapper(), DashboardPage(), formatNumber() (+5 more)

### Community 7 - "Copiloto AI (Chat y Herramientas)"
Cohesion: 0.23
Nodes (13): ActionPayload, ChatMessage, executeCommercialDecision(), generateHeuristicResponse(), getAlerts(), getGoals(), getInventorySummary(), getProductDetail() (+5 more)

### Community 8 - "Scripts y Metadata npm"
Cohesion: 0.18
Nodes (10): name, prisma, seed, private, scripts, build, dev, lint (+2 more)

### Community 9 - "Layout y Navegación Principal"
Cohesion: 0.22
Nodes (7): manrope, metadata, montserrat, Header(), NavItem, navItems, Sidebar()

### Community 10 - "Archivos de Soporte TypeScript"
Cohesion: 0.20
Nodes (9): **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx, exclude (+1 more)

### Community 11 - "Documentación y Changelog"
Cohesion: 0.29
Nodes (8): Historial de Cambios Arasy, Versión 0.1.0, Versión 0.2.0, Versión 0.3.0, Guía de Desarrollo Arasy, Fase 1: Estabilización Técnica, Fase 2: Conexión de Datos Activa, Fase 3: Inteligencia & Visualización

### Community 12 - "Gráfico de Canales"
Cohesion: 0.33
Nodes (3): ChannelDistributionChartProps, ChannelItem, CustomTooltipProps

### Community 13 - "Gráfico de Rendimiento MTD"
Cohesion: 0.33
Nodes (3): CustomTooltipProps, MonthlyDataItem, PerformanceChartProps

### Community 14 - "Página de Integraciones"
Cohesion: 0.40
Nodes (3): ClientIntegrations(), IntegrationState, LogEntry

## Knowledge Gaps
- **108 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+103 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `prisma` connect `Base de Datos y Rutas de API` to `Vistas y Lógica del Mix`, `Finanzas y Análisis de Stock`, `Componentes del Dashboard`, `Copiloto AI (Chat y Herramientas)`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Dependencias de Desarrollo` to `Scripts y Metadata npm`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Dependencias Principales` to `Scripts y Metadata npm`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _108 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Vistas y Lógica del Mix` be split into smaller, more focused modules?**
  _Cohesion score 0.11822660098522167 - nodes in this community are weakly interconnected._
- **Should `Dependencias de Desarrollo` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `Dependencias Principales` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._