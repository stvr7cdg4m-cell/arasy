/**
 * Business Logic: Financials
 * Contiene utilidades de cálculo financiero, comisiones de canales de venta (como Mercado Libre) y márgenes.
 */

export class Financials {
  // Comisión típica de Mercado Libre (14.5%)
  public static readonly MERCADO_LIBRE_COMMISSION_RATE = 0.145;

  /**
   * Calcula el costo de comisión de un canal para un producto.
   * @param price Precio de venta del producto
   * @param channel Canal de venta (RETAIL, SHOPIFY, MERCADO_LIBRE)
   */
  public static getChannelCommission(price: number, channel: string): number {
    if (channel === "MERCADO_LIBRE") {
      return price * this.MERCADO_LIBRE_COMMISSION_RATE;
    }
    // Shopify u otros canales pueden tener otras comisiones menores (por ejemplo, 2.5% de pasarela de pago)
    if (channel === "SHOPIFY") {
      return price * 0.025;
    }
    return 0; // Retail físico
  }

  /**
   * Calcula el margen neto absoluto y porcentual después de costos y comisiones de canales.
   * @param price Precio de venta
   * @param cost Costo unitario
   * @param channel Canal de venta
   */
  public static calculateNetMargin(
    price: number,
    cost: number,
    channel: string = "MERCADO_LIBRE"
  ): { netProfit: number; marginPercent: number } {
    const commission = this.getChannelCommission(price, channel);
    // Margen Neto = Precio - Costo - Comisiones de Venta
    const netProfit = price - cost - commission;
    const marginPercent = price > 0 ? netProfit / price : 0;

    return {
      netProfit,
      marginPercent,
    };
  }

  /**
   * Calcula el margen bruto tradicional.
   */
  public static calculateGrossMargin(price: number, cost: number): { grossProfit: number; marginPercent: number } {
    const grossProfit = price - cost;
    const marginPercent = price > 0 ? grossProfit / price : 0;

    return {
      grossProfit,
      marginPercent,
    };
  }
}
