# Graph Report - /Users/Federicorm 1/.gemini/antigravity/scratch/Arasy  (2026-08-05)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 239 nodes · 290 edges · 31 communities (17 shown, 14 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c20f44cd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

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
8. `scripts` - 6 edges
9. `ClientMixOptimizer()` - 5 edges
10. `ClientStockAnalysis()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Fase 1: Estabilización Técnica` --conceptually_related_to--> `Versión 0.3.0`  [INFERRED]
  CLAUDE.md → CHANGELOG.md
- `Fase 2: Conexión de Datos Activa` --conceptually_related_to--> `Versión 0.3.0`  [INFERRED]
  CLAUDE.md → CHANGELOG.md
- `ClientMixOptimizer()` --calls--> `calculateMixMetrics()`  [EXTRACTED]
  src/app/mix-optimizer/ClientMixOptimizer.tsx → src/lib/business-logic/mixEngine.ts
- `PlanningPage()` --calls--> `formatCurrency()`  [EXTRACTED]
  src/app/planning/page.tsx → src/lib/utils.ts
- `Graphify Integration Rules` --conceptually_related_to--> `Graphify Workflow`  [INFERRED]
  .agents/rules/graphify.md → .agents/workflows/graphify.md

## Import Cycles
- None detected.

## Communities (31 total, 14 thin omitted)

### Community 0 - "Vistas y Lógica del Mix"
Cohesion: 0.10
Nodes (8): GET(), PageProps, PageProps, StockAnalysisPage(), SalesAnalytics, SalesHistoryItem, globalForPrisma, prisma

### Community 1 - "Dependencias de Desarrollo"
Cohesion: 0.14
Nodes (15): ClientDecisionCenter(), ClientDecisionCenterProps, Message, ClientMixOptimizer(), ClientPlanningView(), ClientPlanningViewProps, PlanningItem, PageProps (+7 more)

### Community 2 - "Dependencias Principales"
Cohesion: 0.10
Nodes (21): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, prisma, tailwindcss, @tailwindcss/postcss (+13 more)

### Community 3 - "Configuración TypeScript"
Cohesion: 0.10
Nodes (21): lucide-react, @neondatabase/serverless, next, openai, dependencies, lucide-react, @neondatabase/serverless, next (+13 more)

### Community 4 - "Base de Datos y Rutas de API"
Cohesion: 0.11
Nodes (19): dom, dom.iterable, esnext, compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules (+11 more)

### Community 5 - "Finanzas y Análisis de Stock"
Cohesion: 0.15
Nodes (13): ChannelDistributionChart, ChannelDistributionChartWrapper(), ChannelDistributionChartWrapperProps, ChannelItem, ChannelSyncStatus, ChannelSyncStatusWrapper(), DashboardPage(), formatNumber() (+5 more)

### Community 6 - "Componentes del Dashboard"
Cohesion: 0.23
Nodes (13): ActionPayload, ChatMessage, executeCommercialDecision(), generateHeuristicResponse(), getAlerts(), getGoals(), getInventorySummary(), getProductDetail() (+5 more)

### Community 7 - "Copiloto AI (Chat y Herramientas)"
Cohesion: 0.17
Nodes (11): name, prisma, seed, private, scripts, build, dev, lint (+3 more)

### Community 8 - "Scripts y Metadata npm"
Cohesion: 0.22
Nodes (7): manrope, metadata, montserrat, Header(), NavItem, navItems, Sidebar()

### Community 9 - "Layout y Navegación Principal"
Cohesion: 0.20
Nodes (9): **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx, exclude (+1 more)

### Community 10 - "Archivos de Soporte TypeScript"
Cohesion: 0.31
Nodes (5): ClientMixOptimizerProps, ExtendedSkuMixItem, calculateMixMetrics(), MixCalculationResult, SkuMixItem

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
- **109 isolated node(s):** `eslintConfig`, `nextConfig`, `config`, `ChatMessage`, `tools` (+104 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `prisma` connect `Vistas y Lógica del Mix` to `Dependencias de Desarrollo`, `Finanzas y Análisis de Stock`, `Componentes del Dashboard`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Configuración TypeScript` to `Copiloto AI (Chat y Herramientas)`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Dependencias Principales` to `Copiloto AI (Chat y Herramientas)`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `config` to the rest of the system?**
  _109 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Vistas y Lógica del Mix` be split into smaller, more focused modules?**
  _Cohesion score 0.10344827586206896 - nodes in this community are weakly interconnected._
- **Should `Dependencias de Desarrollo` be split into smaller, more focused modules?**
  _Cohesion score 0.14153846153846153 - nodes in this community are weakly interconnected._
- **Should `Dependencias Principales` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._