// Formatação compartilhada pelas abas do player: números em pt-BR e comparações com a média.

export const fmt = (n: number, digits = 0) => n.toLocaleString("pt-BR", { maximumFractionDigits: digits, minimumFractionDigits: digits });
export const pct = (rate: number, digits = 0) => `${fmt(rate * 100, digits)}%`;

/** Diferença entre duas taxas em pontos percentuais, com sinal: "+4,6 p.p.". */
export function pp(rate: number, base: number, digits = 1): string {
  const d = (rate - base) * 100;
  return `${d > 0 ? "+" : ""}${fmt(d, digits)} p.p.`;
}

/** Diferença simples com sinal: "+0,26". */
export function diff(value: number, base: number, digits = 2): string {
  const d = value - base;
  return `${d > 0 ? "+" : ""}${fmt(d, digits)}`;
}

/** Tom da comparação para o Stat: perto da média fica neutro. */
export function tone(value: number, base: number, tolerance: number, higherIsBetter = true): "up" | "down" | "neutral" {
  const d = value - base;
  if (Math.abs(d) < tolerance) return "neutral";
  return d > 0 === higherIsBetter ? "up" : "down";
}

export const MIN_MATCHES = 5;
