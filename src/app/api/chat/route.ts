import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { Product, Goal, Alert } from "@/generated/prisma/client";

interface ChatMessage {
  role: string;
  content: string;
}

// Inicializar el cliente de Gemini si existe la clave
const genAI = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "")
  : null;

// Herramientas (Tools) de Gemini para interactuar con la base de datos
const functionDeclarations: any[] = [
  {
    name: "get_products_list",
    description: "Obtiene una lista de productos con filtros opcionales (decisión, clasificación, categoría). Útil para responder preguntas generales de inventario, cuáles liquidar, cuáles empujar, o listar SKUs.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        decision: { 
          type: SchemaType.STRING, 
          enum: ["EMPUJAR", "MANTENER", "LIQUIDAR", "EXCLUIR"],
          description: "Filtrar por la decisión recomendada sobre el producto."
        },
        classification: { 
          type: SchemaType.STRING, 
          enum: ["ANCLA", "ACOMPAÑANTE", "LASTRE"],
          description: "Filtrar por la clasificación del producto."
        },
        category: { 
          type: SchemaType.STRING,
          description: "Filtrar por categoría del producto (ej. Electronics)."
        }
      }
    }
  },
  {
    name: "get_product_detail",
    description: "Obtiene la información detallada de un producto específico mediante su SKU. Retorna costo, precio, stock, aging, clasificación, decisión y alertas asociadas.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        sku: { 
          type: SchemaType.STRING, 
          description: "El SKU único del producto (ej. SKU-101)." 
        }
      },
      required: ["sku"]
    }
  },
  {
    name: "get_goals",
    description: "Obtiene todas las metas y objetivos comerciales del período actual (ventas objetivo, margen objetivo) agrupados por categoría o globales.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {}
    }
  },
  {
    name: "get_alerts",
    description: "Obtiene la lista de alertas operativas críticas no resueltas (ej. quiebres de stock o sobrestock) y sus descripciones.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {}
    }
  },
  {
    name: "get_inventory_summary",
    description: "Obtiene agregados financieros del inventario completo (capital inmovilizado en costo, cobertura promedio en días, total de unidades y conteo de productos para liquidar).",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {}
    }
  },
  {
    name: "execute_commercial_decision",
    description: "Ejecuta una acción o decisión comercial real en la base de datos para un SKU específico (reponer/empujar, liquidar o excluir). Esto altera el inventario físico, crea ventas simuladas para liquidaciones y resuelve sus alertas asociadas.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        sku: {
          type: SchemaType.STRING,
          description: "El SKU del producto sobre el cual actuar (ej: SKU-101)."
        },
        decision: {
          type: SchemaType.STRING,
          enum: ["EMPUJAR", "LIQUIDAR", "EXCLUIR"],
          description: "La decisión a ejecutar: EMPUJAR (reponer stock), LIQUIDAR (rebajar stock y registrar ventas) o EXCLUIR (excluir de venta)."
        },
        quantity: {
          type: SchemaType.INTEGER,
          description: "La cantidad de unidades asociadas a la decisión (ej. cantidad a reponer o a liquidar)."
        },
        discount: {
          type: SchemaType.INTEGER,
          description: "Opcional. Si la decisión es LIQUIDAR, el porcentaje de descuento a aplicar (ej. 20)."
        }
      },
      required: ["sku", "decision", "quantity"]
    }
  },
  {
    name: "save_mix_simulation_scenario",
    description: "Guarda un escenario completo de simulación del Mix Optimizer en la base de datos SQLite. Calcula automáticamente el margen ponderado y el revenue del mix a partir de los overrides provistos.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        scenario_name: {
          type: SchemaType.STRING,
          description: "El nombre descriptivo para identificar el escenario de simulación (ej. Ajuste ROG Strix G16)."
        },
        items: {
          type: SchemaType.ARRAY,
          description: "Arreglo de productos con sus respectivos overrides. Los productos no incluidos mantendrán sus valores actuales en la base de datos.",
          items: {
            type: SchemaType.OBJECT,
            properties: {
              sku: {
                type: SchemaType.STRING,
                description: "El SKU del producto."
              },
              price: {
                type: SchemaType.NUMBER,
                description: "Opcional. El precio simulado."
              },
              cost: {
                type: SchemaType.NUMBER,
                description: "Opcional. El costo simulado."
              },
              targetUnits: {
                type: SchemaType.INTEGER,
                description: "Opcional. Las unidades estimadas de venta."
              }
            },
            required: ["sku"]
          }
        }
      },
      required: ["scenario_name", "items"]
    }
  }
];

// Resolvedores de base de datos locales para las herramientas
async function getProductsList(filters?: { decision?: string; classification?: string; category?: string }) {
  const where: { decision?: string; classification?: string; category?: string } = {};
  if (filters?.decision) where.decision = filters.decision;
  if (filters?.classification) where.classification = filters.classification;
  if (filters?.category) where.category = filters.category;
  
  return await prisma.product.findMany({
    where,
    select: {
      sku: true,
      name: true,
      brand: true,
      category: true,
      price: true,
      cost: true,
      stock: true,
      classification: true,
      decision: true,
    }
  });
}

async function getProductDetail(sku: string) {
  return await prisma.product.findUnique({
    where: { sku },
    include: {
      alerts: {
        where: { resolved: false }
      }
    }
  });
}

async function getGoals() {
  return await prisma.goal.findMany();
}

async function getAlerts() {
  return await prisma.alert.findMany({
    where: { resolved: false },
    include: {
      product: {
        select: {
          sku: true,
          name: true,
        }
      }
    }
  });
}

async function getInventorySummary() {
  const products = await prisma.product.findMany();
  let totalStockCost = 0;
  let totalStockWeightedCoverage = 0;
  let totalStockQty = 0;
  const liquidarCount = products.filter(p => p.decision === "LIQUIDAR").length;

  for (const prod of products) {
    totalStockCost += prod.stock * prod.cost;
    totalStockWeightedCoverage += prod.coverageInDays * prod.stock;
    totalStockQty += prod.stock;
  }
  const averageCoverageDays = totalStockQty > 0 ? Math.round(totalStockWeightedCoverage / totalStockQty) : 0;
  
  return {
    totalStockCost,
    averageCoverageDays,
    totalStockQty,
    liquidarCount,
  };
}

interface ActionPayload {
  type: string;
  sku?: string;
  text: string;
}

interface ScenarioItemOverride {
  sku: string;
  price?: number;
  cost?: number;
  targetUnits?: number;
}

async function executeCommercialDecision(
  sku: string,
  decision: string,
  quantity: number,
  discount?: number
): Promise<{ success: boolean; message: string; action?: ActionPayload }> {
  try {
    const product = await prisma.product.findUnique({
      where: { sku },
    });

    if (!product) {
      return { success: false, message: `Producto con SKU ${sku} no encontrado.` };
    }

    let updatedStock = product.stock;
    let newDecision = product.decision;
    let actionLogText = "";

    if (decision === "EMPUJAR") {
      updatedStock = product.stock + quantity;
      newDecision = "MANTENER";
      actionLogText = `ERP: Orden de Compra ARASY-OC-${product.sku} enviada y registrada en SAP ERP (${quantity} unidades de ${product.name}).`;
    } else if (decision === "LIQUIDAR") {
      const sellOff = Math.min(product.stock, quantity);
      updatedStock = product.stock - sellOff;
      newDecision = "MANTENER";

      if (sellOff > 0) {
        await prisma.sale.create({
          data: {
            productId: product.id,
            date: new Date(),
            quantity: sellOff,
            revenue: sellOff * product.price,
            channel: "MERCADO_LIBRE",
          },
        });
      }

      const discVal = discount !== undefined ? discount : 15;
      const discountedPrice = Math.round(product.price * (1 - discVal / 100));
      actionLogText = `Shopify/ML: Campaña de descuento (-${discVal}%) sincronizada para ${product.sku} en Shopify y Mercado Libre. Precio final: $${discountedPrice.toLocaleString("es-AR")}.`;
    } else if (decision === "EXCLUIR") {
      newDecision = "EXCLUIDO";
      actionLogText = `PRODUCTO: Exclusión de venta de catálogo del SKU ${product.sku} ejecutada.`;
    }

    const dailyVelocity = Math.max(1, Math.round(product.stock * 0.05)) / 30;
    const newCoverageDays = dailyVelocity > 0 ? updatedStock / dailyVelocity : 0;

    await prisma.product.update({
      where: { id: product.id },
      data: {
        stock: updatedStock,
        decision: newDecision,
        coverageInDays: newCoverageDays,
      },
    });

    await prisma.alert.updateMany({
      where: {
        productId: product.id,
        resolved: false,
      },
      data: {
        resolved: true,
      },
    });

    return {
      success: true,
      message: `Decisión ${decision} ejecutada sobre ${product.name} (${sku}). Stock actualizado: ${updatedStock}.`,
      action: {
        type: decision === "EMPUJAR" ? "ERP_LOG" : "SHOPIFY_ML_LOG",
        sku,
        text: actionLogText,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `Error al ejecutar decisión comercial: ${error instanceof Error ? error.message : "Desconocido"}`,
    };
  }
}

async function saveMixSimulationScenario(
  scenarioName: string,
  items: ScenarioItemOverride[]
): Promise<{ success: boolean; message: string; action?: ActionPayload }> {
  try {
    const products = await prisma.product.findMany();
    const itemsMap = new Map(items.map((it) => [it.sku, it]));
    
    let totalRevenue = 0;
    let totalCost = 0;
    
    const formattedItems = products.map((p) => {
      const override = itemsMap.get(p.sku);
      const price = override?.price !== undefined ? override.price : p.price;
      const cost = override?.cost !== undefined ? override.cost : p.cost;
      const targetUnits = override?.targetUnits !== undefined ? override.targetUnits : p.stock;
      
      totalRevenue += targetUnits * price;
      totalCost += targetUnits * cost;
      
      return {
        sku: p.sku,
        name: p.name,
        price,
        cost,
        targetUnits,
      };
    });
    
    const totalProfit = totalRevenue - totalCost;
    const weightedMargin = totalRevenue > 0 ? totalProfit / totalRevenue : 0;
    
    await prisma.mix.create({
      data: {
        name: scenarioName,
        weightedMargin,
        targetMargin: 0.35,
        totalRevenue,
        totalCost,
        itemsJson: JSON.stringify(formattedItems),
      },
    });
    
    return {
      success: true,
      message: `Escenario de simulación '${scenarioName}' guardado con éxito. Margen ponderado: ${(weightedMargin * 100).toFixed(1)}%. Revenue total: $${totalRevenue.toLocaleString("es-AR")}.`,
      action: {
        type: "MIX_SAVED_LOG",
        text: `MIX: Escenario '${scenarioName}' simulado y guardado por el Copiloto AI. Margen ponderado: ${(weightedMargin * 100).toFixed(1)}%.`,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `Error al guardar escenario de simulación: ${error instanceof Error ? error.message : "Desconocido"}`,
    };
  }
}

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    const userMessage = messages[messages.length - 1]?.content || "";
    const localActions: ActionPayload[] = [];

    // 1. Si Gemini está configurado, usarlo con Tool Calling
    if (genAI) {
      try {
        const systemPrompt = `
Eres ARASY, un copiloto de inteligencia artificial experto en Ecommerce Intelligence y optimización de rentabilidad (Retail/SaaS).
Tu objetivo es ayudar a directores comerciales y gerentes de finanzas a optimizar el mix de productos y maximizar el margen ponderado.
El lema de ARASY es "CLARIDAD PARA DECIDIR". Responde siempre de manera concisa, analítica, profesional y en ESPAÑOL.

No asumes información sobre productos, inventario, alertas o metas financieras. En su lugar, utiliza las herramientas provistas para consultar la base de datos y obtener información real y actualizada.

Instrucciones para tus respuestas:
1. Si el usuario te pregunta por liquidar, stocks obsoletos, exceso de inventario o lastres, utiliza las herramientas para obtener la lista de productos con recomendación de "LIQUIDAR" y calcula el capital inmovilizado (Costo * Stock).
2. Si te pregunta sobre qué empujar o aumentar ventas, busca los productos "ANCLA" y de reposición rápida.
3. Utiliza tablas en formato Markdown cuando sea útil para presentar datos financieros.
4. Mantén tus respuestas enfocadas en el impacto financiero y decisiones operativas concretas (Empujar, Mantener, Liquidar, Excluir).
5. Sugiere al usuario usar el "Mix Optimizer" si necesita hacer simulaciones de precios y unidades.
6. Si te piden expresamente reponer, comprar, liquidar o rebajar un SKU específico, ejecuta la acción comercial con "execute_commercial_decision" o "save_mix_simulation_scenario" de manera inmediata.
`;

        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
          systemInstruction: systemPrompt,
          tools: [{ functionDeclarations: functionDeclarations as any }],
        });

        // Convertir historial a formato Gemini ({ role: "user"|"model", parts: [{ text: string }] })
        const history: any[] = [];
        const messagesToConvert = messages.slice(0, -1);
        for (const m of messagesToConvert) {
          if (m.role === "system") continue;
          history.push({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.content }],
          });
        }

        const chat = model.startChat({ history });
        let result = await chat.sendMessage(userMessage);

        let loopLimit = 5;

        while (loopLimit > 0) {
          const calls = (result as any).response?.functionCalls ? (result as any).response.functionCalls() : undefined;
          if (!calls || calls.length === 0) {
            break;
          }
          const functionResponses: any[] = [];

          for (const call of calls) {
            const { name, args } = call;
            let callResult: any;

            try {
              if (name === "get_products_list") {
                callResult = await getProductsList(args as any);
              } else if (name === "get_product_detail") {
                callResult = await getProductDetail((args as any).sku);
              } else if (name === "get_goals") {
                callResult = await getGoals();
              } else if (name === "get_alerts") {
                callResult = await getAlerts();
              } else if (name === "get_inventory_summary") {
                callResult = await getInventorySummary();
              } else if (name === "execute_commercial_decision") {
                const res = await executeCommercialDecision((args as any).sku, (args as any).decision, (args as any).quantity, (args as any).discount);
                callResult = res;
                if (res.success && res.action) {
                  localActions.push(res.action);
                }
              } else if (name === "save_mix_simulation_scenario") {
                const res = await saveMixSimulationScenario((args as any).scenario_name, (args as any).items);
                callResult = res;
                if (res.success && res.action) {
                  localActions.push(res.action);
                }
              } else {
                callResult = { error: `Herramienta desconocida: ${name}` };
              }
            } catch (err) {
              callResult = { 
                error: `Error ejecutando herramienta: ${err instanceof Error ? err.message : "Desconocido"}` 
              };
            }

            functionResponses.push({
              functionResponse: {
                name,
                response: callResult,
              }
            });
          }

          result = await chat.sendMessage(functionResponses);
          loopLimit--;
        }

        const reply = result.response.text() || "No pude generar una respuesta.";
        return NextResponse.json({ role: "assistant", content: reply, actions: localActions });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Error desconocido";
        console.warn("Fallo al llamar a Gemini con Tool Calling, usando heuristic fallback:", errMsg);
      }
    }

    // 2. Fallback Heurístico (Motor Inteligente Local en Español)
    let reply = "";
    
    // Intentar empujar o liquidar mediante regex en el fallback para pruebas locales sin OpenAI key
    const pushRegex = /(?:reponer|comprar|reabastecer|empujar)\s+(\d+)\s+unidades?\s+(?:del\s+)?(sku-\d+)/i;
    const liquidateRegex = /(?:liquidar|descuento|rebajar|promocionar)\s+(sku-\d+)/i;

    const pushMatch = userMessage.match(pushRegex);
    const liquidateMatch = userMessage.match(liquidateRegex);

    if (pushMatch) {
      const qty = parseInt(pushMatch[1], 10);
      const sku = pushMatch[2].toUpperCase();
      const res = await executeCommercialDecision(sku, "EMPUJAR", qty);
      if (res.success && res.action) {
        reply = `¡Entendido Diego! ${res.message}\n\nHe registrado la Orden de Compra por **${qty} unidades** en el ERP y se ha reportado en el Live Data Hub.`;
        localActions.push(res.action);
      } else {
        reply = `Lo siento, no pude realizar la reposición: ${res.message}`;
      }
    } else if (liquidateMatch) {
      const sku = liquidateMatch[1].toUpperCase();
      const prod = await prisma.product.findUnique({ where: { sku } });
      if (prod) {
        const qty = prod.stock;
        const res = await executeCommercialDecision(sku, "LIQUIDAR", qty, 20);
        if (res.success && res.action) {
          reply = `¡Perfecto Diego! ${res.message}\n\nHe sincronizado la campaña de liquidación con un **20% de descuento** en Shopify y Mercado Libre. El capital inmovilizado se ha liberado.`;
          localActions.push(res.action);
        } else {
          reply = `Lo siento, no pude iniciar la liquidación: ${res.message}`;
        }
      } else {
        reply = `No encontré ningún producto con el SKU ${sku}.`;
      }
    } else {
      const products = await prisma.product.findMany({
        include: {
          alerts: true,
        },
      });
      const goals = await prisma.goal.findMany();
      reply = generateHeuristicResponse(userMessage, products, goals);
    }

    return NextResponse.json({ role: "assistant", content: reply, actions: localActions });
  } catch (error) {
    console.error("Error en API de Chat:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error en el servidor al procesar el mensaje", details: errorMessage },
      { status: 500 }
    );
  }
}

// Genera respuestas heurísticas contextuales analizando palabras clave
function generateHeuristicResponse(message: string, products: (Product & { alerts?: Alert[] })[], goals: Goal[]): string {
  const text = message.toLowerCase();

  // Filtrados por estados
  const liquidarProducts = products.filter((p) => p.decision === "LIQUIDAR");
  const anclaProducts = products.filter((p) => p.classification === "ANCLA");

  // Caso 1: Saludos
  if (text.match(/\b(hola|buenos dias|buenas tardes|saludos|que tal|info)\b/)) {
    return `¡Hola Diego! Soy **ARASY**, tu copiloto de Ecommerce Intelligence. 

Estoy listo para asistirte en el análisis de tu inventario y rentabilidad comercial. Puedes preguntarme cosas como:
- *¿Qué productos tienen exceso de stock y deberíamos liquidar?*
- *¿Cuáles son los productos ANCLA de mayor venta?*
- *¿Cómo está el margen ponderado respecto al objetivo mensual?*
- *¿Qué alertas críticas de stock tengo activas hoy?*

¿En qué módulo o métrica te gustaría enfocarte?`;
  }

  // Caso 2: Liquidación / Exceso de stock
  if (
    text.includes("liquidar") ||
    text.includes("exceso") ||
    text.includes("obsoleto") ||
    text.includes("inmovilizado") ||
    text.includes("aging") ||
    text.includes("limpiar")
  ) {
    const totalCapital = liquidarProducts.reduce((sum, p) => sum + p.stock * p.cost, 0);
    
    let table = `| SKU | Producto | Marca | Stock | Costo Unit. | Capital Inmovilizado | Aging |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |\n`;
    
    liquidarProducts.forEach((p) => {
      table += `| \`${p.sku}\` | ${p.name} | ${p.brand} | ${p.stock} | $${p.cost.toFixed(2)} | **$${(p.stock * p.cost).toLocaleString()}** | ${p.agingInDays} días |\n`;
    });

    return `He detectado **${liquidarProducts.length} productos críticos** con recomendación de **LIQUIDAR** debido a un alto nivel de envejecimiento (*aging*) o sobrestock acumulado. 

El capital total inmovilizado en costo es de **$${totalCapital.toLocaleString()} ARS**.

Aquí tienes el detalle de los SKUs que deberíamos accionar:

${table}

**Recomendaciones operativas:**
1. **Descuento comercial agresivo (40% - 60%):** Específicamente para la **Impresora HP LaserJet Pro M404** (Aging de 180 días) para liberar los **$35,100 ARS** inmovilizados.
2. **Promociones Cruzadas (Bundling):** Empaquetar el **Mouse Logitech MX Master 3S** con productos de alta rotación (como la Notebook Lenovo ThinkPad T14).
3. **Ir al [Mix Optimizer](/mix-optimizer):** Puedes simular un precio de liquidación en el optimizador para verificar el impacto en el margen global antes de activarlo.`;
  }

  // Caso 3: Productos ANCLA / Top ventas / Empujar
  if (
    text.includes("ancla") ||
    text.includes("mas vendido") ||
    text.includes("ventas") ||
    text.includes("rotacion") ||
    text.includes("empujar") ||
    text.includes("swift")
  ) {
    let table = `| SKU | Producto | Marca | Margen % | Stock actual | Clasificación | Estado |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |\n`;

    anclaProducts.forEach((p) => {
      const marginPercent = ((p.price - p.cost) / p.price) * 100;
      table += `| \`${p.sku}\` | ${p.name} | ${p.brand} | ${marginPercent.toFixed(1)}% | ${p.stock} unids | **ANCLA** | ${p.stock < 15 ? "⚠️ Stock Crítico" : "Sano"} |\n`;
    });

    return `Los **Productos ANCLA** son aquellos con alta rotación y excelente margen comercial, actuando como los motores de tu rentabilidad. Actualmente tienes **${anclaProducts.length} productos** clasificados en esta categoría:

${table}

**Acciones Críticas:**
* **Notebook Asus ROG Strix G16 (SKU-106):** Está en estado de **EMPUJAR** comercialmente pero le quedan únicamente **7 unidades** en stock. Debes emitir una orden de compra urgente para evitar un quiebre de stock que frene la facturación.
* **Router TP-Link Archer AX55 (SKU-103):** Cobertura de apenas **4.5 días**. Es nuestro producto estrella en conectividad con **58.8% de margen**. Impulsar reposición prioritaria.`;
  }

  // Caso 4: Margen / Objetivos / GAP
  if (
    text.includes("margen") ||
    text.includes("meta") ||
    text.includes("objetivo") ||
    text.includes("brecha") ||
    text.includes("gap") ||
    text.includes("facturacion")
  ) {
    const globalGoal = goals.find((g) => g.category === "Global");
    const targetRev = globalGoal?.targetRevenue || 5000000;
    const targetMarg = globalGoal?.targetMargin || 0.35;

    // Calcular métricas actuales aproximadas de la BD
    let totalRev = 0;
    let totalCost = 0;
    products.forEach((p) => {
      // Simular volumen del mes con stock * precio * factor
      const qty = Math.max(10, p.stock);
      totalRev += qty * p.price;
      totalCost += qty * p.cost;
    });
    const currentMarg = (totalRev - totalCost) / totalRev;
    const gap = Math.max(0, targetRev - totalRev);

    const currentMonthName = new Date().toLocaleDateString("es-AR", { month: "long", year: "numeric" });
    const capitalizedMonthName = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

    return `### Estado del Objetivo Mensual (${capitalizedMonthName})

* **Meta de Facturación Global:** $${targetRev.toLocaleString()} ARS
* **Proyección de Simulación:** $${totalRev.toLocaleString()} ARS
* **Brecha de Facturación (GAP):** $${gap.toLocaleString()} ARS
* **Meta de Margen Ponderado:** ${(targetMarg * 100).toFixed(1)}%
* **Margen Proyectado en Simulación:** ${(currentMarg * 100).toFixed(1)}% ${
      currentMarg >= targetMarg ? "✅ (Meta superada)" : "⚠️ (Bajo objetivo)"
    }

Para cubrir el GAP de **$${gap.toLocaleString()} ARS** y cumplir la meta de margen, te sugiero:
1. Incrementar el precio de la **Notebook Lenovo ThinkPad T14** de $950 a $990 (aporta alto volumen y es ANCLA).
2. Liquidar el sobrestock de la **Impresora HP LaserJet Pro M404** a un precio no inferior a $250 para recuperar capital sin destruir el margen promedio.
3. Simular estos escenarios en tiempo real en la herramienta de **[Mix Optimizer](/mix-optimizer)** para asegurar que el margen global ponderado no descienda del **${(targetMarg * 100).toFixed(0)}%**.`;
  }

  // Caso 5: Alertas críticas
  if (text.includes("alerta") || text.includes("riesgo") || text.includes("problema") || text.includes("quiebre")) {
    const alerts = products.flatMap((p) => p.alerts || []);
    if (alerts.length === 0) {
      return "No hay alertas críticas de negocio registradas en este momento. ¡El inventario y la rentabilidad están estables!";
    }

    let alertList = "";
    alerts.forEach((a) => {
      const icon = a.type === "QUIEBRE" ? "🚨" : a.type === "SOBRESTOCK" ? "📦" : "⏳";
      alertList += `* **${icon} Alerta de ${a.type}:** ${a.message}\n`;
    });

    return `He detectado **${alerts.length} alertas críticas** en la operación actual:

${alertList}

**Plan de mitigación sugerido:**
1. **Para QUIEBRE de SKU-106 (Notebook Asus ROG Strix G16):** Ejecutar reorden de compra automática (lead time 14 días).
2. **Para SOBRESTOCK de SKU-104 (Impresora HP LaserJet Pro M404):** Iniciar campaña de rebajas en Shopify y Mercado Libre.
3. **Para STOCK MUERTO de SKU-110 (Monitor Asus ProArt 27\"):** Ofrecer cupón de descuento del 50% exclusivo para el canal Shopify.`;
  }

  // Caso default
  return `Entendido. Estoy analizando los indicadores de ARASY para responder a tu consulta sobre: *"${message}"*.

Como tu copiloto, tengo acceso a las métricas del **catálogo de tecnología de 50 SKUs**, las **ventas acumuladas de 12 meses** y las **metas del Q2 2026**. 

Si deseas optimizar o ver un diagnóstico de SKUs específicos, te sugiero utilizar las siguientes palabras clave para que pueda darte datos numéricos exactos de la base de datos:
* **"liquidar"** o **"sobrestock"**: Para ver capital retenido en inventario lento.
* **"ancla"** o **"ventas"**: Para ver productos de alta rentabilidad y demanda.
* **"margen"** o **"objetivo"**: Para ver el progreso financiero ponderado.
* **"alertas"**: Para ver los riesgos inminentes de quiebre de stock.

¿Cuál de estos temas te gustaría profundizar ahora?`;
}
