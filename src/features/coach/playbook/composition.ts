import { findAgent, ROLES, type AgentInfo } from "../../../map/mapData";
import type { AgentItem, Phase, PlaybookItem, Side } from "./types";

export const MAX_PER_SIDE = 5;

/** O que o time perde sem cada função, para o aviso de composição. */
export const ROLE_GAPS: Record<string, string> = {
  Duelista: "ninguém para abrir o bomb",
  Iniciador: "sem informação nem flash para entrar",
  Controlador: "sem smokes para cortar visão",
  Sentinela: "ninguém segurando o flanco",
};

export type Team = {
  side: Side;
  agents: AgentInfo[];
  roleCounts: Record<string, number>;
  missingRoles: string[];
};

/** Agentes distintos de cada lado. O mesmo agente em várias fases conta uma vez. */
export function teamOf(items: PlaybookItem[], side: Side): Team {
  const ids = [...new Set(items.flatMap((i) => (i.kind === "agent" && i.side === side ? [i.agentId] : [])))];
  const agents = ids.map(findAgent).filter((a): a is AgentInfo => a != null);
  const roleCounts = Object.fromEntries(ROLES.map((r) => [r, agents.filter((a) => a.role === r).length]));
  return { side, agents, roleCounts, missingRoles: agents.length ? ROLES.filter((r) => roleCounts[r] === 0) : [] };
}

/** Dá para pôr este agente neste lado? Quem já está no time pode aparecer em outras fases. */
export function canJoin(items: PlaybookItem[], agentId: string, side: Side): boolean {
  const team = teamOf(items, side);
  return team.agents.some((a) => a.id === agentId) || team.agents.length < MAX_PER_SIDE;
}

/** O marcador deste agente neste lado e fase, se já existir. */
export function findPlaced(items: PlaybookItem[], agentId: string, side: Side, phase: Phase): AgentItem | undefined {
  return items.find((i): i is AgentItem => i.kind === "agent" && i.agentId === agentId && i.side === side && i.phase === phase);
}

export type PlaceCheck = { ok: true } | { ok: false; reason: "placed"; existing: AgentItem } | { ok: false; reason: "full" };

/**
 * Regras de colocação: em cada fase o agente aparece no máximo uma vez por lado (ou seja,
 * no máximo duas vezes: uma no ataque e uma na defesa), e cada time tem até cinco agentes.
 * `ignoreId` permite checar a troca de lado de um marcador que já existe.
 */
export function checkPlacement(
  items: PlaybookItem[],
  agentId: string,
  side: Side,
  phase: Phase,
  ignoreId?: string,
): PlaceCheck {
  const others = ignoreId ? items.filter((i) => i.id !== ignoreId) : items;
  const existing = findPlaced(others, agentId, side, phase);
  if (existing) return { ok: false, reason: "placed", existing };
  if (!canJoin(others, agentId, side)) return { ok: false, reason: "full" };
  return { ok: true };
}
