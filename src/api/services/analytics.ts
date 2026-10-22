import { api, unwrap } from "../client";
import type { GetQuery, HeatmapQuery, InsightQuery } from "../types";

export const mapsService = {
  stats: (id: number, query?: GetQuery<"/maps/{id}/stats">) =>
    unwrap(api.GET("/maps/{id}/stats", { params: { path: { id }, query } })),
  heatmap: (id: number, query: HeatmapQuery) => unwrap(api.GET("/maps/{id}/heatmap", { params: { path: { id }, query } })),
};

export const statsService = {
  weapons: (query?: GetQuery<"/weapons/stats">) => unwrap(api.GET("/weapons/stats", { params: { query } })),
  agents: (query?: GetQuery<"/agents/stats">) => unwrap(api.GET("/agents/stats", { params: { query } })),
};

export const insightsService = {
  /** Cartões de insight ordenados por severidade. `scope` é "player" ou "team". */
  list: (query: InsightQuery) => unwrap(api.GET("/insights", { params: { query } })),
};
