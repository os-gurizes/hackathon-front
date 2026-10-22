import { api, unwrap } from "../client";
import type { GetQuery } from "../types";

export const playersService = {
  list: (query?: GetQuery<"/players">) => unwrap(api.GET("/players", { params: { query } })),
  get: (id: number) => unwrap(api.GET("/players/{id}", { params: { path: { id } } })),
  stats: (id: number, query?: GetQuery<"/players/{id}/stats">) =>
    unwrap(api.GET("/players/{id}/stats", { params: { path: { id }, query } })),
  matches: (id: number, query?: GetQuery<"/players/{id}/matches">) =>
    unwrap(api.GET("/players/{id}/matches", { params: { path: { id }, query } })),
  agents: (id: number, query?: GetQuery<"/players/{id}/agents">) =>
    unwrap(api.GET("/players/{id}/agents", { params: { path: { id }, query } })),
  weapons: (id: number, query?: GetQuery<"/players/{id}/weapons">) =>
    unwrap(api.GET("/players/{id}/weapons", { params: { path: { id }, query } })),
  // Privados: só o próprio jogador e o coach do time dele
  patterns: (id: number, query?: GetQuery<"/players/{id}/patterns">) =>
    unwrap(api.GET("/players/{id}/patterns", { params: { path: { id }, query } })),
  pressure: (id: number, query?: GetQuery<"/players/{id}/pressure">) =>
    unwrap(api.GET("/players/{id}/pressure", { params: { path: { id }, query } })),
  abilities: (id: number, query?: GetQuery<"/players/{id}/abilities">) =>
    unwrap(api.GET("/players/{id}/abilities", { params: { path: { id }, query } })),
};
