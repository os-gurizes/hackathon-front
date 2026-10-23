import type { MatchRounds, RoundReplay } from "../../../api";

export type ReplayEvent = RoundReplay["events"][number];
export type KillEvent = Extract<ReplayEvent, { type: "kill" }>;
export type Position = KillEvent["positions"][number];
export type ReplayPlayer = RoundReplay["players"][number];
export type Round = MatchRounds[number];

export const isKill = (e: ReplayEvent): e is KillEvent => e.type === "kill";

/** Relógio do round, como no jogo: 1:05. */
export function clock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const RESULT: Record<string, string> = {
  Elimination: "Eliminação",
  Defuse: "Desarme",
  Detonate: "Spike detonada",
  Surrendered: "Rendição",
};

/** Como o round terminou. O resultado vazio no dataset é tempo esgotado: vitória da defesa. */
export const resultLabel = (code: string | null | undefined) => (code ? (RESULT[code] ?? code) : "Tempo esgotado");

/**
 * Posições a desenhar no passo `index`: o jogo só registra onde cada um estava nos abates,
 * então vale o último abate até ali. Antes do primeiro, ninguém aparece.
 */
export function snapshotAt(events: ReplayEvent[], index: number): Position[] {
  for (let i = Math.min(index, events.length - 1); i >= 0; i--) {
    const e = events[i]!;
    if (isKill(e)) return e.positions;
  }
  return [];
}

/** Quem já morreu até o passo `index` (inclusive), com o lugar da morte. */
export function deathsUntil(events: ReplayEvent[], index: number): Array<{ playerId: number; at: { x: number; y: number } }> {
  return events
    .slice(0, index + 1)
    .filter(isKill)
    .flatMap((e) => (e.victimAt ? [{ playerId: e.victimId, at: e.victimAt }] : []));
}

/** Onde está a spike no passo `index`, se já foi plantada. */
export function spikeAt(events: ReplayEvent[], index: number): { x: number; y: number } | null {
  const plant = events.slice(0, index + 1).find((e) => e.type === "plant");
  return plant && plant.type !== "kill" ? plant.at : null;
}

const nome = (players: ReplayPlayer[], id: number | null) => {
  const p = players.find((x) => x.player.id === id);
  return p ? `${p.player.gameName} (${p.agent.name})` : "Alguém";
};

/** Linha do feed de eventos, em português corrido. */
export function describe(e: ReplayEvent, players: ReplayPlayer[]): string {
  if (isKill(e)) {
    const extra = [e.isFirstKill ? "primeiro abate" : null, e.isTrade ? "trade" : null, e.kind === "team" ? "fogo amigo" : null]
      .filter(Boolean)
      .join(", ");
    const quem = e.kind === "self" || e.killerId == null ? `${nome(players, e.victimId)} morreu` : `${nome(players, e.killerId)} abateu ${nome(players, e.victimId)}`;
    return extra ? `${quem}: ${extra}` : quem;
  }
  const site = e.site ? ` no ${e.site}` : "";
  return e.type === "plant" ? `${nome(players, e.playerId)} plantou a spike${site}` : `${nome(players, e.playerId)} desarmou a spike${site}`;
}

/** Chance de vitória do time ao longo do round (a API dá a do ataque). */
export function teamWinCurve(round: Round, teamId: number): Array<{ tMs: number; p: number; event: string }> {
  const attacking = round.attackTeamId === teamId;
  return round.winProbability.map((w) => ({ tMs: w.tMs, event: w.event, p: attacking ? w.attack : 1 - w.attack }));
}
