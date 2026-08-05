import { prisma } from "../src/lib/db";

async function main() {
  console.log("Iniciando la siembra de datos de simulación de Tecnología para ARASY (50 productos)...");

  // 1. Limpiar base de datos
  await prisma.alert.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.product.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.forecast.deleteMany();
  await prisma.mix.deleteMany();
  await prisma.user.deleteMany();

  console.log("Base de datos limpia.");

  // 2. Crear usuario administrador
  const user = await prisma.user.create({
    data: {
      email: "federico@arasy.app",
      name: "Federico RM",
      role: "ADMIN",
    },
  });
  console.log(`Usuario creado: ${user.name} (${user.email})`);

  // 3. Crear Catálogo de 50 Productos (Tecnología)
  const productsData = [
    {
      sku: "SKU-101",
      name: "Notebook Lenovo ThinkPad T14",
      brand: "Lenovo",
      category: "Notebooks",
      subCategory: "Laptop Oficina",
      cost: 600.0,
      price: 1100.0,
      stock: 42,
      agingInDays: 15,
      coverageInDays: 12.0,
      classification: "ANCLA",
      decision: "MANTENER",
    },
    {
      sku: "SKU-102",
      name: "Mouse Logitech MX Master 3S",
      brand: "Logitech",
      category: "Periféricos",
      subCategory: "Mouses Wireless",
      cost: 40.0,
      price: 110.0,
      stock: 145,
      agingInDays: 125,
      coverageInDays: 90.0,
      classification: "ACOMPAÑANTE",
      decision: "LIQUIDAR",
    },
    {
      sku: "SKU-103",
      name: "Router TP-Link Archer AX55",
      brand: "TP-Link",
      category: "Conectividad",
      subCategory: "Routers Wifi 6",
      cost: 35.0,
      price: 85.0,
      stock: 12,
      agingInDays: 8,
      coverageInDays: 4.5,
      classification: "ANCLA",
      decision: "EMPUJAR",
    },
    {
      sku: "SKU-104",
      name: "Impresora HP LaserJet Pro M404",
      brand: "HP",
      category: "Impresoras",
      subCategory: "Láser Monocromática",
      cost: 180.0,
      price: 350.0,
      stock: 195,
      agingInDays: 180,
      coverageInDays: 150.0,
      classification: "LASTRE",
      decision: "LIQUIDAR",
    },
    {
      sku: "SKU-105",
      name: "Teclado Mecánico Keychron K2",
      brand: "Keychron",
      category: "Periféricos",
      subCategory: "Teclados Mecánicos",
      cost: 55.0,
      price: 120.0,
      stock: 450,
      agingInDays: 30,
      coverageInDays: 40.0,
      classification: "ACOMPAÑANTE",
      decision: "MANTENER",
    },
    {
      sku: "SKU-106",
      name: "Notebook Asus ROG Strix G16",
      brand: "Asus",
      category: "Notebooks",
      subCategory: "Laptop Gaming",
      cost: 1100.0,
      price: 1950.0,
      stock: 7,
      agingInDays: 9,
      coverageInDays: 2.0,
      classification: "ANCLA",
      decision: "EMPUJAR",
    },
    {
      sku: "SKU-107",
      name: "Servidor Dell PowerEdge T150",
      brand: "Dell",
      category: "Computadoras",
      subCategory: "Servidores Torre",
      cost: 750.0,
      price: 1450.0,
      stock: 65,
      agingInDays: 110,
      coverageInDays: 70.0,
      classification: "ACOMPAÑANTE",
      decision: "MANTENER",
    },
    {
      sku: "SKU-108",
      name: "Switch TP-Link 24p Gigabit",
      brand: "TP-Link",
      category: "Conectividad",
      subCategory: "Switches Enterprise",
      cost: 50.0,
      price: 115.0,
      stock: 35,
      agingInDays: 45,
      coverageInDays: 30.0,
      classification: "ANCLA",
      decision: "MANTENER",
    },
    {
      sku: "SKU-109",
      name: "Impresora Epson EcoTank L3250",
      brand: "Epson",
      category: "Impresoras",
      subCategory: "Sistema Continuo Color",
      cost: 110.0,
      price: 260.0,
      stock: 120,
      agingInDays: 85,
      coverageInDays: 60.0,
      classification: "ACOMPAÑANTE",
      decision: "MANTENER",
    },
    {
      sku: "SKU-110",
      name: "Monitor Asus ProArt 27\"",
      brand: "Asus",
      category: "Periféricos",
      subCategory: "Monitores Diseño",
      cost: 260.0,
      price: 490.0,
      stock: 135,
      agingInDays: 140,
      coverageInDays: 110.0,
      classification: "LASTRE",
      decision: "LIQUIDAR",
    },
    {
      sku: "SKU-111",
      name: "Notebook HP ProBook 440",
      brand: "HP",
      category: "Notebooks",
      subCategory: "Laptop Corporativa",
      cost: 420.0,
      price: 750.0,
      stock: 75,
      agingInDays: 60,
      coverageInDays: 45.0,
      classification: "ACOMPAÑANTE",
      decision: "MANTENER",
    },
    {
      sku: "SKU-112",
      name: "Auriculares Logitech G733 Wireless",
      brand: "Logitech",
      category: "Periféricos",
      subCategory: "Auriculares Gamer",
      cost: 65.0,
      price: 140.0,
      stock: 180,
      agingInDays: 40,
      coverageInDays: 35.0,
      classification: "ACOMPAÑANTE",
      decision: "MANTENER",
    },
    {
      sku: "SKU-113",
      name: "Mini PC Intel NUC 11 Pro",
      brand: "Intel",
      category: "Computadoras",
      subCategory: "Mini PCs",
      cost: 250.0,
      price: 480.0,
      stock: 15,
      agingInDays: 20,
      coverageInDays: 8.0,
      classification: "ANCLA",
      decision: "EMPUJAR",
    },
    {
      sku: "SKU-114",
      name: "Placa Red TP-Link Wifi 6 PCI-E",
      brand: "TP-Link",
      category: "Conectividad",
      subCategory: "Placas de Red",
      cost: 15.0,
      price: 38.0,
      stock: 220,
      agingInDays: 175,
      coverageInDays: 160.0,
      classification: "LASTRE",
      decision: "LIQUIDAR",
    },
    {
      sku: "SKU-115",
      name: "WebCam Logitech Brio 4K Pro",
      brand: "Logitech",
      category: "Periféricos",
      subCategory: "Cámaras Web",
      cost: 85.0,
      price: 190.0,
      stock: 90,
      agingInDays: 35,
      coverageInDays: 28.0,
      classification: "ACOMPAÑANTE",
      decision: "MANTENER",
    },
    {
      sku: "SKU-116",
      name: "PC Escritorio Lenovo Neo 50t",
      brand: "Lenovo",
      category: "Computadoras",
      subCategory: "PC Oficina",
      cost: 380.0,
      price: 680.0,
      stock: 8,
      agingInDays: 5,
      coverageInDays: 3.0,
      classification: "ANCLA",
      decision: "EMPUJAR",
    },
    {
      sku: "SKU-117",
      name: "Notebook Lenovo Yoga Slim 7",
      brand: "Lenovo",
      category: "Notebooks",
      subCategory: "Laptop Premium",
      cost: 800.0,
      price: 1400.0,
      stock: 18,
      agingInDays: 22,
      coverageInDays: 20.0,
      classification: "ACOMPAÑANTE",
      decision: "MANTENER",
    },
    {
      sku: "SKU-118",
      name: "Mouse Logitech G502 Hero",
      brand: "Logitech",
      category: "Periféricos",
      subCategory: "Mouses Gamer",
      cost: 25.0,
      price: 65.0,
      stock: 28,
      agingInDays: 15,
      coverageInDays: 18.0,
      classification: "ANCLA",
      decision: "MANTENER",
    },
    {
      sku: "SKU-119",
      name: "Router TP-Link Archer C6",
      brand: "TP-Link",
      category: "Conectividad",
      subCategory: "Routers Hogar",
      cost: 18.0,
      price: 45.0,
      stock: 160,
      agingInDays: 145,
      coverageInDays: 110.0,
      classification: "LASTRE",
      decision: "LIQUIDAR",
    },
    {
      sku: "SKU-120",
      name: "Impresora HP Ink Tank 415",
      brand: "HP",
      category: "Impresoras",
      subCategory: "Sistema Continuo",
      cost: 90.0,
      price: 210.0,
      stock: 11,
      agingInDays: 10,
      coverageInDays: 8.0,
      classification: "ANCLA",
      decision: "EMPUJAR",
    },
    {
      sku: "SKU-121",
      name: "Teclado Logitech MX Keys S",
      brand: "Logitech",
      category: "Periféricos",
      subCategory: "Teclados Premium",
      cost: 50.0,
      price: 120.0,
      stock: 65,
      agingInDays: 30,
      coverageInDays: 35.0,
      classification: "ACOMPAÑANTE",
      decision: "MANTENER",
    },
    {
      sku: "SKU-122",
      name: "Notebook Asus ZenBook Duo",
      brand: "Asus",
      category: "Notebooks",
      subCategory: "Laptop Doble Pantalla",
      cost: 1300.0,
      price: 2400.0,
      stock: 4,
      agingInDays: 12,
      coverageInDays: 5.0,
      classification: "ANCLA",
      decision: "EMPUJAR",
    },
    {
      sku: "SKU-123",
      name: "PC Escritorio Dell OptiPlex 3000",
      brand: "Dell",
      category: "Computadoras",
      subCategory: "PC Oficina",
      cost: 300.0,
      price: 550.0,
      stock: 40,
      agingInDays: 50,
      coverageInDays: 45.0,
      classification: "ACOMPAÑANTE",
      decision: "MANTENER",
    },
    {
      sku: "SKU-124",
      name: "Switch Cisco Business 110",
      brand: "Cisco",
      category: "Conectividad",
      subCategory: "Switches Enterprise",
      cost: 45.0,
      price: 95.0,
      stock: 55,
      agingInDays: 70,
      coverageInDays: 60.0,
      classification: "ACOMPAÑANTE",
      decision: "MANTENER",
    },
    {
      sku: "SKU-125",
      name: "Impresora Epson EcoTank L4260",
      brand: "Epson",
      category: "Impresoras",
      subCategory: "Sistema Continuo Color",
      cost: 160.0,
      price: 330.0,
      stock: 5,
      agingInDays: 14,
      coverageInDays: 4.0,
      classification: "ANCLA",
      decision: "EMPUJAR",
    },
    {
      sku: "SKU-126",
      name: "Monitor Samsung Odyssey G4 25\"",
      brand: "Samsung",
      category: "Periféricos",
      subCategory: "Monitores Gaming",
      cost: 150.0,
      price: 320.0,
      stock: 85,
      agingInDays: 110,
      coverageInDays: 95.0,
      classification: "ACOMPAÑANTE",
      decision: "MANTENER",
    },
    {
      sku: "SKU-127",
      name: "Notebook Lenovo IdeaPad 3",
      brand: "Lenovo",
      category: "Notebooks",
      subCategory: "Laptop Hogar",
      cost: 300.0,
      price: 520.0,
      stock: 110,
      agingInDays: 95,
      coverageInDays: 85.0,
      classification: "ACOMPAÑANTE",
      decision: "MANTENER",
    },
    {
      sku: "SKU-128",
      name: "Mouse Razer DeathAdder V2",
      brand: "Razer",
      category: "Periféricos",
      subCategory: "Mouses Gamer",
      cost: 20.0,
      price: 55.0,
      stock: 9,
      agingInDays: 11,
      coverageInDays: 8.0,
      classification: "ANCLA",
      decision: "EMPUJAR",
    },
    {
      sku: "SKU-129",
      name: "Repetidor Wifi TP-Link RE305",
      brand: "TP-Link",
      category: "Conectividad",
      subCategory: "Repetidores Wifi",
      cost: 12.0,
      price: 32.0,
      stock: 310,
      agingInDays: 130,
      coverageInDays: 100.0,
      classification: "LASTRE",
      decision: "LIQUIDAR",
    },
    {
      sku: "SKU-130",
      name: "Impresora Láser Brother HL-1212W",
      brand: "Brother",
      category: "Impresoras",
      subCategory: "Láser Monocromática",
      cost: 75.0,
      price: 160.0,
      stock: 45,
      agingInDays: 40,
      coverageInDays: 35.0,
      classification: "ACOMPAÑANTE",
      decision: "MANTENER",
    },
    {
      sku: "SKU-131",
      name: "Teclado Mecánico Razer BlackWidow",
      brand: "Razer",
      category: "Periféricos",
      subCategory: "Teclados Mecánicos",
      cost: 70.0,
      price: 160.0,
      stock: 3,
      agingInDays: 6,
      coverageInDays: 2.0,
      classification: "ANCLA",
      decision: "EMPUJAR",
    },
    {
      sku: "SKU-132",
      name: "Notebook Dell Inspiron 15",
      brand: "Dell",
      category: "Notebooks",
      subCategory: "Laptop Hogar",
      cost: 380.0,
      price: 690.0,
      stock: 50,
      agingInDays: 55,
      coverageInDays: 45.0,
      classification: "ACOMPAÑANTE",
      decision: "MANTENER",
    },
    {
      sku: "SKU-133",
      name: "Servidor Lenovo ThinkSystem ST50",
      brand: "Lenovo",
      category: "Computadoras",
      subCategory: "Servidores Torre",
      cost: 900.0,
      price: 1750.0,
      stock: 12,
      agingInDays: 85,
      coverageInDays: 65.0,
      classification: "ACOMPAÑANTE",
      decision: "MANTENER",
    },
    {
      sku: "SKU-134",
      name: "Access Point UniFi U6-Lite",
      brand: "Ubiquiti",
      category: "Conectividad",
      subCategory: "Access Points",
      cost: 60.0,
      price: 140.0,
      stock: 75,
      agingInDays: 25,
      coverageInDays: 30.0,
      classification: "ACOMPAÑANTE",
      decision: "MANTENER",
    },
    {
      sku: "SKU-135",
      name: "Impresora HP Smart Tank 515",
      brand: "HP",
      category: "Impresoras",
      subCategory: "Sistema Continuo Color",
      cost: 100.0,
      price: 230.0,
      stock: 8,
      agingInDays: 12,
      coverageInDays: 6.0,
      classification: "ANCLA",
      decision: "EMPUJAR",
    },
    {
      sku: "SKU-136",
      name: "Monitor LG UltraGear 24\"",
      brand: "LG",
      category: "Periféricos",
      subCategory: "Monitores Gaming",
      cost: 110.0,
      price: 240.0,
      stock: 215,
      agingInDays: 165,
      coverageInDays: 120.0,
      classification: "LASTRE",
      decision: "LIQUIDAR",
    },
    {
      sku: "SKU-137",
      name: "Notebook HP EliteBook 840",
      brand: "HP",
      category: "Notebooks",
      subCategory: "Laptop Corporativa",
      cost: 700.0,
      price: 1350.0,
      stock: 24,
      agingInDays: 30,
      coverageInDays: 25.0,
      classification: "ACOMPAÑANTE",
      decision: "MANTENER",
    },
    {
      sku: "SKU-138",
      name: "Auriculares Razer BlackShark V2",
      brand: "Razer",
      category: "Periféricos",
      subCategory: "Auriculares Gamer",
      cost: 45.0,
      price: 99.0,
      stock: 80,
      agingInDays: 45,
      coverageInDays: 40.0,
      classification: "ACOMPAÑANTE",
      decision: "MANTENER",
    },
    {
      sku: "SKU-139",
      name: "Router Asus RT-AX58U",
      brand: "Asus",
      category: "Conectividad",
      subCategory: "Routers Wifi 6",
      cost: 80.0,
      price: 180.0,
      stock: 6,
      agingInDays: 10,
      coverageInDays: 5.0,
      classification: "ANCLA",
      decision: "EMPUJAR",
    },
    {
      sku: "SKU-140",
      name: "Impresora Brother MFC-T920DW",
      brand: "Brother",
      category: "Impresoras",
      subCategory: "Sistema Continuo Color",
      cost: 220.0,
      price: 480.0,
      stock: 18,
      agingInDays: 50,
      coverageInDays: 40.0,
      classification: "ACOMPAÑANTE",
      decision: "MANTENER",
    },
    {
      sku: "SKU-141",
      name: "WebCam Redragon Fobos",
      brand: "Redragon",
      category: "Periféricos",
      subCategory: "Cámaras Web",
      cost: 15.0,
      price: 35.0,
      stock: 185,
      agingInDays: 140,
      coverageInDays: 110.0,
      classification: "LASTRE",
      decision: "LIQUIDAR",
    },
    {
      sku: "SKU-142",
      name: "Notebook Lenovo Legion 5",
      brand: "Lenovo",
      category: "Notebooks",
      subCategory: "Laptop Gaming",
      cost: 950.0,
      price: 1700.0,
      stock: 15,
      agingInDays: 18,
      coverageInDays: 12.0,
      classification: "ACOMPAÑANTE",
      decision: "MANTENER",
    },
    {
      sku: "SKU-143",
      name: "Mini PC Asus PN41",
      brand: "Asus",
      category: "Computadoras",
      subCategory: "Mini PCs",
      cost: 140.0,
      price: 290.0,
      stock: 22,
      agingInDays: 35,
      coverageInDays: 30.0,
      classification: "ACOMPAÑANTE",
      decision: "MANTENER",
    },
    {
      sku: "SKU-144",
      name: "Switch TP-Link 8p PoE",
      brand: "TP-Link",
      category: "Conectividad",
      subCategory: "Switches PoE",
      cost: 25.0,
      price: 60.0,
      stock: 4,
      agingInDays: 9,
      coverageInDays: 3.0,
      classification: "ANCLA",
      decision: "EMPUJAR",
    },
    {
      sku: "SKU-145",
      name: "Impresora Láser Pantum P2502W",
      brand: "Pantum",
      category: "Impresoras",
      subCategory: "Láser Monocromática",
      cost: 50.0,
      price: 110.0,
      stock: 110,
      agingInDays: 150,
      coverageInDays: 120.0,
      classification: "LASTRE",
      decision: "LIQUIDAR",
    },
    {
      sku: "SKU-146",
      name: "Pad Mouse Corsair MM300",
      brand: "Corsair",
      category: "Periféricos",
      subCategory: "Accesorios",
      cost: 8.0,
      price: 22.0,
      stock: 340,
      agingInDays: 60,
      coverageInDays: 70.0,
      classification: "ACOMPAÑANTE",
      decision: "MANTENER",
    },
    {
      sku: "SKU-147",
      name: "Notebook Apple MacBook Air M2",
      brand: "Apple",
      category: "Notebooks",
      subCategory: "Laptop Premium",
      cost: 850.0,
      price: 1550.0,
      stock: 14,
      agingInDays: 15,
      coverageInDays: 10.0,
      classification: "ACOMPAÑANTE",
      decision: "MANTENER",
    },
    {
      sku: "SKU-148",
      name: "Auriculares Corsair HS35",
      brand: "Corsair",
      category: "Periféricos",
      subCategory: "Auriculares Gamer",
      cost: 22.0,
      price: 50.0,
      stock: 95,
      agingInDays: 80,
      coverageInDays: 75.0,
      classification: "ACOMPAÑANTE",
      decision: "MANTENER",
    },
    {
      sku: "SKU-149",
      name: "Placa Red Wifi USB TP-Link",
      brand: "TP-Link",
      category: "Conectividad",
      subCategory: "Placas de Red",
      cost: 8.0,
      price: 24.0,
      stock: 3,
      agingInDays: 5,
      coverageInDays: 2.0,
      classification: "ANCLA",
      decision: "EMPUJAR",
    },
    {
      sku: "SKU-150",
      name: "Combo Logitech MK297 Wireless",
      brand: "Logitech",
      category: "Periféricos",
      subCategory: "Combos Teclado Mouse",
      cost: 15.0,
      price: 38.0,
      stock: 280,
      agingInDays: 130,
      coverageInDays: 100.0,
      classification: "LASTRE",
      decision: "LIQUIDAR",
    },
  ];

  const dbProducts = [];
  for (const prod of productsData) {
    // Escalar costo y precio a Pesos Argentinos (multiplicador x1000)
    prod.cost = prod.cost * 1000;
    prod.price = prod.price * 1000;
    const dbProd = await prisma.product.create({ data: prod });
    dbProducts.push(dbProd);
  }

  // 4. Generar Historial de Ventas de 12 Meses finalizando en el mes actual
  const channels = ["RETAIL", "SHOPIFY", "MERCADO_LIBRE"];
  const currentDate = new Date();
  const currentMonthIdx = currentDate.getMonth(); // 0 a 11
  const currentYear = currentDate.getFullYear();

  // Multiplicadores de shock mensual para alternar entre alcanzar y no alcanzar el objetivo mensual (buenos y malos meses)
  const monthShocks = [0.85, 1.15, 0.70, 1.25, 0.90, 1.35, 0.75, 1.20, 0.95, 1.10, 0.80, 1.30];

  let totalSalesCount = 0;
  for (const product of dbProducts) {
    for (let offset = -11; offset <= 0; offset++) {
      const saleDate = new Date(currentYear, currentMonthIdx + offset, 15);
      const monthVal = saleDate.getMonth();
      const mIndex = offset + 11; // index de shock (0 a 11)

      // Estacionalidad de tecnología (Agosto por Día del Niño, Noviembre por Black Friday, Diciembre por Navidad)
      let multiplier = 1.0;
      if (monthVal === 11) multiplier = 1.7; // Diciembre
      if (monthVal === 10) multiplier = 1.4; // Noviembre
      if (monthVal === 7) multiplier = 1.2;  // Agosto
      if (monthVal === 0 || monthVal === 1) multiplier = 0.8; // Enero y Febrero

      const shock = monthShocks[mIndex] || 1.0;

      for (const channel of channels) {
        // Determinar cantidad baja por canal según precio del producto para mantener totales en MILLONES
        let targetQty = 1;
        if (product.price >= 1500000) {
          targetQty = Math.random() < 0.15 ? 1 : 0;
        } else if (product.price >= 800000) {
          targetQty = Math.random() < 0.25 ? 1 : 0;
        } else if (product.price >= 400000) {
          targetQty = Math.random() < 0.4 ? 1 : 0;
        } else if (product.price >= 100000) {
          targetQty = Math.round(1 + Math.random());
        } else if (product.price >= 40000) {
          targetQty = Math.round(2 + Math.random() * 2);
        } else {
          targetQty = Math.round(5 + Math.random() * 6);
        }

        let quantity = Math.round(targetQty * multiplier * shock * (0.85 + Math.random() * 0.3));

        if (product.classification === "ANCLA" && quantity === 0) {
          quantity = 1;
        }

        const isAsusLaptop = product.sku === "SKU-106";
        const isLastMonth = offset === 0;
        const finalQty = isAsusLaptop && isLastMonth ? Math.min(1, quantity) : quantity;
        const finalRevenue = finalQty * product.price;

        if (finalQty > 0) {
          await prisma.sale.create({
            data: {
              productId: product.id,
              date: saleDate,
              quantity: finalQty,
              revenue: finalRevenue,
              channel: channel,
            },
          });
          totalSalesCount++;
        }
      }
    }
  }
  console.log(`${totalSalesCount} registros de ventas sembrados.`);

  // 5. Crear Objetivos Mensuales y Forecasts para los 15 meses (12 meses atrás a 2 meses adelante)
  const categories = ["Computadoras", "Notebooks", "Conectividad", "Impresoras", "Periféricos", "Global"];
  const periodMonths = [];
  for (let offset = -12; offset <= 2; offset++) {
    const d = new Date(currentYear, currentMonthIdx + offset, 1);
    periodMonths.push({ month: d.getMonth() + 1, year: d.getFullYear() });
  }

  for (const period of periodMonths) {
    let multiplier = 1.0;
    if (period.month === 12) multiplier = 1.7; // Diciembre
    if (period.month === 10 || period.month === 11) multiplier = 1.4; // Noviembre y Octubre
    if (period.month === 8) multiplier = 1.2;  // Agosto
    if (period.month === 1 || period.month === 2) multiplier = 0.8; // Enero y Febrero

    for (const cat of categories) {
      let targetRev = 1200000;
      let targetMarg = 0.35;

      if (cat === "Global") {
        targetRev = Math.round(60000000 * multiplier);
        targetMarg = 0.35;
      } else if (cat === "Computadoras") {
        targetRev = Math.round(9000000 * multiplier);
        targetMarg = 0.30;
      } else if (cat === "Notebooks") {
        targetRev = Math.round(22000000 * multiplier);
        targetMarg = 0.32;
      } else if (cat === "Conectividad") {
        targetRev = Math.round(7000000 * multiplier);
        targetMarg = 0.45;
      } else if (cat === "Impresoras") {
        targetRev = Math.round(10000000 * multiplier);
        targetMarg = 0.38;
      } else if (cat === "Periféricos") {
        targetRev = Math.round(12000000 * multiplier);
        targetMarg = 0.40;
      }

      await prisma.goal.create({
        data: {
          month: period.month,
          year: period.year,
          category: cat,
          targetRevenue: targetRev,
          targetMargin: targetMarg,
        },
      });

      await prisma.forecast.create({
        data: {
          month: period.month,
          year: period.year,
          category: cat,
          forecastedRevenue: Math.round(targetRev * (period.month === 7 ? 0.93 : 1.07)),
          forecastedMargin: targetMarg,
        },
      });
    }
  }
  console.log("Objetivos mensuales y Forecasts de tecnología creados para los 15 períodos.");

  // 7. Generar Alertas Críticas de Negocio
  const laptopAsus = dbProducts.find((p) => p.sku === "SKU-106");
  const printerHp = dbProducts.find((p) => p.sku === "SKU-104");
  const monitorProart = dbProducts.find((p) => p.sku === "SKU-110");

  if (laptopAsus) {
    await prisma.alert.create({
      data: {
        type: "QUIEBRE",
        message: "Riesgo de quiebre inminente en Notebook Asus ROG Strix G16 (SKU-106). Stock actual: 7 unidades. Lead time: 14 días para reposición.",
        productId: laptopAsus.id,
      },
    });
  }

  if (printerHp) {
    await prisma.alert.create({
      data: {
        type: "SOBRESTOCK",
        message: `Exceso de stock detectado en Impresora HP LaserJet Pro M404 (SKU-104). Aging: 180 días. Capital inmovilizado estimado: $ ${(195 * printerHp.cost).toLocaleString("es-AR")} ARS.`,
        productId: printerHp.id,
      },
    });
  }

  if (monitorProart) {
    await prisma.alert.create({
      data: {
        type: "STOCK_MUERTO",
        message: "Alerta de stock muerto en Monitor Asus ProArt 27\" (SKU-110). No se registran ventas en los últimos 60 días para este SKU. Stock acumulado: 135 unidades.",
        productId: monitorProart.id,
      },
    });
  }
  console.log("Alertas de stock de tecnología creadas.");

  console.log("¡Siembra de datos de tecnología (50 productos) completada con éxito!");
}

main()
  .catch((e) => {
    console.error("Error sembrando datos:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
