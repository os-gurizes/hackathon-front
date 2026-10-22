import type { IconName } from "../../../design/primitives";
import type { Point } from "../../../map/mapData";
import type { Phase } from "../playbook/types";

export type Tool = "select" | "pen" | "arrow" | "area" | "agent" | "ability" | "text" | "eraser";

export const TOOLS: { id: Tool; label: string; icon: IconName }[] = [
  { id: "select", label: "Selecionar e mover", icon: "select" },
  { id: "pen", label: "Caneta livre", icon: "pencil" },
  { id: "arrow", label: "Seta", icon: "arrow" },
  { id: "area", label: "Área", icon: "zone" },
  { id: "agent", label: "Marcador de agente", icon: "player" },
  { id: "ability", label: "Habilidade", icon: "target" },
  { id: "text", label: "Texto", icon: "text" },
  { id: "eraser", label: "Borracha", icon: "eraser" },
];

export const PHASE_INFO: Record<Phase, { name: string; cssVar: string }> = {
  setup: { name: "Setup", cssVar: "--bone-muted" },
  exec: { name: "Execução", cssVar: "--signal" },
  post: { name: "Pós-plant", cssVar: "--gold" },
  retake: { name: "Retake", cssVar: "--cyan" },
};

/** Octógono, a forma de área da identidade, com centro e raio no espaço 0..1. */
export function octagon(c: Point, r: number): Point[] {
  const k = r * 0.41;
  return [
    { x: c.x - k, y: c.y - r },
    { x: c.x + k, y: c.y - r },
    { x: c.x + r, y: c.y - k },
    { x: c.x + r, y: c.y + k },
    { x: c.x + k, y: c.y + r },
    { x: c.x - k, y: c.y + r },
    { x: c.x - r, y: c.y + k },
    { x: c.x - r, y: c.y - k },
  ];
}

export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/** Limita casas decimais para o JSON da estratégia ficar enxuto. */
export const roundPoint = (p: Point): Point => ({ x: Math.round(p.x * 10000) / 10000, y: Math.round(p.y * 10000) / 10000 });
