# Graph Report - Arasy  (2026-10-27)

## Corpus Check
- 70 files · ~44,809 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 334 nodes · 433 edges · 36 communities (20 shown, 16 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f0dd0a48`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- db.ts
- formatCurrency
- devDependencies
- dependencies
- compilerOptions
- dashboard/page.tsx
- chat/route.ts
- Copiloto AI (Chat y Herramientas)
- (demo)/layout.tsx
- mercadolibre.ts
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
- ClientMarketRadar.tsx

## God Nodes (most connected - your core abstractions)
1. `prisma` - 19 edges
2. `compilerOptions` - 16 edges
3. `formatCurrency()` - 11 edges
4. `getValidAccessToken()` - 10 edges
5. `POST()` - 9 edges
6. `Financials` - 8 edges
7. `syncMercadoLibreCatalogAndSales()` - 8 edges
8. `formatPercent` - 7 edges
9. `include` - 7 edges
10. `scripts` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Fase 1: Estabilización Técnica` --conceptually_related_to--> `Versión 0.3.0`  [INFERRED]
  CLAUDE.md → CHANGELOG.md
- `Fase 2: Conexión de Datos Activa` --conceptually_related_to--> `Versión 0.3.0`  [INFERRED]
  CLAUDE.md → CHANGELOG.md
- `PlanningPage()` --calls--> `formatCurrency()`  [EXTRACTED]
  src/app/(demo)/planning/page.tsx → src/lib/utils.ts
- `GET()` --calls--> `getValidAccessToken()`  [EXTRACTED]
  src/app/api/integrations/mercadolibre/status/route.ts → src/lib/mercadolibre.ts
- `POST()` --calls--> `syncMercadoLibreCatalogAndSales()`  [EXTRACTED]
  src/app/api/integrations/mercadolibre/sync/route.ts → src/lib/mercadolibre.ts

## Import Cycles
- None detected.

## Communities (36 total, 16 thin omitted)

### Community 0 - "db.ts"
Cohesion: 0.09
Nodes (8): GET(), PageProps, StockAnalysisPage(), Financials, SalesAnalytics, SalesHistoryItem, globalForPrisma, prisma

### Community 1 - "formatCurrency"
Cohesion: 0.10
Nodes (20): ClientDecisionCenter(), ClientDecisionCenterProps, Message, ClientMixOptimizer(), ClientMixOptimizerProps, ExtendedSkuMixItem, PageProps, ClientPlanningView() (+12 more)

### Community 2 - "devDependencies"
Cohesion: 0.09
Nodes (23): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, prisma, tailwindcss, @tailwindcss/postcss (+15 more)

### Community 3 - "dependencies"
Cohesion: 0.08
Nodes (25): @google/generative-ai, lucide-react, @neondatabase/serverless, next, openai, dependencies, @google/generative-ai, lucide-react (+17 more)

### Community 4 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

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

### Community 9 - "mercadolibre.ts"
Cohesion: 0.08
Nodes (35): GET(), GET(), POST(), GET(), POST(), GET(), GET(), GET() (+27 more)

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
Cohesion: 0.33
Nodes (4): ClientIntegrations(), IntegrationState, LogEntry, MeliAccountState

### Community 31 - "app/layout.tsx"
Cohesion: 0.40
Nodes (3): manrope, metadata, montserrat

### Community 36 - "ClientMarketRadar.tsx"
Cohesion: 0.22
Nodes (8): CatalogProduct, CategoryBasic, CategoryDetail, ClientMarketRadar(), InspectedItem, TrendItem, WatchlistItem, metadata

## Knowledge Gaps
- **127 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+122 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `prisma` connect `db.ts` to `mercadolibre.ts`, `dashboard/page.tsx`, `chat/route.ts`, `formatCurrency`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `Copiloto AI (Chat y Herramientas)`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `Copiloto AI (Chat y Herramientas)`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _127 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `db.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08534850640113797 - nodes in this community are weakly interconnected._
- **Should `formatCurrency` be split into smaller, more focused modules?**
  _Cohesion score 0.09747899159663866 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._