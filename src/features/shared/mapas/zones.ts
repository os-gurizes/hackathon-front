import type { Heatmap, HeatmapQuery } from "../../../api";

export type Metric = HeatmapQuery["metric"] & string;
export type Zone = Heatmap["zones"][number];

export const MIN_ZONE_SAMPLE = 8;
const fmt = (n: number, digits = 0) => n.toLocaleString("pt-BR", { maximumFractionDigits: digits, minimumFractionDigits: digits });

/**
 * Comparação de cada zona com o mesmo local no campeonato inteiro (spec: todo número com
 * comparação). Para contagens, compara a fatia do total que cai na zona; para K/D, a diferença.
 */
export function compareZone(metric: Metric, zone: Zone, mine: Zone[], all: Zone[]): { text: string; tone: "up" | "down" | "even" } | null {
  const base = all.find((z) => z.zoneId === zone.zoneId);
  if (!base || base.sampleSize < MIN_ZONE_SAMPLE || zone.sampleSize < MIN_ZONE_SAMPLE) return null;
  if (metric === "kd") {
    const diff = zone.value - base.value;
    if (Math.abs(diff) < 0.05) return { text: "na média", tone: "even" };
    return { text: `${diff > 0 ? "+" : ""}${fmt(diff, 2)} vs. média`, tone: diff > 0 ? "up" : "down" };
  }
  const sum = (zs: Zone[]) => zs.reduce((s, z) => s + z.value, 0);
  const share = zone.value / Math.max(sum(mine), 1e-9);
  const baseShare = base.value / Math.max(sum(all), 1e-9);
  if (baseShare <= 0) return null;
  const ratio = share / baseShare;
  if (Math.abs(ratio - 1) < 0.1) return { text: "na média", tone: "even" };
  return { text: `${fmt(ratio, 1)}x a média`, tone: ratio > 1 ? "up" : "down" };
}
