export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

export const formatPercent = formatPercentage;


export function cn(...inputs: string[]) {
  return inputs.filter(Boolean).join(" ");
}
