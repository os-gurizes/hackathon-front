import { useMemo } from "react";
import { Image as KImage } from "react-konva";
import { buildPalette, renderHeat, robustMax, type HeatCell } from "./heat";
import type { Tokens } from "./useTokens";

type Props = {
  cells: HeatCell[];
  grid: number;
  maxValue?: number;
  size: number;
  tokens: Tokens;
  opacity?: number;
};

/** Heatmap dentro do MapCanvas: acompanha zoom, pan e rotação do mapa. */
export function HeatLayer({ cells, grid, maxValue, size, tokens, opacity = 1 }: Props) {
  const palette = useMemo(
    () => buildPalette([tokens.heat1, tokens.heat2, tokens.heat3, tokens.heat4, tokens.heat5]),
    [tokens],
  );
  const image = useMemo(
    () => renderHeat(cells, grid, palette, Math.min(maxValue ?? Infinity, robustMax(cells.map((c) => c.value)))),
    [cells, grid, palette, maxValue],
  );
  return <KImage image={image} width={size} height={size} opacity={opacity} listening={false} />;
}
