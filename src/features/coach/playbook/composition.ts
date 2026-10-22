import { findAgent, ROLES, type AgentInfo } from "../../../map/mapData";
import type { PlaybookItem, Side } from "./types";

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
