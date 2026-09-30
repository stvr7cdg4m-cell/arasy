# Graph Report - Arasy  (2026-09-30)

## Corpus Check
- 56 files · ~35,200 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 269 nodes · 323 edges · 36 communities (19 shown, 17 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cc696f69`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- db.ts
- formatCurrency
- devDependencies
- dependencies
- Base de Datos y Rutas de API
- dashboard/page.tsx
- chat/route.ts
- Copiloto AI (Chat y Herramientas)
- (demo)/layout.tsx
- Layout y Navegación Principal
- ClientMixOptimizer.tsx
- Documentación y Changelog
- auth.ts
- ChannelDistributionChart.tsx
- PerformanceChart.tsx
- ClientIntegrations.tsx
- Instrucciones de Graphify
- Configuración de ESLint
- Configuración de Next.js
- Configuración de PostCSS
- app/page.tsx
- Reglas de Next.js para Agentes
- Icono de Archivo SVG
- Icono de Globo SVG
- Logo Negativo SVG
- Logo Positivo SVG
- Logo de Next.js SVG
- Logo de Vercel SVG
- Icono de Ventana SVG
- Documentación Readme
- app/layout.tsx
- ChannelSyncStatus.tsx
- middleware.ts

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `prisma` - 14 edges
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
- `ClientMixOptimizer()` --calls--> `formatCurrency()`  [EXTRACTED]
  src/app/(demo)/mix-optimizer/ClientMixOptimizer.tsx → src/lib/utils.ts
- `ClientMixOptimizer()` --calls--> `formatPercent`  [EXTRACTED]
  src/app/(demo)/mix-optimizer/ClientMixOptimizer.tsx → src/lib/utils.ts
- `PlanningPage()` --calls--> `formatCurrency()`  [EXTRACTED]
  src/app/(demo)/planning/page.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (36 total, 17 thin omitted)

### Community 1 - "formatCurrency"
Cohesion: 0.11
Nodes (19): GET(), ClientDecisionCenter(), ClientDecisionCenterProps, Message, ClientPlanningView(), ClientPlanningViewProps, PlanningItem, PageProps (+11 more)

### Community 2 - "devDependencies"
Cohesion: 0.09
Nodes (23): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, prisma, tailwindcss, @tailwindcss/postcss (+15 more)

### Community 3 - "dependencies"
Cohesion: 0.09
Nodes (23): @google/generative-ai, lucide-react, @neondatabase/serverless, next, openai, dependencies, @google/generative-ai, lucide-react (+15 more)

### Community 4 - "Base de Datos y Rutas de API"
Cohesion: 0.11
Nodes (19): dom, dom.iterable, esnext, compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules (+11 more)

### Community 5 - "dashboard/page.tsx"
Cohesion: 0.15
Nodes (13): ChannelDistributionChart, ChannelDistributionChartWrapper(), ChannelDistributionChartWrapperProps, ChannelItem, ChannelSyncStatus, ChannelSyncStatusWrapper(), DashboardPage(), formatNumber() (+5 more)

### Community 6 - "chat/route.ts"
Cohesion: 0.23
Nodes (13): ActionPayload, ChatMessage, executeCommercialDecision(), functionDeclarations, generateHeuristicResponse(), getAlerts(), getGoals(), getInventorySummary() (+5 more)

### Community 7 - "Copiloto AI (Chat y Herramientas)"
Cohesion: 0.17
Nodes (11): name, prisma, seed, private, scripts, build, dev, lint (+3 more)

### Community 8 - "(demo)/layout.tsx"
Cohesion: 0.27
Nodes (5): LiveDemoBanner(), Header(), NavItem, navItems, Sidebar()

### Community 9 - "Layout y Navegación Principal"
Cohesion: 0.20
Nodes (9): **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx, exclude (+1 more)

### Community 10 - "ClientMixOptimizer.tsx"
Cohesion: 0.22
Nodes (7): ClientMixOptimizer(), ClientMixOptimizerProps, ExtendedSkuMixItem, PageProps, calculateMixMetrics(), MixCalculationResult, SkuMixItem

### Community 11 - "Documentación y Changelog"
Cohesion: 0.29
Nodes (8): Historial de Cambios Arasy, Versión 0.1.0, Versión 0.2.0, Versión 0.3.0, Guía de Desarrollo Arasy, Fase 1: Estabilización Técnica, Fase 2: Conexión de Datos Activa, Fase 3: Inteligencia & Visualización

### Community 12 - "auth.ts"
Cohesion: 0.39
Nodes (4): POST(), POST(), createSession(), deleteSession()

### Community 13 - "ChannelDistributionChart.tsx"
Cohesion: 0.33
Nodes (3): ChannelDistributionChartProps, ChannelItem, CustomTooltipProps

### Community 14 - "PerformanceChart.tsx"
Cohesion: 0.33
Nodes (3): CustomTooltipProps, MonthlyDataItem, PerformanceChartProps

### Community 15 - "ClientIntegrations.tsx"
Cohesion: 0.40
Nodes (3): ClientIntegrations(), IntegrationState, LogEntry

### Community 31 - "app/layout.tsx"
Cohesion: 0.40
Nodes (3): manrope, metadata, montserrat

## Knowledge Gaps
- **112 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+107 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `prisma` connect `db.ts` to `formatCurrency`, `ClientMixOptimizer.tsx`, `dashboard/page.tsx`, `chat/route.ts`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `Copiloto AI (Chat y Herramientas)`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `Copiloto AI (Chat y Herramientas)`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _112 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `formatCurrency` be split into smaller, more focused modules?**
  _Cohesion score 0.10510510510510511 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._