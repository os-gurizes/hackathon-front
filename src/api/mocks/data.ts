// Dados de exemplo para desenvolver sem a API. Nomes de time e jogadores são fictícios.
// Os tipos vêm do openapi.json: se o contrato mudar, o TypeScript aponta o que atualizar aqui.
import type {
  AdminUser,
  ApiAgent,
  Heatmap,
  Insight,
  MapStats,
  MatchList,
  MatchRounds,
  RoundReplay,
  MapSummary,
  Me,
  PlayerMatches,
  PlayerProfile,
  PlayerStats,
  TeamDetail,
  TeamEconomy,
  TeamSummary,
} from "../types";

type Ref = { id: number; slug: string; name: string };

export const MAPS: Ref[] = ["Abyss", "Ascent", "Breeze", "Fracture", "Haven", "Lotus", "Pearl", "Split", "Summit", "Sunset"].map(
  (name, i) => ({ id: i + 1, slug: name.toLowerCase(), name }),
);
const map = (slug: string) => MAPS.find((m) => m.slug === slug)!;

export const TEAM = { id: 7, slug: "corvos_do_campus", displayName: "Corvos do Campus" };
const OPPONENTS = [
  { id: 12, slug: "lobos_da_federal", displayName: "Lobos da Federal" },
  { id: 15, slug: "atletica_byte", displayName: "Atlética Byte" },
  { id: 21, slug: "dragoes_de_sao_carlos", displayName: "Dragões de São Carlos" },
];

export const PLAYERS = [
  { id: 101, gameName: "Vento", tagLine: "BR1" },
  { id: 102, gameName: "Faisca", tagLine: "SCL" },
  { id: 103, gameName: "Nevoa", tagLine: "777" },
  { id: 104, gameName: "Trava", tagLine: "BR2" },
  { id: 105, gameName: "Radar", tagLine: "USP" },
];

const AGENT_LIST: Array<[number, string, string]> = [
  [1, "Jett", "Duelista"],
  [2, "Raze", "Duelista"],
  [3, "Sova", "Iniciador"],
  [4, "Fade", "Iniciador"],
  [5, "Omen", "Controlador"],
  [6, "Clove", "Controlador"],
  [7, "Killjoy", "Sentinela"],
  [8, "Cypher", "Sentinela"],
];
export const AGENTS: ApiAgent[] = AGENT_LIST.map(([id, name, role]) => ({
  id,
  name,
  role,
  abilities: { grenade: "C", ability1: "Q", ability2: "E", ultimate: "X" },
}));
const agent = (name: string) => {
  const a = AGENTS.find((x) => x.name === name)!;
  return { id: a.id, name: a.name, role: a.role };
};

export const meFor = (role: "coach" | "player" | "admin"): Me => ({
  id: { coach: 1, player: 2, admin: 3 }[role],
  email: { coach: "coach@salatatica.dev", player: "jogador@salatatica.dev", admin: "admin@salatatica.dev" }[role],
  role,
  player: role === "player" ? PLAYERS[0]! : null,
  // Admin não pertence a time: escolhe qual analisar
  team: role === "admin" ? null : TEAM,
});

/** Contas iniciais da tela de admin; a lista é editada em memória pelos handlers. */
export const initialAdminUsers = (): AdminUser[] => [
  { id: 1, email: "coach@salatatica.dev", role: "coach", playerId: null, teamId: TEAM.id, createdAt: "2026-10-20T12:00:00.000Z" },
  { id: 2, email: "jogador@salatatica.dev", role: "player", playerId: PLAYERS[0]!.id, teamId: TEAM.id, createdAt: "2026-10-20T12:00:00.000Z" },
  { id: 3, email: "admin@salatatica.dev", role: "admin", playerId: null, teamId: null, createdAt: "2026-10-20T12:00:00.000Z" },
  { id: 4, email: "coach.lobos@salatatica.dev", role: "coach", playerId: null, teamId: OPPONENTS[0]!.id, createdAt: "2026-10-21T12:00:00.000Z" },
];

export const TEAMS: TeamSummary[] = [
  { team: TEAM, matches: 18, wins: 11, winRate: 0.611 },
  ...OPPONENTS.map((team, i) => ({ team, matches: 14 + i * 2, wins: 7 + i, winRate: (7 + i) / (14 + i * 2) })),
];

export const TEAM_DETAIL: TeamDetail = {
  team: TEAM,
  matches: 18,
  wins: 11,
  winRate: 0.611,
  rosters: [
    {
      tournament: { id: 3, name: "Univavá Classificatória 3" },
      players: PLAYERS.map((player, i) => ({ player, matches: 18 - (i === 4 ? 4 : 0) })),
    },
  ],
  maps: [
    { map: map("ascent"), matches: 6, wins: 5, attackRoundWinRate: 0.56, defenseRoundWinRate: 0.61 },
    { map: map("lotus"), matches: 5, wins: 3, attackRoundWinRate: 0.49, defenseRoundWinRate: 0.55 },
    { map: map("haven"), matches: 4, wins: 2, attackRoundWinRate: 0.44, defenseRoundWinRate: 0.52 },
    { map: map("split"), matches: 3, wins: 1, attackRoundWinRate: 0.38, defenseRoundWinRate: 0.47 },
  ],
};

const BUY_TYPES = ["pistol", "eco", "semi_eco", "half_buy", "full_buy"] as const;
const BUY_WIN = { pistol: 0.58, eco: 0.14, semi_eco: 0.22, half_buy: 0.41, full_buy: 0.62 };
export const TEAM_ECONOMY: TeamEconomy = {
  byBuyType: BUY_TYPES.map((buyType, i) => ({
    buyType,
    rounds: [36, 41, 28, 47, 172][i]!,
    winRate: BUY_WIN[buyType],
    averageLoadout: [800, 1200, 2100, 3300, 4600][i]!,
    averageSpent: [800, 400, 1500, 2600, 3900][i]!,
    averageBank: [0, 3800, 2400, 1300, 2200][i]!,
  })),
  matrix: BUY_TYPES.flatMap((buyType) =>
    BUY_TYPES.map((opponentBuy) => {
      const edge = BUY_TYPES.indexOf(buyType) - BUY_TYPES.indexOf(opponentBuy);
      const winRate = Math.min(0.9, Math.max(0.08, 0.5 + edge * 0.13));
      return { buyType, opponentBuy, rounds: 6 + ((edge + 5) % 7) * 4, winRate, expectedWinRate: 0.5 + edge * 0.12 };
    }),
  ),
  flags: [
    {
      flag: "force_after_pistol_loss",
      scope: "team",
      player: null,
      count: 9,
      winRate: 0.22,
      expectedWinRate: 0.35,
      examples: [
        { matchId: 9001, number: 2 },
        { matchId: 9004, number: 14 },
      ],
    },
    {
      flag: "saved_with_high_bank",
      scope: "player",
      player: PLAYERS[3]!,
      count: 6,
      winRate: 0.17,
      expectedWinRate: 0.31,
      examples: [{ matchId: 9002, number: 9 }],
    },
  ],
};

const insight = (i: Omit<Insight, "examples" | "isEstimate" | "map" | "side"> & Partial<Insight>): Insight => ({
  map: null,
  side: null,
  isEstimate: false,
  examples: [
    { matchId: 9001, number: 7 },
    { matchId: 9003, number: 18 },
  ],
  ...i,
});

export const TEAM_INSIGHTS: Insight[] = [
  insight({
    id: 1,
    kind: "economy",
    polarity: "negative",
    severity: 5,
    title: "Force depois de perder o pistol custa caro",
    body: "Vocês forçam a compra no round 2 em 9 de 12 pistols perdidos e vencem só 22% desses rounds, contra 35% esperado.",
    metricValue: 0.22,
    baselineValue: 0.35,
    sampleSize: 9,
    confidence: 0.71,
  }),
  insight({
    id: 2,
    kind: "map",
    polarity: "positive",
    severity: 4,
    title: "Defesa da Ascent é o ponto forte",
    body: "Vocês vencem 61% dos rounds de defesa na Ascent, 9 p.p. acima da média do campeonato.",
    map: map("ascent"),
    side: "defense",
    metricValue: 0.61,
    baselineValue: 0.52,
    sampleSize: 74,
    confidence: 0.83,
  }),
  insight({
    id: 3,
    kind: "rotation",
    polarity: "negative",
    severity: 4,
    title: "Rotações sem informação no Lotus",
    body: "Em 7 retakes do C, a rotação começou antes de qualquer contato no site. O time perdeu 6.",
    map: map("lotus"),
    side: "defense",
    metricValue: 0.14,
    baselineValue: 0.38,
    sampleSize: 7,
    confidence: 0.58,
    isEstimate: true,
  }),
  insight({
    id: 4,
    kind: "combo",
    polarity: "positive",
    severity: 3,
    title: "Sova e Raze juntos abrem o site",
    body: "Quando a flecha do Sova e o Boom Bot da Raze saem no mesmo round, o primeiro abate é de vocês em 68% das vezes.",
    metricValue: 0.68,
    baselineValue: 0.5,
    sampleSize: 31,
    confidence: 0.66,
    isEstimate: true,
  }),
];

export const PLAYER_INSIGHTS: Insight[] = [
  insight({
    id: 11,
    kind: "repetitive_pattern",
    polarity: "negative",
    severity: 5,
    title: "Você entra primeiro sem trade no B",
    body: "Em 14 rounds de ataque no B você foi o primeiro a morrer sem ninguém para trocar. O time venceu só 3 deles.",
    metricValue: 0.21,
    baselineValue: 0.45,
    sampleSize: 14,
    confidence: 0.74,
  }),
  insight({
    id: 12,
    kind: "agent",
    polarity: "positive",
    severity: 4,
    title: "Sua Jett rende mais na Ascent",
    body: "Com Jett na Ascent seu K/D é 1,38, contra 1,05 nos outros mapas.",
    map: map("ascent"),
    metricValue: 1.38,
    baselineValue: 1.05,
    sampleSize: 6,
    confidence: 0.62,
  }),
  insight({
    id: 13,
    kind: "pressure",
    polarity: "neutral",
    severity: 3,
    title: "Clutches 1 contra 2 equilibrados",
    body: "Você venceu 4 de 11 situações de 1 contra 2, perto da média do campeonato (33%).",
    metricValue: 0.36,
    baselineValue: 0.33,
    sampleSize: 11,
    confidence: 0.4,
  }),
];

export const MAP_STATS = (mapId: number): MapStats => ({
  mapId,
  matches: 42,
  rounds: 951,
  sides: [
    { side: "attack", roundWinRate: 0.47 },
    { side: "defense", roundWinRate: 0.53 },
  ],
  sites: [
    { site: "A", plants: 188, plantShare: 0.46, attackWinRateAfterPlant: 0.64 },
    { site: "B", plants: 221, plantShare: 0.54, attackWinRateAfterPlant: 0.69 },
  ],
  agents: ["Jett", "Omen", "Sova", "Killjoy", "Raze"].map((n, i) => ({
    agent: agent(n),
    picks: 38 - i * 4,
    pickRate: (38 - i * 4) / 42,
    winRate: 0.55 - i * 0.02,
  })),
});

const totals = (kd: number, acs: number, matches: number) => {
  const rounds = matches * 22;
  const deaths = Math.round(rounds * 0.68);
  return {
    matches,
    rounds,
    roundWinRate: 0.53,
    acs,
    kd,
    kills: Math.round(deaths * kd),
    deaths,
    assists: Math.round(rounds * 0.21),
    adr: acs * 0.66,
    kast: 0.72,
    headshotRate: 0.24,
    firstKills: Math.round(rounds * 0.12),
    firstDeaths: Math.round(rounds * 0.1),
    clutchWins: 4,
    clutchAttempts: 11,
    multikills: 19,
  };
};

export const PLAYER_PROFILE = (id: number): PlayerProfile => {
  const player = PLAYERS.find((p) => p.id === id) ?? PLAYERS[0]!;
  return {
    player,
    teams: [{ team: TEAM, matches: 18, lastPlayedOn: "2026-10-12" }],
    totals: totals(1.12, 231, 18),
    topAgents: [
      { agent: agent("Jett"), matches: 11 },
      { agent: agent("Raze"), matches: 7 },
    ],
  };
};

export const PLAYER_STATS: PlayerStats = {
  overall: totals(1.12, 231, 18),
  byMap: [
    { map: map("ascent"), stats: totals(1.38, 262, 6) },
    { map: map("lotus"), stats: totals(1.04, 224, 5) },
    { map: map("haven"), stats: totals(0.96, 211, 4) },
    { map: map("split"), stats: totals(0.88, 198, 3) },
  ],
  byAgent: [
    { agent: agent("Jett"), stats: totals(1.21, 244, 11) },
    { agent: agent("Raze"), stats: totals(0.99, 212, 7) },
  ],
  bySide: [
    { side: "attack", stats: totals(1.05, 225, 18) },
    { side: "defense", stats: totals(1.19, 237, 18) },
  ],
  kdPerMatch: {
    mean: 1.12,
    median: 1.09,
    stdDev: 0.27,
    matches: Array.from({ length: 18 }, (_, i) => ({
      matchId: 9001 + i,
      playedOn: `2026-09-${String(10 + i).padStart(2, "0")}`,
      kd: Math.round((1.12 + Math.sin(i * 1.7) * 0.32) * 100) / 100,
    })),
  },
};

export const PLAYER_MATCHES: PlayerMatches = {
  items: Array.from({ length: 10 }, (_, i) => {
    const won = i % 3 !== 1;
    const opponent = OPPONENTS[i % OPPONENTS.length]!;
    const m = MAPS[[1, 5, 4, 7][i % 4]!]!;
    const kills = 14 + ((i * 7) % 10);
    const deaths = 12 + ((i * 5) % 7);
    return {
      matchId: 9010 - i,
      playedOn: `2026-10-${String(12 - i).padStart(2, "0")}`,
      map: m,
      team: TEAM,
      opponent,
      teamScore: won ? 13 : 9 + (i % 3),
      opponentScore: won ? 7 + (i % 5) : 13,
      won,
      agent: agent(i % 3 === 0 ? "Raze" : "Jett"),
      acs: 190 + ((i * 23) % 90),
      kills,
      deaths,
      assists: 3 + (i % 5),
      kd: Math.round((kills / deaths) * 100) / 100,
    };
  }),
  nextCursor: null,
};

export const MAPS_SUMMARY: MapSummary[] = MAPS.map((m, i) => ({ ...m, matches: 20 + ((i * 7) % 25), silhouetteQuality: "ok" }));

// Manchas em espaço 0..1 do minimapa da Ascent, sem rotação: bombs, mid e entradas
const BLOBS: Array<[number, number, number, number]> = [
  [0.29, 0.33, 0.06, 1],
  [0.73, 0.34, 0.06, 0.9],
  [0.52, 0.52, 0.08, 0.7],
  [0.29, 0.6, 0.05, 0.6],
  [0.68, 0.6, 0.05, 0.55],
  [0.5, 0.85, 0.07, 0.35],
];

export function heatmapFor(mapId: number, metric: Heatmap["metric"], resolution: Heatmap["resolution"]): Heatmap {
  const grid = 64;
  const cells: Heatmap["cells"] = [];
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      const px = (x + 0.5) / grid;
      const py = (y + 0.5) / grid;
      const v = BLOBS.reduce((s, [bx, by, r, w]) => s + w * Math.exp(-((px - bx) ** 2 + (py - by) ** 2) / (2 * r * r)), 0);
      if (v > 0.05) cells.push({ x, y, value: Math.round(v * 100) / 100, sampleSize: Math.round(v * 40) });
    }
  }
  return {
    mapId,
    metric,
    resolution,
    grid,
    maxValue: Math.max(...cells.map((c) => c.value)),
    cells: resolution === "cells" ? cells : [],
    zones:
      resolution === "zones"
        ? ["A Site", "B Site", "Mid Courtyard", "B Main", "A Main", "Attacker Spawn"].map((name, i) => ({
            zoneId: i + 1,
            name,
            value: BLOBS[i]![3],
            sampleSize: 40 + i * 9,
            tradeRate: 0.35 + i * 0.05,
            presence: 300 - i * 30,
            kills: 80 - i * 9,
            deaths: 72 - i * 7,
            firstKills: 18 - i,
            firstDeaths: 15 - i,
            tradedDeaths: 20 - i * 2,
          }))
        : [],
  };
}

// Análise de partida: uma partida na Ascent, três rounds e o replay com abates, plant e defuse
const ASCENT = map("ascent");
const RIVAL = OPPONENTS[0]!;
const RIVAL_PLAYERS = [
  { id: 201, gameName: "Lobo", tagLine: "UF1" },
  { id: 202, gameName: "Uivo", tagLine: "UF2" },
];

export const MATCH_ITEM: MatchList["items"][number] = {
  id: 9100,
  seriesId: 9000,
  game: "a",
  playedOn: "2026-10-12",
  startedAt: "2026-10-12T19:00:00.000Z",
  durationMs: 2_400_000,
  tournament: "Univavá",
  stage: { id: 3, name: "Classificatória 3" },
  map: ASCENT,
  red: { team: RIVAL, score: 9 },
  blue: { team: TEAM, score: 13 },
  winnerTeamId: TEAM.id,
};

export const MATCHES: MatchList = { items: [MATCH_ITEM], nextCursor: null };

const winCurve = (start: number, end: number): MatchRounds[number]["winProbability"] => [
  { tMs: 0, event: "start", attack: start },
  { tMs: 30_000, event: "kill", attack: (start + end) / 2 },
  { tMs: 70_000, event: "kill", attack: end },
];

export const MATCH_ROUNDS: MatchRounds = [0, 1, 2].map((n) => ({
  number: n,
  winnerTeamId: n === 1 ? RIVAL.id : TEAM.id,
  winnerSide: n === 1 ? "attack" : "defense",
  attackTeamId: RIVAL.id,
  defenseTeamId: TEAM.id,
  resultCode: n === 0 ? "Defuse" : "Elimination",
  plantSite: n === 0 ? "B" : null,
  plantTimeMs: n === 0 ? 45_000 : null,
  buys: [
    { teamId: RIVAL.id, buyType: n === 0 ? "pistol" : "full_buy", loadout: 3500 },
    { teamId: TEAM.id, buyType: n === 0 ? "pistol" : "full_buy", loadout: 3600 },
  ],
  winProbability: n === 1 ? winCurve(0.5, 0.95) : winCurve(0.5, 0.05),
}));

const pos = (playerId: number, side: "attack" | "defense", x: number, y: number) => ({ playerId, side, x, y, view: 0 });

export const ROUND_REPLAY = (n: number): RoundReplay => ({
  matchId: MATCH_ITEM.id,
  number: n,
  mapId: ASCENT.id,
  winnerTeamId: n === 1 ? RIVAL.id : TEAM.id,
  resultCode: n === 0 ? "Defuse" : "Elimination",
  players: [
    { player: RIVAL_PLAYERS[0]!, teamId: RIVAL.id, side: "attack", agent: agent("Raze"), loadout: 3900 },
    { player: RIVAL_PLAYERS[1]!, teamId: RIVAL.id, side: "attack", agent: agent("Omen"), loadout: 3500 },
    { player: PLAYERS[0]!, teamId: TEAM.id, side: "defense", agent: agent("Jett"), loadout: 3600 },
    { player: PLAYERS[1]!, teamId: TEAM.id, side: "defense", agent: agent("Killjoy"), loadout: 3400 },
  ],
  events: [
    {
      type: "kill",
      tMs: 12_000,
      killerId: PLAYERS[0]!.id,
      victimId: RIVAL_PLAYERS[0]!.id,
      kind: "enemy",
      damageType: "Weapon",
      weaponId: 1,
      abilitySlot: null,
      isFirstKill: true,
      isTrade: false,
      killerAt: { x: 0.3, y: 0.45 },
      victimAt: { x: 0.3, y: 0.6 },
      assistIds: [],
      positions: [pos(RIVAL_PLAYERS[1]!.id, "attack", 0.5, 0.8), pos(PLAYERS[0]!.id, "defense", 0.3, 0.45), pos(PLAYERS[1]!.id, "defense", 0.72, 0.35)],
    },
    { type: "plant", tMs: 45_000, playerId: RIVAL_PLAYERS[1]!.id, site: "B", at: { x: 0.29, y: 0.33 } },
    {
      type: "kill",
      tMs: 60_000,
      killerId: PLAYERS[1]!.id,
      victimId: RIVAL_PLAYERS[1]!.id,
      kind: "enemy",
      damageType: "Weapon",
      weaponId: 1,
      abilitySlot: null,
      isFirstKill: false,
      isTrade: true,
      killerAt: { x: 0.36, y: 0.36 },
      victimAt: { x: 0.31, y: 0.35 },
      assistIds: [],
      positions: [pos(PLAYERS[0]!.id, "defense", 0.3, 0.4), pos(PLAYERS[1]!.id, "defense", 0.36, 0.36)],
    },
    { type: "defuse", tMs: 70_000, playerId: PLAYERS[0]!.id, site: "B", at: null },
  ],
});
