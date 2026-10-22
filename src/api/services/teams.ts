import { api, unwrap } from "../client";
import type { GetQuery } from "../types";

export const teamsService = {
  list: (query?: GetQuery<"/teams">) => unwrap(api.GET("/teams", { params: { query } })),
  get: (id: number) => unwrap(api.GET("/teams/{id}", { params: { path: { id } } })),
  economy: (id: number, query?: GetQuery<"/teams/{id}/economy">) =>
    unwrap(api.GET("/teams/{id}/economy", { params: { path: { id }, query } })),
  strategies: (id: number, query?: GetQuery<"/teams/{id}/strategies">) =>
    unwrap(api.GET("/teams/{id}/strategies", { params: { path: { id }, query } })),
  rotations: (id: number, query?: GetQuery<"/teams/{id}/rotations">) =>
    unwrap(api.GET("/teams/{id}/rotations", { params: { path: { id }, query } })),
  combos: (id: number, query?: GetQuery<"/teams/{id}/combos">) =>
    unwrap(api.GET("/teams/{id}/combos", { params: { path: { id }, query } })),
  pressure: (id: number, query?: GetQuery<"/teams/{id}/pressure">) =>
    unwrap(api.GET("/teams/{id}/pressure", { params: { path: { id }, query } })),
};
