import type { paths } from "./schema";

// Tipos derivados do openapi.json: se a API mudar, `npm run api:types` atualiza tudo aqui.

type Json<R> = R extends { content: { "application/json": infer B } } ? B : never;

/** Corpo da resposta 200 de um GET. */
export type GetResponse<P extends keyof paths> = paths[P] extends { get: { responses: { 200: infer R } } } ? Json<R> : never;

/** Filtros (query string) aceitos por um GET. */
export type GetQuery<P extends keyof paths> = paths[P] extends { get: { parameters: { query?: infer Q } } }
  ? NonNullable<Q>
  : never;

/** Corpo enviado num POST ou PUT. */
export type Body<P extends keyof paths, M extends "post" | "put"> = paths[P] extends {
  [K in M]: { requestBody?: { content: { "application/json": infer B } } };
}
  ? B
  : never;

// Auth
export type Me = GetResponse<"/me">;
export type Role = Me["role"];
export type LoginInput = Body<"/auth/login", "post">;

// Catálogo
export type Tournament = GetResponse<"/tournaments">[number];
export type MapSummary = GetResponse<"/maps">[number];
export type ApiAgent = GetResponse<"/agents">[number];
export type ApiWeapon = GetResponse<"/weapons">[number];

// Times
export type TeamSummary = GetResponse<"/teams">[number];
export type TeamDetail = GetResponse<"/teams/{id}">;
export type TeamEconomy = GetResponse<"/teams/{id}/economy">;
export type TeamStrategies = GetResponse<"/teams/{id}/strategies">;
export type TeamRotations = GetResponse<"/teams/{id}/rotations">;
export type TeamCombos = GetResponse<"/teams/{id}/combos">;
export type TeamPressure = GetResponse<"/teams/{id}/pressure">;

// Jogadores
export type PlayerSummary = GetResponse<"/players">;
export type PlayerProfile = GetResponse<"/players/{id}">;
export type PlayerStats = GetResponse<"/players/{id}/stats">;
export type PlayerMatches = GetResponse<"/players/{id}/matches">;
export type PlayerAgents = GetResponse<"/players/{id}/agents">;
export type PlayerWeapons = GetResponse<"/players/{id}/weapons">;
export type PlayerPatterns = GetResponse<"/players/{id}/patterns">;
export type PlayerPressure = GetResponse<"/players/{id}/pressure">;
export type PlayerAbilities = GetResponse<"/players/{id}/abilities">;

// Partidas
export type MatchList = GetResponse<"/matches">;
export type MatchDetail = GetResponse<"/matches/{id}">;
export type MatchRounds = GetResponse<"/matches/{id}/rounds">;
export type RoundReplay = GetResponse<"/matches/{id}/rounds/{n}/replay">;

// Mapas e gerais
export type MapStats = GetResponse<"/maps/{id}/stats">;
export type Heatmap = GetResponse<"/maps/{id}/heatmap">;
export type HeatmapQuery = GetQuery<"/maps/{id}/heatmap">;
export type Insight = GetResponse<"/insights">[number];
export type InsightQuery = GetQuery<"/insights">;
export type WeaponStats = GetResponse<"/weapons/stats">;
export type AgentStats = GetResponse<"/agents/stats">;

// Playbook
export type PlaybookStrategy = GetResponse<"/playbook/{id}">;
export type PlaybookInput = Body<"/teams/{id}/playbook", "post">;

/** Filtros comuns dos endpoints analíticos (campeonato, etapa, mapa, lado, time, agente). */
export type AnalyticsFilters = GetQuery<"/players/{id}/stats">;
