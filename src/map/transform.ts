import type { Point, Rotation } from "./mapData";

/** Vista do mapa: zoom e deslocamento do conteúdo, em pixels da tela. */
export type View = { zoom: number; x: number; y: number };

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;
export const IDENTITY_VIEW: View = { zoom: 1, x: 0, y: 0 };

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Mantém o mapa cobrindo a área visível: nada de espaço vazio nas bordas. */
export function clampView({ zoom, x, y }: View, size: number): View {
  const z = clamp(zoom, MIN_ZOOM, MAX_ZOOM);
  const min = size - size * z;
  return { zoom: z, x: clamp(x, min, 0), y: clamp(y, min, 0) };
}

/** Zoom mantendo fixo o ponto da tela sob o cursor. */
export function zoomAt(view: View, screen: Point, nextZoom: number, size: number): View {
  const z = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
  const contentX = (screen.x - view.x) / view.zoom;
  const contentY = (screen.y - view.y) / view.zoom;
  return clampView({ zoom: z, x: screen.x - contentX * z, y: screen.y - contentY * z }, size);
}

/** Gira um ponto normalizado (0..1) em torno do centro, no sentido horário. */
export function rotatePoint({ x, y }: Point, degrees: number): Point {
  const rad = (degrees * Math.PI) / 180;
  const dx = x - 0.5;
  const dy = y - 0.5;
  const cos = Math.round(Math.cos(rad) * 1e12) / 1e12;
  const sin = Math.round(Math.sin(rad) * 1e12) / 1e12;
  return { x: 0.5 + dx * cos - dy * sin, y: 0.5 + dx * sin + dy * cos };
}

/** Ponto do mapa (0..1, sem rotação) para pixels da tela. */
export function mapToScreen(p: Point, rotation: Rotation, view: View, size: number): Point {
  const r = rotatePoint(p, rotation);
  return { x: view.x + r.x * size * view.zoom, y: view.y + r.y * size * view.zoom };
}

/** Pixels da tela para ponto do mapa (0..1, sem rotação). Inverso de mapToScreen. */
export function screenToMap(s: Point, rotation: Rotation, view: View, size: number): Point {
  const r = { x: (s.x - view.x) / (size * view.zoom), y: (s.y - view.y) / (size * view.zoom) };
  return rotatePoint(r, -rotation);
}

export const nextRotation = (r: Rotation): Rotation => ((r + 90) % 360) as Rotation;
