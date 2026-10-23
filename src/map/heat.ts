// Heatmap em canvas 2D: as células da API (grade N x N sobre o minimapa, espaço 0..1)
// viram uma imagem com desfoque gaussiano e a escala heat-1..heat-5 da identidade.

export type HeatCell = { x: number; y: number; value: number };

const RESOLUTION = 512;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Tabela de 256 cores interpolando a escala, do mais frio ao mais quente. */
export function buildPalette(stops: string[]): Uint8ClampedArray {
  const rgb = stops.map(hexToRgb);
  const lut = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = (i / 255) * (rgb.length - 1);
    const k = Math.min(Math.floor(t), rgb.length - 2);
    const f = t - k;
    for (let c = 0; c < 3; c++) lut[i * 3 + c] = rgb[k]![c]! + (rgb[k + 1]![c]! - rgb[k]![c]!) * f;
  }
  return lut;
}

/**
 * Teto da escala: o percentil 98 dos valores. Com dados reais, poucas células muito quentes
 * (spawn, bomb) definiriam o máximo e deixariam o resto do mapa quase sem cor.
 */
export function robustMax(values: number[], percentile = 0.98): number {
  const sorted = values.filter((v) => v > 0).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor(percentile * (sorted.length - 1)))]!;
}

/** Intensidade 0..1 de cada célula. K/D é comparado com o maior valor, igual às outras métricas. */
export function normalize(cells: HeatCell[], maxValue?: number): Array<HeatCell & { t: number }> {
  const max = maxValue && maxValue > 0 ? maxValue : Math.max(0, ...cells.map((c) => c.value));
  if (max <= 0) return [];
  return cells.map((c) => ({ ...c, t: Math.min(1, Math.max(0, c.value / max)) }));
}

/** Desenha o heatmap numa imagem quadrada; `blur` em células (1 = uma célula de raio). */
export function renderHeat(cells: HeatCell[], grid: number, palette: Uint8ClampedArray, maxValue?: number, blur = 1.1) {
  const canvas = document.createElement("canvas");
  canvas.width = RESOLUTION;
  canvas.height = RESOLUTION;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx || grid <= 0) return canvas;

  // Uma célula = um pixel numa imagem pequena; ampliar e desfocar de uma vez só é bem mais
  // rápido do que desfocar cada célula
  const small = document.createElement("canvas");
  small.width = grid;
  small.height = grid;
  const sctx = small.getContext("2d");
  if (!sctx) return canvas;
  const cellsImg = sctx.createImageData(grid, grid);
  for (const c of normalize(cells, maxValue)) {
    if (c.x < 0 || c.y < 0 || c.x >= grid || c.y >= grid) continue;
    // A raiz realça áreas médias: sem ela, um ponto muito quente apaga o resto do mapa
    cellsImg.data[(c.y * grid + c.x) * 4 + 3] = Math.round(Math.sqrt(c.t) * 255);
  }
  sctx.putImageData(cellsImg, 0, 0);

  const step = RESOLUTION / grid;
  ctx.imageSmoothingEnabled = true;
  ctx.filter = `blur(${step * blur}px)`;
  ctx.drawImage(small, 0, 0, RESOLUTION, RESOLUTION);
  ctx.filter = "none";

  const img = ctx.getImageData(0, 0, RESOLUTION, RESOLUTION);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3]!;
    if (a < 8) {
      d[i + 3] = 0;
      continue;
    }
    d[i] = palette[a * 3]!;
    d[i + 1] = palette[a * 3 + 1]!;
    d[i + 2] = palette[a * 3 + 2]!;
    d[i + 3] = Math.min(235, 60 + a * 0.75);
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}
