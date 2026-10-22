import agentsJson from "./data/agents.json";
import mapsJson from "./data/maps.json";
import { ABILITY_SHAPES, type AbilityShape } from "./abilityShapes";

export type Point = { x: number; y: number };
export type Rotation = 0 | 90 | 180 | 270;

const ASSETS = "/assets-valorant/";
export const assetUrl = (path: string) => ASSETS + path;

export type CalloutKind = "site" | "spawn" | "region";
export type Callout = Point & { kind: CalloutKind; label: string; side?: "attack" | "defense" };

export type MapInfo = {
  id: string;
  slug: string;
  name: string;
  minimap: string;
  banner: string;
  /** Quantos "minimapas" equivale 1 metro do jogo. */
  metersToMinimap: number;
  callouts: Callout[];
  /** Rotação que deixa o spawn de ataque embaixo e o de defesa em cima. */
  attackDownRotation: Rotation;
};

export type AbilityInfo = {
  id: string;
  key: string;
  name: string;
  icon: string;
  shape: AbilityShape | null;
};

export type AgentInfo = {
  id: string;
  name: string;
  role: string;
  icon: string;
  abilities: AbilityInfo[];
};

const SITES = ["A", "B", "C"];

// Callouts ficam em inglês de propósito: é como os jogadores chamam as posições na comunicação
function toCallout(c: { region: string; name: string; x: number; y: number }): Callout {
  const { region, name, x, y } = c;
  if (SITES.includes(region) && name === "Site") return { kind: "site", label: region, x, y };
  if (name === "Spawn" && region === "Attacker Side") return { kind: "spawn", side: "attack", label: "Ataque", x, y };
  if (name === "Spawn" && region === "Defender Side") return { kind: "spawn", side: "defense", label: "Defesa", x, y };
  const prefix = SITES.includes(region) || region === "Mid" ? `${region} ` : "";
  return { kind: "region", label: `${prefix}${name}`, x, y };
}

export function attackDownRotation(callouts: Callout[]): Rotation {
  const attack = callouts.find((c) => c.side === "attack");
  const defense = callouts.find((c) => c.side === "defense");
  if (!attack || !defense) return 0;
  const angle = (Math.atan2(attack.y - defense.y, attack.x - defense.x) * 180) / Math.PI;
  // Girar no sentido horário; apontar "para baixo" na tela é 90 graus
  return ((((Math.round((90 - angle) / 90) * 90) % 360) + 360) % 360) as Rotation;
}

export const MAPS: MapInfo[] = mapsJson
  .map((m) => {
    const callouts = m.callouts.map(toCallout);
    return { ...m, callouts, attackDownRotation: attackDownRotation(callouts) };
  })
  .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

const ROLE_ORDER = ["Duelista", "Iniciador", "Controlador", "Sentinela"];

export const AGENTS: AgentInfo[] = agentsJson
  .map((a) => ({
    id: a.id,
    name: a.name,
    role: a.role,
    icon: a.icon,
    abilities: a.abilities.map((h) => {
      const id = `${a.id}-${h.slot}`;
      return { id, key: h.key, name: h.name, icon: h.icon, shape: ABILITY_SHAPES[id] ?? null };
    }),
  }))
  .sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) || a.name.localeCompare(b.name, "pt-BR"));

export const ROLES = ROLE_ORDER;

const agentById = new Map(AGENTS.map((a) => [a.id, a]));
const abilityById = new Map(AGENTS.flatMap((a) => a.abilities.map((h) => [h.id, { ability: h, agent: a }] as const)));
const mapById = new Map(MAPS.map((m) => [m.id, m]));

export const findAgent = (id: string) => agentById.get(id);
export const findAbility = (id: string) => abilityById.get(id);
export const findMap = (id: string) => mapById.get(id);

export const DEFAULT_MAP = MAPS.find((m) => m.slug === "ascent") ?? MAPS[0]!;
